import { transform } from "sucrase"
import * as defaultCompiler from "vue/compiler-sfc"
import type { BindingMetadata, CompilerOptions, SFCDescriptor } from "vue/compiler-sfc"
import hashId from "hash-sum"
import { CodeFile, type SFCOptions } from "./types"

export const COMP_IDENTIFIER = `__sfc__`

export const compiler = defaultCompiler

async function transformTS(src: string) {
  return transform(src, {
    transforms: ["typescript"],
  }).code
}

export async function reCompile(file: CodeFile, sfcOptions?: SFCOptions): Promise<CodeFile> {
  return await compile(file.filename, file.code, sfcOptions)
}

export async function compile(filename: string, code: string, sfcOptions?: SFCOptions): Promise<CodeFile> {
  const dst: CodeFile = new CodeFile(filename, code)

  if (filename.endsWith(".css")) {
    dst.compiled.css = code
    return dst
  }

  if (filename.endsWith(".js") || filename.endsWith(".ts")) {
    if (filename.endsWith(".ts")) {
      code = await transformTS(code)
    }
    dst.compiled.js = dst.compiled.ssr = code
    return dst
  }

  if (filename.endsWith(".json")) {
    let parsed
    try {
      parsed = JSON.parse(code)
    } catch (err: any) {
      dst.error = [err.message]
      return dst
    }
    dst.compiled.js = dst.compiled.ssr = `export default ${JSON.stringify(parsed)}`
    return dst
  }

  if (!filename.endsWith(".vue")) {
    return dst
  }

  const id: string = hashId(filename)
  const { errors, descriptor } = compiler.parse(code, {
    filename,
    sourceMap: true,
    templateParseOptions: sfcOptions?.template?.compilerOptions,
  })

  if (errors.length) {
    dst.error = errors.map(v => v.message)
    return dst
  }

  if (descriptor.styles.some(s => s.lang) || descriptor.template?.lang) {
    dst.error = [`lang="x" pre-processors for <template> or <style> are currently not ` + `supported.`]
    return dst
  }

  const scriptLang = descriptor.script?.lang ?? descriptor.scriptSetup?.lang
  const isTS = scriptLang === "ts"
  if (scriptLang && !isTS) {
    dst.error = [`Only lang="ts" is supported for <script> blocks.`]
    return dst
  }

  const hasScoped = descriptor.styles.some(s => s.scoped)
  let clientCode = ""
  let ssrCode = ""

  const appendSharedCode = (code: string) => {
    clientCode += code
    ssrCode += code
  }

  let clientScript: string
  let bindings: BindingMetadata | undefined
  try {
    ;[clientScript, bindings] = await doCompileScript(descriptor, id, false, isTS, sfcOptions)
  } catch (e: any) {
    dst.error = [e.stack.split("\n").join("\n")]
    return dst
  }

  clientCode += clientScript

  // script ssr needs to be performed if :
  // 1.using <script setup> where the render filename is inlined.
  // 2.using cssVars, as it do not need to be injected during SSR.
  if (descriptor.scriptSetup || descriptor.cssVars.length > 0) {
    try {
      const ssrScriptResult = await doCompileScript(descriptor, id, true, isTS, sfcOptions)
      ssrCode += ssrScriptResult[0]
    } catch (e: any) {
      ssrCode = `/* SSR compile error: ${e} */`
    }
  } else {
    // the script result will be identical.
    ssrCode += clientScript
  }

  // template
  // only need dedicated compilation if not using <script setup>
  if (descriptor.template && (!descriptor.scriptSetup || sfcOptions?.script?.inlineTemplate === false)) {
    const clientTemplateResult = await doCompileTemplate(descriptor, id, bindings, false, isTS, sfcOptions)
    if (Array.isArray(clientTemplateResult)) {
      dst.error = clientTemplateResult.map(v => {
        if (typeof v === "string") {
          return v
        }
        return v.message
      })
      return dst
    }
    clientCode += `;${clientTemplateResult}`

    const ssrTemplateResult = await doCompileTemplate(descriptor, id, bindings, true, isTS)
    if (typeof ssrTemplateResult === "string") {
      // ssr compile failure is fine
      ssrCode += `;${ssrTemplateResult}`
    } else {
      const e = ssrTemplateResult.length > 0 ? ssrTemplateResult[0] : ""
      ssrCode = `/* SSR compile error: ${JSON.stringify(e)} */`
    }
  }

  if (hasScoped) {
    appendSharedCode(`\n${COMP_IDENTIFIER}.__scopeId = ${JSON.stringify(`data-v-${id}`)}`)
  }

  // styles
  const ceFilter = sfcOptions?.script?.customElement ?? /\.ce\.vue$/
  function isCustomElement(filters: typeof ceFilter): boolean {
    if (typeof filters === "boolean") {
      return filters
    }
    if (typeof filters === "function") {
      return filters(filename)
    }
    return filters.test(filename)
  }
  const isCE = isCustomElement(ceFilter)

  let css = ""
  const styles: string[] = []
  for (const style of descriptor.styles) {
    if (style.module) {
      dst.error = [`<style module> is not supported in the playground.`]
      return dst
    }

    const styleResult = await compiler.compileStyleAsync({
      ...sfcOptions?.style,
      source: style.content,
      filename,
      id,
      scoped: style.scoped,
      modules: !!style.module,
    })
    if (styleResult.errors.length) {
      // postcss uses pathToFileURL which isn't polyfilled in the browser
      // ignore these errors for now
      if (!styleResult.errors[0].message.includes("pathToFileURL")) {
        dst.error = styleResult.errors.map(v => v.message)
      }
      // proceed even if css compile errors
    } else {
      isCE ? styles.push(styleResult.code) : (css += styleResult.code + "\n")
    }
  }
  if (css) {
    dst.compiled.css = css.trim()
  } else {
    dst.compiled.css = isCE
      ? (dst.compiled.css =
          "/* The component style of the custom element will be compiled into the component object */")
      : "/* No <style> tags present */"
  }

  if (clientCode || ssrCode) {
    const ceStyles = isCE ? `\n${COMP_IDENTIFIER}.styles = ${JSON.stringify(styles)}` : ""
    appendSharedCode(
      `\n${COMP_IDENTIFIER}.__file = ${JSON.stringify(filename)}` + ceStyles + `\nexport default ${COMP_IDENTIFIER}`
    )
    dst.compiled.js = clientCode.trimStart()
    dst.compiled.ssr = ssrCode.trimStart()
  }

  return dst
}

async function doCompileScript(
  descriptor: SFCDescriptor,
  id: string,
  ssr: boolean,
  isTS: boolean,
  sfcOptions?: SFCOptions
): Promise<[code: string, bindings: BindingMetadata | undefined]> {
  if (descriptor.script || descriptor.scriptSetup) {
    const expressionPlugins: CompilerOptions["expressionPlugins"] = isTS ? ["typescript"] : undefined
    const compiledScript = compiler.compileScript(descriptor, {
      inlineTemplate: true,
      ...sfcOptions?.script,
      id,
      templateOptions: {
        ...sfcOptions?.template,
        ssr,
        ssrCssVars: descriptor.cssVars,
        compilerOptions: {
          ...sfcOptions?.template?.compilerOptions,
          expressionPlugins,
        },
      },
    })
    let code = ""
    if (compiledScript.bindings) {
      code += `\n/* Analyzed bindings: ${JSON.stringify(compiledScript.bindings, null, 2)} */`
    }
    code += `\n` + compiler.rewriteDefault(compiledScript.content, COMP_IDENTIFIER, expressionPlugins)

    const _script = descriptor.script ?? descriptor.scriptSetup
    if (_script?.lang === "ts") {
      code = await transformTS(code)
    }

    return [code, compiledScript.bindings]
  } else {
    return [`\nconst ${COMP_IDENTIFIER} = {}`, undefined]
  }
}

async function doCompileTemplate(
  descriptor: SFCDescriptor,
  id: string,
  bindingMetadata: BindingMetadata | undefined,
  ssr: boolean,
  isTS: boolean,
  sfcOptions?: SFCOptions
) {
  const { code: _code, errors } = compiler.compileTemplate({
    isProd: false,
    ...sfcOptions?.template,
    ast: descriptor.template?.ast,
    source: descriptor.template?.content ?? "",
    filename: descriptor.filename,
    id,
    scoped: descriptor.styles.some(s => s.scoped),
    slotted: descriptor.slotted,
    ssr,
    ssrCssVars: descriptor.cssVars,
    compilerOptions: {
      ...sfcOptions?.template?.compilerOptions,
      bindingMetadata,
      expressionPlugins: isTS ? ["typescript"] : undefined,
    },
  })
  if (errors.length) {
    return errors
  }
  const fnName = ssr ? `ssrRender` : `render`
  let code = _code
  code =
    `\n${code.replace(/\nexport (function|const) (render|ssrRender)/, `$1 ${fnName}`)}` +
    `\n${COMP_IDENTIFIER}.${fnName} = ${fnName}`

  if ((descriptor.script || descriptor.scriptSetup)?.lang === "ts") {
    code = await transformTS(code)
  }
  return code
}

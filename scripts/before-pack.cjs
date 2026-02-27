const { Arch } = require("electron-builder")

const platformMapping = {
  darwin: ["x64", "arm64"],
  win32: ["x64", "arm64", "ia32"],
  linux: ["x64", "arm64", "riscv64", "ppc64", "s390x"],
  linuxmusl: ["x64", "arm64", "riscv64", "ppc64", "s390x"],
  android: ["x64", "arm64"],
  wasm32: [],
}
function getArchString(arch) {
  switch (arch) {
    case Arch.x64:
      return "x64"
    case Arch.arm64:
      return "arm64"
    case Arch.armv7l:
      return "armv7l"
    case Arch.ia32:
      return "ia32"
    default:
      return "unknown"
  }
}
function pickExcludeArchs(platform, arch) {
  const excludePatterns = []
  if (!platform || !arch) {
    return excludePatterns
  }
  if (!platformMapping[platform]) {
    return excludePatterns
  }
  if (!platformMapping[platform].includes(arch)) {
    return excludePatterns
  }
  Object.keys(platformMapping).forEach(otherPlatform => {
    if (otherPlatform !== platform) {
      platformMapping[otherPlatform].forEach(otherArch => {
        const normalizedArch = otherArch === "x86_64" ? "x64" : otherArch
        excludePatterns.push(`${otherPlatform}${normalizedArch ? "-" + normalizedArch : ""}`)
      })
    }
  })
  platformMapping[platform].forEach(otherArch => {
    if (otherArch !== arch) {
      const normalizedArch = otherArch === "x86_64" ? "x64" : otherArch
      const normalizedTargetArch = arch === "x86_64" ? "x64" : arch
      if (normalizedArch !== normalizedTargetArch) {
        excludePatterns.push(`${platform}${normalizedArch ? "-" + normalizedArch : ""}`)
      }
    }
  })
  return excludePatterns
}
/**
 * `@lancedb/lancedb` dependency
 */
function patch_lanceDB(context, platform, arch) {
  let fieldFiles = context.packager.config.files[0].filter
  const excludePlatforms = pickExcludeArchs(platform, arch)
  const excludeRules = excludePlatforms.map(p => {
    return `!node_modules/@lancedb/lancedb-${p}*/**`
  })
  fieldFiles.push(...excludeRules)
}
/**
 * `@napi-rs` dependency
 */
function patch_napi_rs(context, platform, arch) {
  let fieldFiles = context.packager.config.files[0].filter
  const excludePlatforms = pickExcludeArchs(platform, arch)
  const excludeRules = excludePlatforms.map(p => {
    return `!node_modules/@napi-rs/canvas-${p}*/**`
  })
  fieldFiles.push(...excludeRules)
}
/**
 * `sharp` dependency
    "@img/sharp-darwin-arm64": "0.34.5",
    "@img/sharp-darwin-x64": "0.34.5",
    "@img/sharp-libvips-darwin-arm64": "1.2.4",
    "@img/sharp-libvips-darwin-x64": "1.2.4",
    "@img/sharp-libvips-linux-arm": "1.2.4",
    "@img/sharp-libvips-linux-arm64": "1.2.4",
    "@img/sharp-libvips-linux-ppc64": "1.2.4",
    "@img/sharp-libvips-linux-riscv64": "1.2.4",
    "@img/sharp-libvips-linux-s390x": "1.2.4",
    "@img/sharp-libvips-linux-x64": "1.2.4",
    "@img/sharp-libvips-linuxmusl-arm64": "1.2.4",
    "@img/sharp-libvips-linuxmusl-x64": "1.2.4",
    "@img/sharp-linux-arm": "0.34.5",
    "@img/sharp-linux-arm64": "0.34.5",
    "@img/sharp-linux-ppc64": "0.34.5",
    "@img/sharp-linux-riscv64": "0.34.5",
    "@img/sharp-linux-s390x": "0.34.5",
    "@img/sharp-linux-x64": "0.34.5",
    "@img/sharp-linuxmusl-arm64": "0.34.5",
    "@img/sharp-linuxmusl-x64": "0.34.5",
    "@img/sharp-wasm32": "0.34.5",
    "@img/sharp-win32-arm64": "0.34.5",
    "@img/sharp-win32-ia32": "0.34.5",
    "@img/sharp-win32-x64": "0.34.5"
 */
function patch_sharp(context, platform, arch) {
  let fieldFiles = context.packager.config.files[0].filter
  const excludePlatforms = pickExcludeArchs(platform, arch)
  const excludeRules = excludePlatforms
    .map(p => {
      return [`!node_modules/@img/sharp-${p}*/**`, `!node_modules/@img/sharp-libvips-${p}*/**`]
    })
    .flat()
  excludeRules.push(`!node_modules/@img/sharp-wasm32*`)
  excludeRules.push(`!node_modules/@img/sharp-linux-arm*`)
  fieldFiles.push(...excludeRules)
}

exports.default = async function (context) {
  // const fieldAsarUnpack = context.packager.config.asarUnpack // asarUnpack filed in `electron-builder.yml`
  const platform = context.electronPlatformName // win32...
  const arch = getArchString(context.arch) // x64...
  console.log(`[package platform] ${platform}-${arch}`)
  patch_lanceDB(context, platform, arch)
  patch_napi_rs(context, platform, arch)
  patch_sharp(context, platform, arch)
}

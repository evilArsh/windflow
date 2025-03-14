import { type ScriptModules } from "./common"

export function useVueModules(): ScriptModules {
  let initHTML: string = `loading...`
  let mainEntry: string = "App.vue"
  let modules: string[] = []

  function _stepInit() {
    return `window.__modules__ = {}
    window.process = { env: {} }
    window.__css__ = []
    window.__export__ = (mod, key, get) => {
      Object.defineProperty(mod, key, {
        enumerable: true,
        configurable: true,
        get,
      })
    }
    window.__dynamic_import__ = (key) => {return Promise.resolve(window.__modules__[key])}
    if (window.__app__) window.__app__.unmount()
    document.body.innerHTML = '<div id="app">${initHTML}</div>'`
  }
  function _stepCss() {
    return `document.querySelectorAll('style[css]').forEach(el => el.remove())
    document.head.insertAdjacentHTML('beforeend', window.__css__.map(s => \`<style css>\${s}</style>\`).join('\\n'))`
  }

  function _stepMain() {
    return `import { createApp as _createApp } from "vue"
    import { createPinia } from "pinia"
    const _mount = () => {
      const AppComponent = __modules__["${mainEntry}"].default
      const app = window.__app__ = _createApp(AppComponent)
      if (!app.config.hasOwnProperty('unwrapInjectedRef')) {
        app.config.unwrapInjectedRef = true
      }
      app.config.errorHandler = e => console.error(e)
      // app.mount("#app")
      app.use(createPinia())
      app.mount(document.body)
    }
    if (window.__ssr_promise__) {
      window.__ssr_promise__.then(_mount)
    } else {
      _mount()
    }`
  }

  function addModules(codes: string | string[]): void {
    if (Array.isArray(codes)) {
      modules = modules.concat(codes)
    } else {
      modules.push(codes)
    }
  }

  function clearModules(): void {
    modules = []
  }

  function getModules(): string[] {
    return [_stepInit(), ...modules, _stepCss(), _stepMain()]
  }

  function setInitHTML(html: string): void {
    initHTML = html
  }
  function setMain(mainFilename: string) {
    mainEntry = mainFilename
  }
  return {
    addModules,
    clearModules,
    getModules,
    setInitHTML,
    setMain,
  }
}

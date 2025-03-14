import { CUSTOM_COMPONENT_ATTR_ID, CUSTOM_COMPONENT_NAME, delSandbox, getSandbox } from "./common"

/**
 * 定义Web Component 组件
 */
export function defineSandBoxComponent() {
  const customElements = window.customElements
  if (customElements && !customElements.get(CUSTOM_COMPONENT_NAME)) {
    customElements.define(
      CUSTOM_COMPONENT_NAME,
      class CESandbox extends HTMLElement {
        public shadow: ShadowRoot | undefined
        async connectedCallback() {
          this.shadow = this.attachShadow({ mode: "open" })
          const selfId = this.getAttribute(CUSTOM_COMPONENT_ATTR_ID)
          if (!selfId) {
            console.error(
              `[error when init ${CUSTOM_COMPONENT_NAME}]`,
              `attribute: ${CUSTOM_COMPONENT_ATTR_ID} not exist`
            )
            return
          }
          const sandbox = getSandbox(selfId)
          if (sandbox) {
            sandbox.setShadowRoot(this.shadow)
          }
          // console.log("元素被插入到DOM")
        }
        disconnectedCallback() {
          console.log(`[${CUSTOM_COMPONENT_NAME} unmount]`)
          const selfId = this.getAttribute(CUSTOM_COMPONENT_ATTR_ID)
          if (selfId) {
            const sandbox = getSandbox(selfId)
            sandbox?.destroy()
            delSandbox(selfId)
          }
        }
      }
    )
  }
}

/**
 * 创建一个 Web Component 组件
 * @param id 保证唯一性
 */
export function createSandBoxComponent(id: string): HTMLElement {
  const el = window.document.createElement(CUSTOM_COMPONENT_NAME)
  el.setAttribute(CUSTOM_COMPONENT_ATTR_ID, id)
  return el
}

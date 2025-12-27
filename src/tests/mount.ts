import type { InjectionKey, Ref } from "vue"
import { createApp, defineComponent, h, provide, shallowRef } from "vue"
import { createPinia } from "pinia"
import useSvgIcon from "../renderer/src/app/hooks/useSvgIcon"
// import router from "../renderer/src/routes/index"
// import useI18n from "../renderer/src/app/hooks/useI18n"
// import useSize from "../renderer/src/app/hooks//useSize"
// import useShiki from "../renderer/src/app/hooks//useShiki"
type InstanceType<V> = V extends { new (...arg: any[]): infer X } ? X : never
type VM<V> = InstanceType<V> & { unmount: () => void }

export function mount<V>(Comp: V) {
  const el = document.createElement("div")
  const app = createApp(Comp as any)
  const pinia = createPinia()
  app.use(pinia)
  // app.use(router)
  // useShiki(app)
  // useI18n(app)
  // useSize(app)
  useSvgIcon(app)
  const unmount = () => app.unmount()
  const comp = app.mount(el) as any as VM<V>
  comp.unmount = unmount
  return comp
}

export function useSetup<V>(setup: () => V) {
  const Comp = defineComponent({
    setup,
    render() {
      return h("div", [])
    },
  })

  return mount(Comp)
}

export const Key: InjectionKey<Ref<number>> = Symbol("num")

export function useInjectedSetup<V>(setup: () => V) {
  const Comp = defineComponent({
    setup,
    render() {
      return h("div", [])
    },
  })

  const Provider = defineComponent({
    components: Comp,
    setup() {
      provide(Key, shallowRef(1))
    },
    render() {
      return h(Comp)
    },
  })

  return mount(Provider)
}

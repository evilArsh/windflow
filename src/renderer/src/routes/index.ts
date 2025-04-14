import { createWebHistory, createRouter, type RouteRecordRaw } from "vue-router"
import * as localRoute from "@renderer/lib/local-route"

export const initNode = new localRoute.tpl.RouterTree({
  index: "/",
  layout: async () => await import("@renderer/components/ParentView/index.vue"),
  redirect: true,
  redirectToChild: true,
}).resolve(localRoute.fetch.fetchVue())

export const initRoutes = initNode.iter<RouteRecordRaw>(router => {
  return {
    path: router.path,
    redirect: router.redirect,
    children: [],
    component: router.component ?? undefined,
  } as RouteRecordRaw
})
const defaultPath = "/main/chat"
const router = createRouter({
  history: createWebHistory(),
  routes: [
    initRoutes,
    { path: "", redirect: defaultPath },
    { path: "/", redirect: defaultPath },
    { path: "/:pathMatch(.*)*", redirect: defaultPath },
  ],
})

router.beforeEach(async (_to, _from, next) => {
  next()
})
router.afterEach(async () => {})
export default router

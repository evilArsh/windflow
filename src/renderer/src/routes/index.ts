import { createWebHistory, createRouter, type RouteRecordRaw } from "vue-router"
import { RouterTree, fetchVue } from "@toolmain/libs"

const initNode = new RouterTree({
  index: "/",
  redirect: true,
}).resolve(fetchVue())
export const initRoutes = initNode.iter<RouteRecordRaw>(router => router as RouteRecordRaw)
console.log("[routes]", initRoutes)
const defaultPath = "/main/chat"
const router = createRouter({
  history: createWebHistory(),
  routes: [...initRoutes, { path: "", redirect: defaultPath }, { path: "/:pathMatch(.*)*", redirect: defaultPath }],
})
export default router

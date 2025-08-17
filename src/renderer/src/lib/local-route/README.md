# 用法

```typescript
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
console.log("[routes]", initRoutes)
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
export default router

```

## 相对路径用法

如果路径中存在以下结构

```typescript
|--views
|  |--static
|  |  |--xxxx
|  |--mobile
|  |  |--home
|  |  |  |--index.vue

```

默认为前缀为`/src/views/`，访问`home/index.vue`的路由为`/mobile/home/index`,如果想以`mobile`为根路径，即通过`/home/index`访问；可以调用`tpl.setPrefix("/src/views/mobile/")`修改路径前缀,此时`mobile`的同级的`static`目录将不可用

## 注意事项

```typescript
|--login
|  |--A
|  |  --index.vue
|  |--B
|  |  --index.vue

以上结构被解析为 `login/A/index` `login/B/index`

|--login
|  |--A
|  | --index.vue
|  |--B
|  | --index.vue
|--index.vue

以上结构被解析为 `login/A/index` `login/B/index` `login/index`
```

## FIXME

## TODO

- 最小化功能动态路由支持,开发中
- 文件夹命名为`subpages`,里面的页面均为子页面。`vue`中需要在父页面添加`<RouterView />`,`react`需要添加`<Outlet />`
- react：

  1. 支持动态添加一个组件，同时支持React-Route 中的 element,Component,lazy;
  2. 加入路由全局状态管理，以及持久化

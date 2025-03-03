import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { routes } from "@/router/routes";
import { setupAuthGuard } from "@/router/authGuard";

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// 设置全局路由守卫
setupAuthGuard(router);

export default router;

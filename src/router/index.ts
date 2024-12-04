import { createRouter, createWebHistory } from "vue-router";
import { routes } from "@/router/routes";
import store from "@/store";

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// 路由守卫中使用
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth) {
    // 只在需要认证的路由才检查登录状态
    const loginUser = await store.dispatch("user/getLoginUser");

    if (!loginUser) {
      next({
        path: "/user/login",
        query: { redirect: to.fullPath },
      });
      return;
    }
  }
  next();
});

export default router;

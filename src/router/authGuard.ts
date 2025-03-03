import {
  NavigationGuardNext,
  RouteLocationNormalized,
  Router,
} from "vue-router";
import store from "@/store";
import { Message } from "@arco-design/web-vue";
import checkAccess from "@/access/checkAccess";

// 定义不需要登录即可访问的白名单路由路径
export const publicRoutes = [
  "/",
  "/user/login",
  "/user/register",
  "/user/smsLogin",
  //   "/questions",
  //   "/resource",
  "/noAuth",
  //   "/view/question", // 浏览题目页面作为公共页面
  //   "/resource-preview", // 资源预览作为公共页面
];

/**
 * 全局路由前置守卫
 * @param to 目标路由
 * @param from 来源路由
 * @param next 路由导航函数
 */
export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  // 首先检查是否是公共路由
  if (publicRoutes.includes(to.path)) {
    return next();
  }

  const loginUser = await store.dispatch("user/getLoginUser");

  // 如果用户未登录，直接跳转到登录页
  if (!loginUser) {
    Message.warning("请先登录");
    return next({
      path: "/user/login",
      //   query: { redirect: to.fullPath },
    });
  }

  // 检查特定权限要求
  const requireAccess = to.meta.access;
  if (requireAccess && !checkAccess(loginUser, requireAccess)) {
    Message.error("您没有权限访问此页面");
    return next("/noAuth");
  }

  // 通过所有检查，允许访问
  next();
};

/**
 * 设置路由守卫
 * @param router 路由实例
 */
export const setupAuthGuard = (router: Router) => {
  router.beforeEach(authGuard);
};

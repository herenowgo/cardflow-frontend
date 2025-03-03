import store from "@/store";
import ACCESS_ENUM from "@/access/accessEnum";
import { eventStreamService } from "@/services/EventStreamService";
import checkAccess from "./checkAccess";
import { Router } from "vue-router";
import { Message } from "@arco-design/web-vue";
import { publicRoutes, isPublicRoute } from "@/router/authGuard";

/**
 * 设置路由守卫处理权限
 * @param router Vue Router实例
 */
export const setupAccessControl = (router: Router) => {
  // 注意：这里不再设置路由守卫，避免重复
  // 我们将使用 authGuard.ts 中的守卫

  // 监听路由变化，处理SSE连接等逻辑
  router.afterEach(async (to) => {
    // 不再在这里处理 SSE 连接
  });
};

export { checkAccess, publicRoutes, isPublicRoute };

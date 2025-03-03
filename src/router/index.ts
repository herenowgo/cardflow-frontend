import { createRouter, createWebHistory } from "vue-router";
import { routes } from "@/router/routes";
import store from "@/store";
import KnowledgeGraph from "@/views/KnowledgeGraph.vue";
import { Message } from "@arco-design/web-vue";

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    {
      path: "/knowledge-graph",
      name: "KnowledgeGraph",
      component: KnowledgeGraph,
      meta: {
        title: "知识图谱",
        requireAuth: true,
      },
    },
    {
      path: "/workspace/cards",
      name: "cardManagement",
      component: () => import("../views/workspace/CardManagementView.vue"),
      meta: {
        requiresAuth: true,
        title: "卡片管理",
      },
    },
    ...routes,
  ],
});

// 增强路由守卫，添加全局权限检查
router.beforeEach(async (to, from, next) => {
  // 检查路由元数据中的权限要求
  const requiresAuth = to.meta.requiresAuth || to.meta.requireAuth;

  // 排除不需要登录就可以访问的页面
  const isPublicRoute =
    to.path === "/user/login" ||
    to.path === "/user/register" ||
    to.path === "/user/smsLogin" ||
    to.path === "/";

  if (requiresAuth || !isPublicRoute) {
    // 获取用户登录状态
    const loginUser = await store.dispatch("user/getLoginUser");

    if (!loginUser) {
      // 如果不在登录页面，显示提示信息
      if (to.path !== "/user/login") {
        Message.warning("请先登录后再访问");
      }

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

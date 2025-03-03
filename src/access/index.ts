import router from "@/router";
import store from "@/store";
import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";
import { eventStreamService } from "@/services/EventStreamService";
import { Message } from "@arco-design/web-vue";

router.beforeEach(async (to, from, next) => {
  const needAccess = (to.meta?.access as string) ?? ACCESS_ENUM.NOT_LOGIN;

  // 不需要登录的路由直接放行
  if (needAccess === ACCESS_ENUM.NOT_LOGIN) {
    return next();
  }

  // 获取当前登录用户
  const loginUser = await store.dispatch("user/getLoginUser");

  // 如果用户已登录且 SSE 未连接，则建立连接
  if (loginUser?.id && !eventStreamService.isConnected()) {
    eventStreamService.connect(loginUser.id);
  }

  // 用户登录后的权限检查
  if (loginUser) {
    if (!checkAccess(loginUser, needAccess)) {
      Message.error("您没有权限访问该页面");
      next("/noAuth");
      return;
    }
    return next();
  }

  // 未登录用户，显示提示并跳转到登录页
  Message.warning("请先登录后再访问");
  next(`/user/login?redirect=${to.fullPath}`);
});

import router from "@/router";
import store from "@/store";
import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";
import { eventStreamService } from "@/services/EventStreamService";

router.beforeEach(async (to, from, next) => {
  const needAccess = (to.meta?.access as string) ?? ACCESS_ENUM.NOT_LOGIN;

  // 获取当前登录用户
  const loginUser = await store.dispatch("user/getLoginUser");

  // 如果用户已登录且 SSE 未连接，则建立连接
  if (loginUser?.id && !eventStreamService.isConnected()) {
    eventStreamService.connect(loginUser.id);
  }

  // 权限检查
  if (needAccess !== ACCESS_ENUM.NOT_LOGIN) {
    if (!loginUser) {
      next(`/user/login?redirect=${to.fullPath}`);
      return;
    }

    if (!checkAccess(loginUser, needAccess)) {
      next("/noAuth");
      return;
    }
  }
  next();
});

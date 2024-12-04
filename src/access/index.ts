import router from "@/router";
import store from "@/store";
import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";

router.beforeEach(async (to, from, next) => {
  const needAccess = (to.meta?.access as string) ?? ACCESS_ENUM.NOT_LOGIN;

  // 只在需要权限的页面检查
  if (needAccess !== ACCESS_ENUM.NOT_LOGIN) {
    const loginUser = await store.dispatch("user/getLoginUser");

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

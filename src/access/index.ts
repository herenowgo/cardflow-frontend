import router from "@/router";
import store from "@/store";
import ACCESS_ENUM from "@/access/accessEnum";
import checkAccess from "@/access/checkAccess";
import { Store } from "vuex";

// 类型断言，确保 store.state 类型正确
const typedStore = store as Store<{
  user: {
    loginUser: any;
  };
}>;

router.beforeEach(async (to, from, next) => {
  let loginUser = typedStore.state.user.loginUser;

  // 如果之前没登录过，尝试获取登录状态
  if (!loginUser || !loginUser.userRole) {
    try {
      await typedStore.dispatch("user/getLoginUser");
      loginUser = typedStore.state.user.loginUser;
    } catch (error) {
      loginUser = null;
    }
  }

  const needAccess = (to.meta?.access as string) ?? ACCESS_ENUM.NOT_LOGIN;

  // 要跳转的页面必须要登录
  if (needAccess !== ACCESS_ENUM.NOT_LOGIN) {
    // 如果没登录，跳转到登录页面
    if (!loginUser || !loginUser.userRole) {
      next(`/user/login?redirect=${to.fullPath}`);
      return;
    }
    // 如果已经登录了，但是权限不足，那么跳转到无权限页面
    if (!checkAccess(loginUser, needAccess)) {
      next("/noAuth");
      return;
    }
  }
  next();
});

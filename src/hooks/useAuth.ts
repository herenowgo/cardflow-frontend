import { computed } from "vue";
import store from "@/store";
import { authService } from "@/services/AuthService";
import { useRouter } from "vue-router";
import ACCESS_ENUM from "@/access/accessEnum";
import { checkAccess } from "@/access";

/**
 * 权限相关组合式API
 */
export default function useAuth() {
  const router = useRouter();

  // 用户登录状态
  const isLoggedIn = computed(() => store.getters["user/isLoggedIn"]);

  // 用户角色
  const userRole = computed(() => store.getters["user/userRole"]);

  // 用户名称
  const userName = computed(() => store.getters["user/userName"]);

  // 用户ID
  const userId = computed(() => store.getters["user/userId"]);

  // 是否是管理员
  const isAdmin = computed(() => userRole.value === "admin");

  /**
   * 检查是否有权限访问
   * @param requireAccess 需要的权限
   */
  const hasAccess = (requireAccess: ACCESS_ENUM) => checkAccess(requireAccess);

  /**
   * 登录前检查，提供统一的登录检查逻辑
   * 如未登录会提示并跳转到登录页
   * @param callback 登录后的回调函数
   * @param redirectPath 重定向路径（可选）
   */
  const checkLoginBeforeAction = async (
    callback: Function,
    redirectPath?: string
  ) => {
    const isAuthenticated = await authService.checkLogin({
      path: redirectPath,
    });

    if (isAuthenticated) {
      callback();
    }
  };

  /**
   * 登出
   */
  const logout = async () => {
    await authService.logout();
  };

  return {
    isLoggedIn,
    userRole,
    userName,
    userId,
    isAdmin,
    hasAccess,
    checkLoginBeforeAction,
    logout,
  };
}

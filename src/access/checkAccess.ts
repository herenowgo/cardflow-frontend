import ACCESS_ENUM from "@/access/accessEnum";
import store from "@/store";

/**
 * 检查当前用户是否有权限
 * @param loginUser 当前登录用户（可选）
 * @param requiredAccess 需要的权限级别
 * @returns boolean 是否有权限
 */
export default function checkAccess(
  loginUser: any = null,
  requiredAccess: ACCESS_ENUM = ACCESS_ENUM.NOT_LOGIN
): boolean {
  // 如果未传入用户信息，从 store 获取
  if (!loginUser) {
    loginUser = store.state.user.loginUser;
  }

  // 如果不需要权限，则直接通过
  if (requiredAccess === ACCESS_ENUM.NOT_LOGIN) {
    return true;
  }

  // 用户未登录，需要登录权限
  if (!loginUser) {
    return false;
  }

  // 获取用户角色，默认为普通用户
  const userRole = loginUser.userRole ?? "user";

  // 如果需要管理员权限，则检查是否是管理员
  if (requiredAccess === ACCESS_ENUM.ADMIN) {
    return userRole === "admin";
  }

  // 如果需要用户权限，检查是否是用户或管理员
  return userRole === "user" || userRole === "admin";
}

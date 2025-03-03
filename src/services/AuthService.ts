import store from "@/store";
import { Message } from "@arco-design/web-vue";

export interface RedirectInfo {
  path?: string;
  query?: Record<string, string>;
}

class AuthService {
  /**
   * 检查用户是否已登录
   * @returns boolean
   */
  isLoggedIn(): boolean {
    return store.getters["user/isLoggedIn"];
  }

  /**
   * 获取当前登录用户
   * @returns 用户信息或null
   */
  async getCurrentUser() {
    return await store.dispatch("user/getLoginUser");
  }

  /**
   * 登录前验证，如未登录则重定向到登录页
   * @param redirectInfo 重定向信息
   * @returns boolean 是否已登录
   */
  async checkLogin(redirectInfo?: RedirectInfo): Promise<boolean> {
    const loginUser = await this.getCurrentUser();

    if (!loginUser) {
      // 如果用户未登录，显示统一提示
      Message.warning("请先登录后再访问");

      // 动态导入router以避免循环依赖
      const router = (await import("@/router")).default;
      const redirect = redirectInfo?.path || router.currentRoute.value.fullPath;
      router.push({
        path: "/user/login",
        query: { redirect },
        ...redirectInfo?.query,
      });
      return false;
    }

    return true;
  }

  /**
   * 注销登录
   */
  async logout() {
    await store.dispatch("user/logout");
    Message.success("已成功退出登录");

    // 动态导入router以避免循环依赖
    const router = (await import("@/router")).default;
    router.push("/");
  }
}

export const authService = new AuthService();

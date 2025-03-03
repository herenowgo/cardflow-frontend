import { LoginUserVO, UserControllerService } from "../../generated";
import { ActionContext } from "vuex";
import { eventStreamService } from "@/services/EventStreamService";
import Cookies from "js-cookie";

const STORAGE_KEY = "user_info";

// 定义 State 接口
interface UserState {
  loginUser: LoginUserVO | null; // 使用具体的类型而不是 any
  loading: boolean; // 添加加载状态
  lastUpdateTime: number | null; // 添加最后更新时间
}

// 定义 store
export default {
  namespaced: true,
  state: (): UserState => ({
    // 尝试从localStorage恢复用户信息
    loginUser: JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"),
    loading: false,
    lastUpdateTime: null,
  }),
  actions: {
    async getLoginUser({ commit, state }: ActionContext<UserState, any>) {
      // 如果已经在加载中，避免重复请求
      if (state.loading) {
        return state.loginUser;
      }

      // 添加缓存检查，5分钟内不重复请求
      const CACHE_TIME = 5 * 60 * 1000; // 5分钟
      if (
        state.loginUser &&
        state.lastUpdateTime &&
        Date.now() - state.lastUpdateTime < CACHE_TIME
      ) {
        return state.loginUser;
      }

      commit("setLoading", true);
      try {
        const res = await UserControllerService.getLoginUserUsingGet();
        if (String(res.code) === "200" && res.data) {
          // 保存到本地存储
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res.data));
          commit("updateUser", res.data);
          commit("updateLastUpdateTime", Date.now());

          // 修改：仅在未连接时建立连接
          if (res.data.id && !eventStreamService.isConnected()) {
            eventStreamService.connect(res.data.id);
          }

          return res.data;
        } else {
          localStorage.removeItem(STORAGE_KEY);
          commit("updateUser", null);
          commit("updateLastUpdateTime", null);
          eventStreamService.disconnect();
        }
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        commit("updateUser", null);
        commit("updateLastUpdateTime", null);
        console.error("Failed to get user info:", error);
      } finally {
        commit("setLoading", false);
      }
    },

    // 添加登出action，添加类型定义
    async logout({ commit }: ActionContext<UserState, any>) {
      try {
        await UserControllerService.userLogoutUsingPost();
        // 清除本地存储
        localStorage.removeItem(STORAGE_KEY);
        commit("updateUser", null);
        commit("updateLastUpdateTime", null);

        // 断开 SSE 连接
        eventStreamService.disconnect();

        // 清除特定的 cookies
        Cookies.remove("Authorization", { path: "/" });
        Cookies.remove("JSESSIONID", { path: "/api" });

        return true;
      } catch (error) {
        console.error("Logout failed:", error);
        return false;
      }
    },
  },
  mutations: {
    updateUser(state: UserState, payload: LoginUserVO | null) {
      state.loginUser = payload;
    },
    setLoading(state: UserState, loading: boolean) {
      state.loading = loading;
    },
    updateLastUpdateTime(state: UserState, time: number | null) {
      state.lastUpdateTime = time;
    },
  },

  // 添加 getters
  getters: {
    isLoggedIn: (state: UserState) => !!state.loginUser,
    userRole: (state: UserState) => state.loginUser?.userRole || "guest",
    userName: (state: UserState) => state.loginUser?.userName || "",
    userId: (state: UserState) => state.loginUser?.id || null,
  },
};

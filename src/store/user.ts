import { LoginUserVO, UserControllerService } from "../../generated";
import { ActionContext } from "vuex";
import { BaseResponse_LoginUserVO_ } from "../../generated";

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
    loginUser: null,
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
          commit("updateUser", res.data);
          commit("updateLastUpdateTime", Date.now());
          return res.data;
        } else {
          commit("updateUser", null);
          commit("updateLastUpdateTime", null);
        }
      } catch (error) {
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
        commit("updateUser", null);
      } catch (error) {
        console.error("Logout failed:", error);
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
    userName: (state: UserState) => state.loginUser?.userName || "未登录",
  },
};

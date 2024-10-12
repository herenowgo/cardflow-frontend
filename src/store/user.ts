// initial state
import { StoreOptions } from "vuex";
import { UserControllerService } from "../../generated";
import ACCESS_ENUM from "@/access/accessEnum";

export default {
  namespaced: true,
  state: () => ({
    loginUser: {
      userName: "未登录",
      userAvatar: null, // 添加一个默认的头像URL
    },
  }),
  actions: {
    async getLoginUser({ commit, state }, payload) {
      // 从远程请求获取登录信息
      const res = await UserControllerService.getLoginUserUsingGet();
      if (res.code === 0) {
        commit("updateUser", res.data);
      } else {
        commit("updateUser", {
          ...state.loginUser,
          userRole: ACCESS_ENUM.NOT_LOGIN,
        });
      }
    },
    // 添加一个 action 来更新用户头像
    async updateAvatar({ commit }, avatarUrl) {
      // 这里可以执行异步操作来获取新的头像URL
      // 例如，调用 API 来上传头像并获取新的 URL
      // 假设 avatarUrl 是从异步操作中获取的新头像URL
      commit("setAvatar", avatarUrl);
    },
  },
  mutations: {
    updateUser(state, payload) {
      state.loginUser = payload;
    },
    clearUser(state) {
      state.loginUser = null;
    },
    // 添加一个 mutation 来更新用户头像
    setAvatar(state, avatarUrl) {
      if (state.loginUser) {
        state.loginUser.userAvatar = avatarUrl;
      }
    },
  },
} as StoreOptions<any>;

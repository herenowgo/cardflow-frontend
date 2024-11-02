import { UserControllerService } from "../../generated";
import { ActionContext } from "vuex";
import { BaseResponse_LoginUserVO_ } from "../../generated";

// 定义 State 接口
interface UserState {
  loginUser: any; // 可以根据实际用户类型定义更具体的类型
}

// 定义 store
export default {
  namespaced: true,
  state: (): UserState => ({
    loginUser: null,
  }),
  actions: {
    async getLoginUser({ commit, state }: ActionContext<UserState, any>) {
      try {
        const res = await UserControllerService.getLoginUserUsingGet();
        // 使用 String() 将数字转换为字符串进行比较
        if (String(res.code) === "200" && res.data) {
          commit("updateUser", res.data);
          return res.data;
        } else {
          commit("updateUser", null);
        }
      } catch (error) {
        commit("updateUser", null);
      }
    },
  },
  mutations: {
    updateUser(state: UserState, payload: any) {
      state.loginUser = payload;
    },
  },
};

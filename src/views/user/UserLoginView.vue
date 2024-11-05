<template>
  <div id="userLoginView">
    <h1 style="margin-bottom: 16px">用户登录</h1>
    <a-form
      style="max-width: 480px; margin: 0 auto"
      label-align="left"
      auto-label-width
      :model="form"
      @submit="handleSubmit"
    >
      <a-form-item field="userAccount" label="账号">
        <a-input v-model="form.userAccount" placeholder="请输入账号" />
      </a-form-item>
      <a-form-item field="userPassword" tooltip="密码不少于 8 位" label="密码">
        <a-input-password
          v-model="form.userPassword"
          placeholder="请输入密码"
          min="888"
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%"
          >登录
        </a-button>
      </a-form-item>
      <a-form-item>
        <a-button
          type="text"
          @click="userLogin"
          style="width: 100%; color: var(--color-text-3) !important"
          >注册账号
        </a-button>
        <a-button
          type="text"
          @click="userSmsLogin"
          style="width: 100%; color: var(--color-text-3) !important"
          >短信登录
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from "vue";
import { UserControllerService, UserLoginRequest } from "../../../generated";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import message from "@arco-design/web-vue/es/message";
import ACCESS_ENUM from "@/access/accessEnum";

const form = reactive({
  userAccount: "",
  userPassword: "",
} as UserLoginRequest);

const router = useRouter();
const route = useRoute();
const store = useStore();

onMounted(() => {
  const { userAccount, userPassword } = route.query;
  if (userAccount && userPassword) {
    form.userAccount = userAccount as string;
    form.userPassword = userPassword as string;
  }
});

const handleSubmit = async () => {
  if (!form.userAccount || !form.userPassword) {
    message.error("账号或密码不能为空");
    return;
  }
  try {
    const res = await UserControllerService.userLoginUsingPost(form);
    // 登录成功，跳转到主页
    if (res.code === "200") {
      // 登录成功后立即获取用户信息
      await store.dispatch("user/getLoginUser");
      message.success("登录成功");

      // 获取重定向地址，如果有的话
      const redirect = route.query.redirect as string;
      router.push({
        path: redirect || "/questions",
        replace: true,
      });
    } else {
      message.error("登录失败，" + res.message);
    }
  } catch (error) {
    message.error("登录失败，请检查网络连接");
  }
};
const userLogin = () => {
  router.push({
    path: "/user/register",
    replace: true,
  });
};

const userSmsLogin = () => {
  router.push({
    path: "/user/smsLogin",
    replace: true,
  });
};
</script>

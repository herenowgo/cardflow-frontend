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
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { UserControllerService, UserLoginRequest } from "../../../generated";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import message from "@arco-design/web-vue/es/message";
import ACCESS_ENUM from "@/access/accessEnum";

const form = reactive({
  userAccount: "",
  userPassword: "",
} as UserLoginRequest);

const router = useRouter();
const store = useStore();
const handleSubmit = async () => {
  if (!form.userAccount || !form.userPassword) {
    message.error("账号或密码不能为空");
    return;
  }
  const res = await UserControllerService.userLoginUsingPost(form);
  // 登录成功，跳转到主页
  if (res.code === 0) {
    await store.dispatch("user/getLoginUser");
    router.push({
      path: "/questions",
      replace: true,
    });
  } else {
    message.error("登录失败，" + res.message);
  }
};
const userLogin = () => {
  router.push({
    path: "/user/register",
    replace: true,
  });
};
</script>

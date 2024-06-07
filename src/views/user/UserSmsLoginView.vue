<template>
  <div id="userLoginView">
    <h1 style="margin-bottom: 16px">短信登录</h1>
    <a-form
      style="max-width: 480px; margin: 0 auto"
      label-align="left"
      auto-label-width
      :model="form"
      ref="formRef"
      @submit="handleSubmit"
    >
      <a-form-item field="phone" label="手机号" :validate-trigger="['change']">
        <a-input-number
          hide-button="true"
          v-model="form.phone"
          placeholder="请输入手机号"
        />
      </a-form-item>
      <a-form-item
        field="code"
        label="验证码"
        :rules="[
          { minLength: 6, message: 'Verification code is incomplete' },
          { match: /^\d+$/, message: 'Must be numeric' },
        ]"
      >
        <a-verification-code
          v-model="form.verificationCode"
          style="width: 300px"
        />
        <a-button
          type="primary"
          style="margin-left: 40px"
          @click="getCode"
          :disabled="isDisposed"
        >
          {{ isDisposed ? `${time}s后重新获取` : "获取验证码" }}
        </a-button>
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
          >账号登录
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { UserControllerService, UserSmsLoginRequest } from "../../../generated";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import message from "@arco-design/web-vue/es/message";

const form = reactive({
  phone: "",
  verificationCode: "",
} as UserSmsLoginRequest);

const router = useRouter();
const store = useStore();
const handleSubmit = async () => {
  if (!form.phone || !form.verificationCode) {
    message.error("账号或密码不能为空");
    return;
  }
  const res = await UserControllerService.userSmsLoginUsingPost(form);
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
    path: "/user/login",
    replace: true,
  });
};
const isDisposed = ref(false);
const getCode = async () => {
  if (!form.phone) {
    message.error("请输入正确的手机号");
    return;
  }

  const res = await UserControllerService.doSendVerificationCodeUsingGet(
    form.phone
  );
  if (res.code === 0) {
    message.success("验证码发送成功");
  }
  if (res.code != 0) {
    message.error(res.message);
  }
  // const { username } = user.value;
  // axios.get("auth/register/getverify", { params: { username } }).then((res) => {
  //   console.log("获取验证码结果", res);
  //   if (res.data.errcode == 0) {
  console.log("验证码发送成功！");
  isDisposed.value = true;
  handleTimeChange();
};

const handleTimeChange = () => {
  if (time.value <= 0) {
    isDisposed.value = false;
    time.value = 60;
  } else {
    setTimeout(() => {
      time.value--;
      handleTimeChange();
    }, 1000);
  }
};

const time = ref(60);
</script>

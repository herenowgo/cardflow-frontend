<template>
  <a-row id="globalHeader" align="center" :wrap="false">
    <a-col flex="auto">
      <a-menu
        mode="horizontal"
        :selected-keys="selectedKeys"
        @menu-item-click="doMenuClick"
      >
        <a-menu-item
          key="0"
          :style="{ padding: 0, marginRight: '38px' }"
          disabled
        >
          <div class="title-bar">
            <img class="logo" src="../assets/logo.jpg" />
          </div>
        </a-menu-item>
        <a-menu-item v-for="item in visibleRoutes" :key="item.path">
          {{ item.name }}
        </a-menu-item>
      </a-menu>
    </a-col>

    <a-col flex="50px">
      <a-dropdown trigger="hover" popup-container="string">
        <a-avatar @click="avatarClick">
          <img alt="avatar" :src="userAvatar" />
        </a-avatar>
        <template #content>
          <a-doption
            @click="loginOut"
            v-if="store.state.user?.loginUser?.userName != '未登录'"
            >退出登录
          </a-doption>
          <a-doption @click="avatarClick" v-else>登录</a-doption>
          <a-doption
            v-if="store.state.user?.loginUser?.userName != '未登录'"
            @click="userInfoClick"
            >个人中心
          </a-doption>
        </template>
      </a-dropdown>
    </a-col>
    <a-col flex="100px">
      <div>{{ userName }}</div>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { routes } from "../router/routes";
import { useRouter } from "vue-router";
import { computed, ref } from "vue";
import { useStore } from "vuex";
import checkAccess from "@/access/checkAccess";
import ACCESS_ENUM from "@/access/accessEnum";
import { UserControllerService } from "../../generated";
import message from "@arco-design/web-vue/es/message";

const router = useRouter();
const store = useStore();

const userAvatar = computed(() => {
  return (
    store.state.user?.loginUser?.userAvatar ??
    "https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp"
  );
});

const userName = computed(() => {
  return store.state.user?.loginUser?.userName ?? "未登录";
});
const doMenuClick = (key: string) => {
  // 检查是否需要在新标签页打开
  const route = visibleRoutes.value.find((route) => route.path === key);
  if (route?.meta?.openInNewTab) {
    // 在新标签页打开
    const url = router.resolve({ path: key }).href;
    window.open(url, "_blank");
  } else {
    // 在当前页面打开（原有行为）
    router.push({
      path: key,
    });
  }
};

const loginOut = async () => {
  await store.dispatch("user/logout");
  message.success("退出登录成功");
  router.push({
    path: "/user/login",
  });
};

const selectedKeys = ref(["/"]);

router.beforeEach((to, from, next) => {
  selectedKeys.value = [to.path];
  next();
});

const avatarClick = () => {
  router.push({
    path: "/user/login",
  });
};

const userInfoClick = () => {
  router.push({
    path: "/info/user",
  });
};

const visibleRoutes = computed(() => {
  return routes.filter((item, index) => {
    if (item.meta?.hideInMenu) {
      return false;
    }
    if (!checkAccess(store.state.user.loginUser, item.meta?.access as string)) {
      return false;
    }
    return true;
  });
});
</script>

<style scoped>
.logo {
  height: 48px;
}
</style>

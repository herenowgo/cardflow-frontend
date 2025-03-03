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
        <a-avatar
          :style="{ cursor: 'pointer' }"
          :size="36"
          @click="handleAvatarClick"
        >
          <img
            v-if="userAvatar"
            :src="userAvatar"
            alt="avatar"
            @error="handleAvatarError"
          />
          <icon-user v-else />
        </a-avatar>
        <template #content>
          <div class="dropdown-content">
            <template v-if="isLoggedIn">
              <a-doption @click="goToUserCenter">
                <template #icon><icon-user /></template>
                个人中心
              </a-doption>
              <!-- <a-doption @click="showUploadModal">
                <template #icon><icon-camera /></template>
                更换头像
              </a-doption> -->
              <a-divider style="margin: 4px 0" />
              <a-doption @click="confirmLogout">
                <template #icon><icon-export /></template>
                退出登录
              </a-doption>
            </template>
            <a-doption v-else @click="goToLogin">
              <template #icon><icon-import /></template>
              登录
            </a-doption>
          </div>
        </template>
      </a-dropdown>
    </a-col>
    <a-col flex="100px">
      <div>{{ userName }}</div>
    </a-col>

    <!-- 头像上传对话框 -->
    <a-modal
      v-model:visible="uploadModalVisible"
      title="更换头像"
      @cancel="cancelUpload"
      @ok="handleUpload"
      :ok-button-props="{ loading: uploading }"
    >
      <a-upload
        list-type="picture-card"
        :show-upload-button="false"
        :limit="1"
        :auto-upload="false"
        accept="image/*"
        v-model:file-list="uploadFiles"
        @change="handleFileChange"
      >
        <template #upload-button>
          <div>
            <icon-plus />
            <div style="margin-top: 10px">上传头像</div>
          </div>
        </template>
      </a-upload>
    </a-modal>
  </a-row>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { Message, Modal } from "@arco-design/web-vue";
import { UserControllerService } from "../../generated";
import {
  IconUser,
  IconCamera,
  IconExport,
  IconImport,
  IconPlus,
} from "@arco-design/web-vue/es/icon";
import { routes } from "../router/routes";
import checkAccess from "@/access/checkAccess";

// 默认头像配置
const DEFAULT_AVATAR =
  "https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp";

const router = useRouter();
const store = useStore();

// 用户状态
const isLoggedIn = computed(() => store.getters["user/isLoggedIn"]);
const userAvatar = computed(
  () => store.state.user?.loginUser?.userAvatar ?? DEFAULT_AVATAR
);
const userName = computed(() =>
  store.getters["user/userName"] == null || store.getters["user/userName"] == ""
    ? "未登录"
    : store.getters["user/userName"]
);

// 头像上传相关状态
const uploadModalVisible = ref(false);
const uploadFiles = ref([]);
const uploading = ref(false);

// 头像上传相关方法
const showUploadModal = () => {
  uploadModalVisible.value = true;
};

const cancelUpload = () => {
  uploadModalVisible.value = false;
  uploadFiles.value = [];
};

const handleFileChange = (files: any) => {
  uploadFiles.value = files;
};

const handleUpload = async () => {
  if (!uploadFiles.value.length) {
    Message.warning("请先选择图片");
    return;
  }

  uploading.value = true;
  try {
    const file = uploadFiles.value[0].file;
    const res = await UserControllerService.uploadAvatarUsingPost(
      "avatar",
      file
    );

    if (res.code === 200) {
      await store.dispatch("user/getLoginUser");
      Message.success("头像更新成功");
      uploadModalVisible.value = false;
      uploadFiles.value = [];
    } else {
      Message.error(res.message || "上传失败");
    }
  } catch (error) {
    console.error("Upload avatar error:", error);
    Message.error("上传失败，请重试");
  } finally {
    uploading.value = false;
  }
};

// 头像加载失败处理
const handleAvatarError = (e: Event) => {
  if (e.target instanceof HTMLImageElement) {
    e.target.src = DEFAULT_AVATAR;
  }
};

// 导航相关方法
const goToUserCenter = () => router.push("/info/user");
const goToLogin = () => router.push("/user/login");

const confirmLogout = () => {
  Modal.confirm({
    title: "确认退出",
    content: "确定要退出登录吗？",
    okText: "确认",
    cancelText: "取消",
    onOk: async () => {
      try {
        await store.dispatch("user/logout");
        Message.success("退出登录成功");
        router.push("/user/login");
      } catch (error) {
        Message.error("退出失败，请重试");
      }
    },
  });
};

// 其他现有代码
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
  Message.success("退出登录成功");
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

.dropdown-content {
  min-width: 120px;
}

:deep(.arco-upload-list-picture-card) {
  width: 200px;
  height: 200px;
}

:deep(.arco-upload-picture-card) {
  width: 200px;
  height: 200px;
}
</style>

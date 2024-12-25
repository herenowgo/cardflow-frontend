<template>
  <div class="pdf-preview">
    <div class="pdf-header">
      <template v-if="isLoading">
        <a-spin dot />
      </template>

      <template v-else>
        <a-space>
          <template v-if="!showAllPages">
            <a-button-group>
              <a-button @click="page--" :disabled="page <= 1">
                <template #icon><icon-left /></template>
                上一页
              </a-button>
              <a-button @click="page++" :disabled="page >= pageCount">
                下一页
                <template #icon><icon-right /></template>
              </a-button>
            </a-button-group>
            <span>{{ page }} / {{ pageCount }}</span>
          </template>
          <template v-else>
            <span>共 {{ pageCount }} 页</span>
          </template>

          <a-checkbox v-model="showAllPages">显示所有页面</a-checkbox>

          <a-select v-model="scale" style="width: 120px">
            <a-option value="0.5">50%</a-option>
            <a-option value="1">100%</a-option>
            <a-option value="1.5">150%</a-option>
            <a-option value="2">200%</a-option>
          </a-select>
        </a-space>
      </template>
    </div>

    <div class="pdf-content" ref="container">
      <a-spin :loading="isLoading">
        <vue-pdf-embed
          v-if="source"
          :source="source"
          :page="showAllPages ? null : page"
          :style="{ transform: `scale(${scale})` }"
          annotation-layer
          text-layer
          @password-requested="handlePasswordRequest"
          @loaded="handleDocumentLoad"
          @rendered="handleDocumentRender"
          @loading="handleLoading"
          @error="handleError"
        />
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, defineProps } from "vue";
import VuePdfEmbed from "vue-pdf-embed";
import { IconLeft, IconRight } from "@arco-design/web-vue/es/icon";
import { Message } from "@arco-design/web-vue";

const props = defineProps<{
  source: { url: string; withCredentials?: boolean };
}>();

const isLoading = ref(true);
const page = ref(1);
const pageCount = ref(0);
const showAllPages = ref(false);
const scale = ref("1");
const container = ref();

// 监听显示模式变化
watch(showAllPages, (newVal) => {
  if (!newVal) {
    page.value = 1;
  }
});

// 处理文档加载完成
const handleDocumentLoad = (e: { numPages: number }) => {
  pageCount.value = e.numPages;
  isLoading.value = false;
};

// 处理文档渲染完成
const handleDocumentRender = () => {
  isLoading.value = false;
};

// 处理加载状态
const handleLoading = () => {
  isLoading.value = true;
};

// 处理错误
const handleError = (error: Error) => {
  isLoading.value = false;
  Message.error("PDF 加载失败：" + error.message);
  console.error("PDF loading error:", error);
};

// 处理密码请求
const handlePasswordRequest = ({
  callback,
  isWrongPassword,
}: {
  callback: (password: string) => void;
  isWrongPassword: boolean;
}) => {
  const password = prompt(
    isWrongPassword ? "密码错误，请重新输入" : "请输入PDF密码"
  );
  if (password) {
    callback(password);
  }
};

onMounted(() => {
  console.log("PDF source:", props.source);
});
</script>

<style scoped>
.pdf-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
}

.pdf-header {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pdf-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background: #f5f5f5;
}

:deep(.vue-pdf-embed) {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform-origin: top center;
}

:deep(.vue-pdf-embed__page) {
  margin-bottom: 8px;
}
</style>

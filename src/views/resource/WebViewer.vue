<template>
  <div class="web-viewer-container">
    <div class="web-controls">
      <div class="control-group">
        <a-input-search
          v-model="currentUrl"
          placeholder="请输入网页地址..."
          search-button
          @search="loadUrl"
        >
          <template #button-icon>
            <icon-enter />
          </template>
        </a-input-search>
        <a-button-group>
          <a-tooltip content="刷新">
            <a-button @click="refreshPage">
              <template #icon>
                <icon-refresh />
              </template>
            </a-button>
          </a-tooltip>
        </a-button-group>
      </div>
    </div>
    <div class="web-content">
      <iframe
        v-if="displayUrl"
        :src="displayUrl"
        class="web-iframe"
        ref="webFrame"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      ></iframe>
      <div v-else class="empty-state">
        <icon-internet />
        <span>请输入要浏览的网页地址</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineExpose } from "vue";
import { Message } from "@arco-design/web-vue";
import {
  IconEnter,
  IconRefresh,
  IconInternet,
} from "@arco-design/web-vue/es/icon";

const currentUrl = ref("");
const displayUrl = ref("");
const webFrame = ref<HTMLIFrameElement | null>(null);

const loadUrl = (url: string) => {
  if (!url) {
    Message.warning("请输入网页地址");
    return;
  }

  // 确保URL包含协议
  let processedUrl = url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    processedUrl = "https://" + url;
  }

  try {
    new URL(processedUrl);
    displayUrl.value = processedUrl;
  } catch (e) {
    Message.error("请输入有效的网页地址");
  }
};

const refreshPage = () => {
  if (webFrame.value) {
    webFrame.value.src = displayUrl.value;
  }
};

defineExpose({
  loadUrl,
  refreshPage,
});
</script>

<style scoped>
.web-viewer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-2);
}

.web-controls {
  padding: 12px 16px;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.control-group :deep(.arco-input-search) {
  flex: 1;
}

.web-content {
  flex-grow: 1;
  position: relative;
  overflow: hidden;
}

.web-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text-3);
}

.empty-state :deep(.icon) {
  font-size: 48px;
}
</style>

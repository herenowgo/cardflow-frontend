<template>
  <div class="web-viewer-container">
    <div class="web-content">
      <iframe
        v-if="displayUrl"
        :src="displayUrl"
        class="web-iframe"
        ref="webFrame"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      ></iframe>
      <div v-else class="empty-state">
        <icon-link />
        <span>暂无网页地址</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineExpose } from "vue";
import { Message } from "@arco-design/web-vue";
import { IconLink } from "@arco-design/web-vue/es/icon";

const displayUrl = ref("");
const webFrame = ref<HTMLIFrameElement | null>(null);

const loadUrl = (url: string) => {
  if (!url) {
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
    Message.error("无效的网页地址");
  }
};

defineExpose({
  loadUrl,
});
</script>

<style scoped>
.web-viewer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-2);
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

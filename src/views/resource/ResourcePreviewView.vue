<template>
  <a-layout class="h-screen relative">
    <a-layout-sider
      :width="siderWidth"
      class="bg-white resizable-sider"
      :style="{ width: `${siderWidth}px` }"
    >
      <div class="pdf-container">
        <div class="pdf-content">
          <pdf-viewer :source="pdfUrl" />
        </div>
      </div>
    </a-layout-sider>

    <div
      class="resizer"
      @mousedown="startResize"
      @touchstart="startResize"
    ></div>

    <a-layout-content class="bg-gray-100 chat-container">
      <AIChat ref="aiChatRef" :embedded="true" />
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { Message } from "@arco-design/web-vue";
import PdfViewer from "./PdfViewer.vue";
import AIChat from "@/components/AIChat.vue";
import { UserFileControllerService } from "../../../generated";

const route = useRoute();
const pdfUrl = ref<string>("");
const aiChatRef = ref<InstanceType<typeof AIChat>>();

onMounted(async () => {
  const urlFromQuery = route.query.url as string;
  if (urlFromQuery) {
    pdfUrl.value = urlFromQuery;
  } else {
    const path = route.query.path as string;
    if (path) {
      try {
        const res = await UserFileControllerService.previewFile(path);
        if (res.code === 200 && res.data?.url) {
          pdfUrl.value = res.data.url;
        } else {
          Message.error("获取预览链接失败");
        }
      } catch (error) {
        Message.error("加载PDF失败");
        console.error("Load PDF error:", error);
      }
    }
  }

  // 显示 AI 聊天
  if (aiChatRef.value) {
    aiChatRef.value.show();
  }
});

// 侧边栏宽度状态
const siderWidth = ref(window.innerWidth * 0.5); // 默认50%宽度
const minWidth = 300; // 最小宽度
const maxWidth = window.innerWidth * 0.8; // 最大宽度

// 拖拽相关状态
const isResizing = ref(false);
let startX = 0;
let startWidth = 0;

// 开始拖拽
const startResize = (e: MouseEvent | TouchEvent) => {
  isResizing.value = true;
  startX = "touches" in e ? e.touches[0].clientX : e.clientX;
  startWidth = siderWidth.value;

  // 添加事件监听
  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", stopResize);
  document.addEventListener("touchmove", handleResize);
  document.addEventListener("touchend", stopResize);

  // 添加禁止选择类
  document.body.classList.add("resize-active");
};

// 处理拖拽
const handleResize = (e: MouseEvent | TouchEvent) => {
  if (!isResizing.value) return;

  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const delta = clientX - startX;
  const newWidth = Math.min(Math.max(startWidth + delta, minWidth), maxWidth);

  siderWidth.value = newWidth;
};

// 停止拖拽
const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
  document.removeEventListener("touchmove", handleResize);
  document.removeEventListener("touchend", stopResize);

  document.body.classList.remove("resize-active");
};

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
  document.removeEventListener("touchmove", handleResize);
  document.removeEventListener("touchend", stopResize);
});
</script>

<style scoped>
.resizable-sider {
  position: relative;
  transition: none;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pdf-container {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.pdf-content {
  height: 100%;
  overflow-y: auto;
  flex: 1;
}

.chat-container {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.resizer {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background-color: transparent;
  cursor: col-resize;
  transition: background-color 0.3s;
  z-index: 100;
  left: calc(v-bind(siderWidth) * 1px);
  transform: translateX(-50%);
}

.resizer:hover,
.resizer:active {
  background-color: var(--color-primary-light-4);
}

:global(.resize-active) {
  user-select: none;
  cursor: col-resize;
}

.h-screen {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

:deep(.t-dialog) {
  position: relative !important;
  inset: 0 !important;
  margin: 0 !important;
  max-width: none !important;
  width: 100% !important;
  height: 100% !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

:deep(.t-dialog__content) {
  height: 100% !important;
}

:deep(.t-dialog__body) {
  padding: 0 !important;
  height: 100% !important;
}

:deep(.t-chat) {
  height: 100% !important;
}
</style>

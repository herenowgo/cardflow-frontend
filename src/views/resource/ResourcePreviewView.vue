<template>
  <a-layout class="h-screen relative">
    <a-layout-sider
      :width="siderWidth"
      class="bg-white resizable-sider"
      :class="{ resizing: isResizing }"
      :style="{ width: `${siderWidth}px` }"
    >
      <div class="pdf-container">
        <div class="pdf-content">
          <pdf-viewer :source="pdfUrl" :path="filePath" />
        </div>
      </div>
    </a-layout-sider>

    <div
      class="resizer"
      :class="{ resizing: isResizing }"
      @mousedown="startResize"
      @touchstart="startResize"
    ></div>

    <a-layout-content class="bg-gray-100 chat-container">
      <AIChat ref="aiChatRef" :embedded="true" />
    </a-layout-content>

    <!-- 浮动按钮组 -->
    <div
      v-show="showFloatButton"
      class="float-buttons"
      :style="{ left: `${floatButtonPos.x}px`, top: `${floatButtonPos.y}px` }"
    >
      <div class="float-button" @click="handleGenerateCard" title="AI 分析">
        <t-icon name="chat" />
      </div>
      <div
        class="float-button"
        @click="handleDirectGenerate"
        title="直接生成卡片"
      >
        <t-icon name="layers" />
      </div>
    </div>
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
const filePath = ref<string>("");
const aiChatRef = ref<InstanceType<typeof AIChat>>();

onMounted(async () => {
  const urlFromQuery = route.query.url as string;
  const pathFromQuery = route.query.path as string;

  if (urlFromQuery) {
    pdfUrl.value = urlFromQuery;
    filePath.value = pathFromQuery || "";
  } else {
    const path = route.query.path as string;
    if (path) {
      try {
        filePath.value = path;
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

  // 添加和移除事件监听器
  document.addEventListener("mouseup", handleTextSelection);
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

// 添加浮动按钮相关状态
const showFloatButton = ref(false);
const floatButtonPos = ref({ x: 0, y: 0 });
const selectedText = ref("");

// 处理文本选择事件
const handleTextSelection = () => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    showFloatButton.value = false;
    return;
  }

  const text = selection.toString().trim();
  if (!text) {
    showFloatButton.value = false;
    return;
  }

  selectedText.value = text;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // 设置浮动按钮位置在选区的右上角
  floatButtonPos.value = {
    x: rect.right + 10,
    y: rect.top - 10,
  };
  showFloatButton.value = true;
};

// 处理生成卡片
const handleGenerateCard = async () => {
  if (!selectedText.value) return;

  // 隐藏浮动按钮
  showFloatButton.value = false;

  // 构造消息内容
  const message = `请根据以下内容生成一张学习卡片：\n\n${selectedText.value}`;

  // 发送到 AI 助手
  if (aiChatRef.value) {
    await aiChatRef.value.sendMessage(message);
  }
};

// 修改 handleDirectGenerate 方法
const handleDirectGenerate = async () => {
  if (!selectedText.value) return;

  // 隐藏浮动按钮
  showFloatButton.value = false;

  // 直接调用 AI 助手的生成卡片方法
  if (aiChatRef.value) {
    await aiChatRef.value.generateCardsFromText(selectedText.value);
  }
};

// 清理事件监听
onUnmounted(() => {
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
  document.removeEventListener("touchmove", handleResize);
  document.removeEventListener("touchend", stopResize);
  document.removeEventListener("mouseup", handleTextSelection);
});
</script>

<style scoped>
.resizable-sider {
  position: relative;
  transition: width 0.3s;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.resizing {
    transition: none;
  }
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
  width: 8px;
  background-color: var(--color-neutral-2);
  cursor: col-resize;
  transition: all 0.3s;
  z-index: 100;
  left: calc(v-bind(siderWidth) * 1px);
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: "";
    position: absolute;
    left: 3px;
    width: 2px;
    height: 100%;
    background: var(--color-neutral-3);
  }

  &::after {
    content: "⋮";
    color: var(--color-neutral-5);
    font-size: 16px;
    line-height: 1;
    writing-mode: vertical-lr;
    letter-spacing: 2px;
    opacity: 0.8;
    transition: all 0.3s;
  }

  &:hover {
    background-color: var(--color-neutral-3);
    width: 10px;

    &::after {
      color: var(--color-neutral-7);
      letter-spacing: 3px;
      font-size: 18px;
    }
  }

  &.resizing,
  &:active {
    transition: none;
    background-color: var(--color-neutral-4);
    width: 12px;

    &::after {
      transition: none;
      color: var(--color-neutral-8);
      letter-spacing: 4px;
      font-size: 20px;
    }
  }
}

:global(.resize-active) {
  user-select: none;
  cursor: col-resize;

  .resizer {
    background-color: var(--color-neutral-4);
    width: 12px;

    &::after {
      color: var(--color-neutral-8);
      letter-spacing: 4px;
      font-size: 20px;
    }
  }
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

.float-buttons {
  position: fixed;
  z-index: 1000;
  display: flex;
  gap: 8px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
}

.float-button {
  background: var(--td-brand-color);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
  font-size: 16px;

  &:hover {
    transform: scale(1.1);
    background: var(--td-brand-color-hover);
  }

  &:active {
    transform: scale(0.95);
    background: var(--td-brand-color-active);
  }
}
</style>

<template>
  <a-layout class="h-screen relative">
    <a-layout-sider
      :width="siderWidth"
      class="bg-white resizable-sider"
      :class="{ resizing: isResizing }"
      :style="{ width: `${siderWidth}px` }"
    >
      <div class="viewer-container">
        <template v-if="resourceType === 'NOTE'">
          <div class="note-container">
            <div id="vditor-main" class="note-editor"></div>
            <div class="note-actions">
              <a-button type="primary" @click="handleSave">保存</a-button>
            </div>
          </div>
        </template>
        <template v-else>
          <div v-show="resourceType === 'PDF'" class="pdf-container">
            <div class="pdf-content">
              <pdf-viewer :source="pdfUrl" :path="filePath" />
            </div>
          </div>
          <div v-show="resourceType === 'URL'" class="web-container">
            <web-viewer ref="webViewerRef" />
          </div>
        </template>
      </div>
    </a-layout-sider>

    <div
      class="resizer"
      :class="{ resizing: isResizing }"
      @mousedown="startResize"
      @touchstart="startResize"
    ></div>

    <a-layout-content class="bg-gray-100 right-content">
      <template v-if="resourceType !== 'NOTE'">
        <div class="right-controls">
          <div class="controls-wrapper">
            <a-radio-group v-model="rightView" type="button" size="mini">
              <a-radio value="chat">AI 助手</a-radio>
              <a-radio value="note">笔记</a-radio>
            </a-radio-group>
          </div>
        </div>

        <div v-show="rightView === 'chat'" class="chat-container">
          <AIChat
            ref="aiChatRef"
            :embedded="true"
            @tags-change="saveStructuredTags"
          />
        </div>

        <div v-show="rightView === 'note'" class="note-container">
          <div id="vditor" class="note-editor"></div>
          <div class="note-actions">
            <a-button type="primary" @click="handleSave">保存</a-button>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="chat-container">
          <AIChat
            ref="aiChatRef"
            :embedded="true"
            @tags-change="saveStructuredTags"
          />
        </div>
      </template>
    </a-layout-content>

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
import AIChat from "@/components/AIChat.vue";
import { Message } from "@arco-design/web-vue";
import Vditor from "vditor";
import "vditor/dist/index.css";
import { onMounted, onUnmounted, ref, shallowRef, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { StudyResourceControllerService } from "../../../api/services/StudyResourceControllerService";
import PdfViewer from "./PdfViewer.vue";
import WebViewer from "./WebViewer.vue";
import { StudyResourceVO } from "../../../api/models/StudyResourceVO";

const route = useRoute();
const pdfUrl = ref<string>("");
const filePath = ref<string>("");
const aiChatRef = ref<InstanceType<typeof AIChat> | null>(null);
const webViewerRef = ref<InstanceType<typeof WebViewer>>();
const vditor = shallowRef<Vditor>();
const noteContent = ref<string>("");
const articleContent = ref<string>("");
const resourceId = ref<string>("");
const resourceType = ref<StudyResourceVO.resourceType>();
const defaultTags = ref<string[]>([]);
const rightView = ref<"chat" | "note">("chat");

// 防抖函数
const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timer: number | null = null;
  const debouncedFn = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };

  // 添加立即执行方法
  debouncedFn.flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debouncedFn;
};

// 自动保存笔记
const autoSaveNote = debounce(async (content: string) => {
  if (!content || content === noteContent.value) return;

  try {
    const response = await StudyResourceControllerService.updateResource({
      id: resourceId.value,
      note: content,
    });
    if (response.code === 200) {
      noteContent.value = content;
      // 移除成功提示，避免频繁打扰
      // Message.success("自动保存成功");
    }
  } catch (error) {
    Message.error("自动保存失败");
    console.error("Auto save note error:", error);
  }
}, 2000);

// 自动保存文章
const autoSaveArticle = debounce(async (content: string) => {
  if (!content || content === articleContent.value) return;

  try {
    const response = await StudyResourceControllerService.updateResource({
      id: resourceId.value,
      content: content,
    });
    if (response.code == 200) {
      articleContent.value = content;
    }
  } catch (error) {
    Message.error("自动保存失败");
    console.error("Auto save article error:", error);
  }
}, 2000);

// 初始化 Vditor
const initVditor = (isMain = false) => {
  const elementId = isMain ? "vditor-main" : "vditor";
  const element = document.getElementById(elementId);
  if (!element) return;

  const instance = new Vditor(elementId, {
    height: "calc(100vh - 150px)",
    mode: "ir",
    theme: "classic",
    toolbar: [
      "emoji",
      "headings",
      "bold",
      "italic",
      "strike",
      "link",
      "|",
      "list",
      "ordered-list",
      "check",
      "outdent",
      "indent",
      "|",
      "quote",
      "line",
      "code",
      "inline-code",
      "insert-before",
      "insert-after",
      "|",
      "upload",
      "table",
      "|",
      "undo",
      "redo",
      "|",
      "fullscreen",
      "preview",
      {
        name: "more",
        toolbar: [
          "both",
          "code-theme",
          "content-theme",
          "export",
          "outline",
          "info",
          "help",
        ],
      },
    ],
    placeholder: isMain ? "在这里编辑文章..." : "在这里编辑笔记...",
    cache: {
      enable: false,
    },
    after: () => {
      if (noteContent.value) {
        instance.setValue(noteContent.value);
      }
    },
    input: (value: string) => {
      autoSaveNote(value);
    },
    blur: () => {
      if (instance) {
        const content = instance.getValue();
        autoSaveNote.flush();
        saveNote(content);
      }
    },
  });

  if (isMain) {
    vditor.value = instance;
  }
};

// 修改 onMounted 钩子
onMounted(async () => {
  const id = route.query.id as string;
  resourceId.value = id;
  if (id) {
    await loadNoteContent(id);

    // 根据资源类型初始化不同的编辑器
    await nextTick();
    if (resourceType.value === StudyResourceVO.resourceType.NOTE) {
      initVditor(true); // 初始化主编辑器
    } else {
      initVditor(false); // 初始化右侧编辑器
    }

    // 只有当资源类型是 PDF 时才加载预览 URL
    if (resourceType.value === StudyResourceVO.resourceType.PDF) {
      try {
        const response = await StudyResourceControllerService.previewFile(id);
        if (response.code === 200 && response.data?.url) {
          pdfUrl.value = response.data.url;
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

// 修改 loadNoteContent 方法
const loadNoteContent = async (id: string) => {
  try {
    const resourceResponse =
      await StudyResourceControllerService.getResourceDetail(id);
    if (resourceResponse.code === 200 && resourceResponse.data) {
      const content = resourceResponse.data.note || "";
      const articleText = resourceResponse.data.content || "";
      noteContent.value = content;
      articleContent.value = articleText;
      resourceType.value = resourceResponse.data.resourceType;

      // 先清空 AI 助手的默认标签
      if (aiChatRef.value) {
        aiChatRef.value.setDefaultTags([]);
      }

      // 如果是URL类型资源，设置网页地址
      if (
        resourceType.value === StudyResourceVO.resourceType.URL &&
        webViewerRef.value &&
        resourceResponse.data.resourceUrl
      ) {
        await nextTick(); // 等待 DOM 更新
        webViewerRef.value.loadUrl(resourceResponse.data.resourceUrl);
      }

      // 只在初始加载时设置视图
      if (!rightView.value || rightView.value === "note") {
        if (resourceType.value === StudyResourceVO.resourceType.NOTE) {
          rightView.value = "note";
        } else if (resourceType.value === StudyResourceVO.resourceType.URL) {
          rightView.value = "web";
        } else if (
          resourceType.value === StudyResourceVO.resourceType.ARTICLE
        ) {
          rightView.value = "note";
        }
      }

      // 如果编辑器已存在，直接设置内容
      if (vditor.value) {
        vditor.value.setValue(
          rightView.value === "note" ? noteContent.value : articleContent.value
        );
      }

      // 如果存在结构化标签,则设置到 AI 助手
      if (
        resourceResponse.data.structuredTags &&
        resourceResponse.data.structuredTags.length > 0 &&
        aiChatRef.value
      ) {
        // 同时更新本地状态和 AI 组件的状态
        defaultTags.value = resourceResponse.data.structuredTags;
        aiChatRef.value.setDefaultTags(resourceResponse.data.structuredTags);
      }
    }
  } catch (error) {
    Message.error("加载内容失败");
    console.error("Load content error:", error);
  }
};

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

// 保存笔记
const saveNote = async (content?: string) => {
  try {
    const currentContent = content ?? (vditor.value?.getValue() || "");
    const response = await StudyResourceControllerService.updateResource({
      id: resourceId.value,
      note: currentContent,
      structuredTags: defaultTags.value,
    });
    if (response.code === 200) {
      Message.success("保存成功");
      noteContent.value = currentContent;
    } else {
      Message.error("保存失败");
    }
  } catch (error) {
    Message.error("保存失败");
    console.error("Save note error:", error);
  }
};

// 保存文章
const saveArticle = async (content?: string) => {
  try {
    const currentContent = content ?? (vditor.value?.getValue() || "");
    const response = await StudyResourceControllerService.updateResource({
      id: resourceId.value,
      content: currentContent,
      structuredTags: defaultTags.value,
    });
    if (response.code === 200) {
      Message.success("保存成功");
      articleContent.value = currentContent;
    } else {
      Message.error("保存失败");
    }
  } catch (error) {
    Message.error("保存失败");
    console.error("Save article error:", error);
  }
};

// 手动保存按钮点击事件
const handleSave = () => {
  saveNote();
};

// 添加保存标签的方法
const saveStructuredTags = async (tags: string[]) => {
  // 比较新旧标签是否相同
  const currentTags = defaultTags.value || [];
  const isEqual =
    tags.length === currentTags.length &&
    tags.every((tag) => currentTags.includes(tag)) &&
    currentTags.every((tag) => tags.includes(tag));

  // 如果标签相同，不进行更新
  if (isEqual) {
    return;
  }

  try {
    const response = await StudyResourceControllerService.updateResource({
      id: resourceId.value,
      structuredTags: tags,
    });
    if (response.code === 200) {
      defaultTags.value = tags;
    } else {
      Message.error("保存标签失败");
    }
  } catch (error) {
    Message.error("保存标签失败");
    console.error("Save tags error:", error);
  }
};

// 修改 onUnmounted 钩子
onUnmounted(() => {
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
  document.removeEventListener("touchmove", handleResize);
  document.removeEventListener("touchend", stopResize);
  document.removeEventListener("mouseup", handleTextSelection);

  // 确保编辑器实例被正确销毁
  if (vditor.value) {
    vditor.value.destroy();
    vditor.value = undefined;
  }
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

.right-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.right-controls {
  padding: 4px 0;
  background-color: white;
  border-bottom: 1px solid var(--color-border);
}

.controls-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.chat-container,
.note-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(
    100vh - 37px
  ); /* 37px = 控制栏高度(29px) + 边框(1px) + 内边距(8px) */
}

.note-editor {
  flex: 1;
  overflow: auto;
  height: calc(100vh - 90px); /* 调整高度以适应新的布局 */
}

.note-actions {
  padding: 4px 8px;
  background-color: white;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
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

.viewer-container {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.web-container {
  height: 100%;
}

.note-container {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.note-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.note-view {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.note-editor {
  height: calc(100vh - 150px);
  margin-bottom: 16px;
}
</style>

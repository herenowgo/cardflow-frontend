<template>
  <a-layout class="h-screen relative">
    <a-layout-sider
      :width="siderWidth"
      class="bg-white resizable-sider"
      :style="{ width: `${siderWidth}px` }"
    >
      <div class="pdf-container">
        <div class="pdf-toolbar">
          <!-- 工具栏内容 -->
        </div>
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

    <a-layout-content class="bg-gray-100">
      <div class="p-4 h-full overflow-auto">
        <a-form :model="flashcard" @submit.prevent="createFlashcard">
          <a-form-item field="question" label="笔记标题">
            <a-input v-model="flashcard.question" placeholder="输入笔记标题" />
          </a-form-item>
          <a-form-item field="answer" label="笔记内容">
            <a-textarea
              v-model="flashcard.answer"
              placeholder="输入笔记内容"
              :auto-size="{ minRows: 3, maxRows: 6 }"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit">保存笔记</a-button>
          </a-form-item>
        </a-form>

        <a-divider />

        <div class="notes-list">
          <a-list :data="flashcards" class="mb-4">
            <template #item="{ item }">
              <a-list-item>
                <a-card hoverable class="w-full">
                  <template #title>{{ item.question }}</template>
                  <template #extra>
                    <a-button status="danger" @click="deleteFlashcard(item)"
                      >删除</a-button
                    >
                  </template>
                  <div class="whitespace-pre-wrap">{{ item.answer }}</div>
                </a-card>
              </a-list-item>
            </template>
          </a-list>
        </div>
      </div>
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { Message } from "@arco-design/web-vue";
import PdfViewer from "./PdfViewer.vue";
import { UserFileControllerService } from "../../../generated";

const route = useRoute();
const pdfUrl = ref<string>("");

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
});

interface Note {
  question: string;
  answer: string;
}

const flashcard = reactive<Note>({
  question: "",
  answer: "",
});

const flashcards = ref<Note[]>([]);

const showAnalysis = ref(false);
const aiAnalysis = ref("");
const analyzing = ref(false);

const createFlashcard = () => {
  if (flashcard.question && flashcard.answer) {
    flashcards.value.push({ ...flashcard });
    flashcard.question = "";
    flashcard.answer = "";
    Message.success("Flashcard created successfully");
  } else {
    Message.error("Please fill in both question and answer");
  }
};

const deleteFlashcard = (item: Note) => {
  const index = flashcards.value.indexOf(item);
  if (index > -1) {
    flashcards.value.splice(index, 1);
    Message.success("笔记删除成功");
  }
};

const analyzeFlashcards = async () => {
  analyzing.value = true;
  try {
    // This is a mock API call. Replace with your actual AI analysis API
    const response = await fetch("https://api.example.com/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(flashcards.value),
    });
    const data = await response.json();
    aiAnalysis.value = data.analysis;
    showAnalysis.value = true;
  } catch (error) {
    Message.error("Failed to analyze flashcards");
    console.error("Error:", error);
  } finally {
    analyzing.value = false;
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

.pdf-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 32px; /* 工具栏固定高度 */
  z-index: 10;
  background-color: white;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pdf-content {
  padding-top: 32px; /* 与工具栏高度相同 */
  height: 100%;
  overflow-y: auto;
  flex: 1;
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

.notes-list {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}
</style>

<template>
  <a-layout class="h-screen relative">
    <a-layout-sider
      :width="siderWidth"
      class="bg-white resizable-sider"
      :style="{ width: `${siderWidth}px` }"
    >
      <div class="p-4 h-full">
        <h2 class="text-2xl font-bold mb-4">PDF Viewer</h2>
        <pdf-viewer :source="pdfUrl" />
      </div>
    </a-layout-sider>

    <div
      class="resizer"
      @mousedown="startResize"
      @touchstart="startResize"
    ></div>

    <a-layout-content class="bg-gray-100">
      <div class="p-4">
        <h2 class="text-2xl font-bold mb-4">Flashcard Maker</h2>
        <a-form :model="flashcard" @submit.prevent="createFlashcard">
          <a-form-item field="question" label="Question">
            <a-input
              v-model="flashcard.question"
              placeholder="Enter question"
            />
          </a-form-item>
          <a-form-item field="answer" label="Answer">
            <a-textarea v-model="flashcard.answer" placeholder="Enter answer" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit"
              >Create Flashcard
            </a-button>
          </a-form-item>
        </a-form>

        <a-divider />

        <h3 class="text-xl font-bold mb-2">Flashcards</h3>
        <a-list :data="flashcards" class="mb-4">
          <template #item="{ item }">
            <a-list-item>
              <a-card hoverable>
                <template #title>{{ item.question }}</template>
                <template #extra>
                  <a-button status="danger" @click="deleteFlashcard(item)"
                    >Delete
                  </a-button>
                </template>
                {{ item.answer }}
              </a-card>
            </a-list-item>
          </template>
        </a-list>

        <a-button
          type="primary"
          @click="analyzeFlashcards"
          :loading="analyzing"
        >
          Analyze Flashcards
        </a-button>

        <a-modal
          v-model:visible="showAnalysis"
          title="AI Analysis"
          @ok="showAnalysis = false"
        >
          <p>{{ aiAnalysis }}</p>
        </a-modal>
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
const pdfUrl = ref("");

onMounted(async () => {
  // 从路由参数中获取 URL
  const urlFromQuery = route.query.url as string;
  if (urlFromQuery) {
    pdfUrl.value = urlFromQuery;
  } else {
    // 如果 URL 不存在，可以尝试重新获取
    const path = route.query.path as string;
    if (path) {
      try {
        const res = await UserFileControllerService.previewFile(path);
        if (res.code === 200 && res.data) {
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

const flashcard = reactive({
  question: "",
  answer: "",
});

const flashcards = ref([]);

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

const deleteFlashcard = (item: any) => {
  const index = flashcards.value.indexOf(item);
  if (index > -1) {
    flashcards.value.splice(index, 1);
    Message.success("Flashcard deleted successfully");
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
  /* 调整位置到sider右侧 */
  left: calc(v-bind(siderWidth) * 1px);
  transform: translateX(-50%);
}

.resizer:hover,
.resizer:active {
  background-color: var(--color-primary-light-4);
}

/* 拖动时禁止选择文本 */
:global(.resize-active) {
  user-select: none;
  cursor: col-resize;
}

/* 确保布局容器是相对定位 */
.h-screen {
  position: relative;
  height: 100vh;
  overflow: hidden;
}
</style>

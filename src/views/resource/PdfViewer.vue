<template>
  <div class="pdf-viewer-container">
    <!-- 添加目录抽屉 -->
    <a-drawer
      v-model:visible="outlineVisible"
      :width="300"
      title="目录"
      placement="left"
      unmountOnClose
    >
      <template v-if="outline.length">
        <a-tree
          :data="outline"
          :default-expanded-keys="['0-0']"
          @select="handleOutlineSelect"
        >
          <template #title="{ title, pageNumber }">
            <span class="outline-item" @click="jumpToPage(pageNumber)">
              {{ title }}
              <span class="page-number">{{ pageNumber }}</span>
            </span>
          </template>
        </a-tree>
      </template>
      <template v-else>
        <div class="empty-outline">
          <icon-file-pdf />
          <span>暂无目录信息</span>
        </div>
      </template>
    </a-drawer>

    <div class="pdf-controls">
      <!-- 添加目录按钮 -->
      <div class="control-group">
        <a-tooltip content="目录">
          <a-button @click="toggleOutline">
            <template #icon>
              <icon-menu />
            </template>
          </a-button>
        </a-tooltip>
        <!-- 保持现有的控制按钮 -->
        <a-button-group>
          <a-tooltip content="上一页">
            <a-button @click="previousPage" :disabled="currentPage === 1">
              <template #icon>
                <icon-left />
              </template>
            </a-button>
          </a-tooltip>

          <div class="page-input-wrapper">
            <a-input-number
              v-model="currentPage"
              :min="1"
              :max="pageCount"
              @change="onPageChange"
              :style="{ width: '80px' }"
              :controls="false"
            />
            <span class="page-separator">/</span>
            <span class="total-pages">{{ pageCount }}</span>
          </div>

          <a-tooltip content="下一页">
            <a-button @click="nextPage" :disabled="currentPage === pageCount">
              <template #icon>
                <icon-right />
              </template>
            </a-button>
          </a-tooltip>
        </a-button-group>
      </div>

      <!-- 缩放控制组 -->
      <div class="control-group">
        <a-tooltip content="缩小">
          <a-button @click="zoomOut" :disabled="scale <= 0.5">
            <template #icon>
              <icon-minus />
            </template>
          </a-button>
        </a-tooltip>

        <a-select
          v-model="scale"
          :style="{ width: '120px' }"
          @change="onScaleChange"
        >
          <a-option :value="0.5">50%</a-option>
          <a-option :value="0.75">75%</a-option>
          <a-option :value="1">100%</a-option>
          <a-option :value="1.25">125%</a-option>
          <a-option :value="1.5">150%</a-option>
          <a-option :value="2">200%</a-option>
        </a-select>

        <a-tooltip content="放大">
          <a-button @click="zoomIn" :disabled="scale >= 2">
            <template #icon>
              <icon-plus />
            </template>
          </a-button>
        </a-tooltip>

        <a-tooltip content="适应页面">
          <a-button @click="fitToPage">
            <template #icon>
              <icon-fullscreen />
            </template>
          </a-button>
        </a-tooltip>
      </div>
    </div>

    <!-- PDF 显示区域 -->
    <div ref="pdfContainer" class="pdf-viewer">
      <div v-if="loading" class="loading-overlay">
        <a-spin dot />
        <span class="loading-text">加载中...</span>
      </div>
      <div v-if="error" class="error-message">
        <icon-exclamation-circle-fill />
        <span>{{ error }}</span>
      </div>
      <!-- 添加一个包装器来容纳画布和文本层 -->
      <div class="page-container">
        <div ref="canvasWrapper" class="canvas-wrapper"></div>
        <div ref="textLayerWrapper" class="text-layer-div"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, defineProps } from "vue";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import { renderTextLayer } from "pdfjs-dist/build/pdf";
import {
  IconLeft,
  IconRight,
  IconMinus,
  IconPlus,
  IconFullscreen,
  IconExclamationCircleFill,
  IconMenu,
  IconFilePdf,
} from "@arco-design/web-vue/es/icon";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const props = defineProps({
  source: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
});

const pdfContainer = ref(null);
const currentPage = ref(1);
const pageCount = ref(0);
const scale = ref(1);
let pdfDoc = null;

// 新增状态
const loading = ref(false);
const error = ref("");

const canvasWrapper = ref(null);
const textLayerWrapper = ref(null);

// 添加目录相关的状态
const outlineVisible = ref(false);
const outline = ref([]);

// 添加保存和恢复阅读进度的函数
const saveReadingProgress = () => {
  // 使用文件路径作为 key
  const key = `pdf-progress-${props.path}`;
  localStorage.setItem(key, currentPage.value.toString());
};

const restoreReadingProgress = () => {
  const key = `pdf-progress-${props.source}`;
  const savedPage = localStorage.getItem(key);
  if (savedPage) {
    const page = parseInt(savedPage);
    // 确保页码在有效范围内
    if (page >= 1 && page <= pageCount.value) {
      currentPage.value = page;
    }
  }
};

const loadPDF = async () => {
  loading.value = true;
  error.value = "";
  try {
    pdfDoc = await pdfjsLib.getDocument(props.source).promise;
    pageCount.value = pdfDoc.numPages;
    await loadOutline(); // 加载目录

    // 在设置了 pageCount 后再恢复进度，使用文件路径作为 key
    const key = `pdf-progress-${props.path}`;
    const savedPage = localStorage.getItem(key);
    if (savedPage) {
      const page = parseInt(savedPage);
      if (page >= 1 && page <= pageCount.value) {
        currentPage.value = page;
      }
    }

    renderPage(currentPage.value);
  } catch (err) {
    console.error("Error loading PDF:", err);
    error.value = "PDF 加载失败，请检查文件是否正确";
  } finally {
    loading.value = false;
  }
};

const renderPage = async (pageNumber) => {
  if (!pdfDoc) return;

  try {
    const page = await pdfDoc.getPage(pageNumber);

    // 计算更高的渲染分辨率
    const pixelRatio = window.devicePixelRatio || 1;
    const viewport = page.getViewport({ scale: scale.value * pixelRatio });
    // 创建用于文本层的视口，使用原始缩放
    const textViewport = page.getViewport({ scale: scale.value });

    // 创建和设置画布
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // 设置画布的实际尺寸（更高分辨率）
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // 设置画布的显示尺寸（CSS尺寸）
    canvas.style.width = `${viewport.width / pixelRatio}px`;
    canvas.style.height = `${viewport.height / pixelRatio}px`;

    // 优化渲染上下文
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    // 清空容器
    canvasWrapper.value.innerHTML = "";
    textLayerWrapper.value.innerHTML = "";

    // 添加画布到容器
    canvasWrapper.value.appendChild(canvas);

    // 渲染PDF页面到画布
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      enableWebGL: true,
      renderInteractiveForms: true,
    };

    // 同时获取文本内容
    const textContent = await page.getTextContent();

    // 渲染页面
    await page.render(renderContext);

    // 创建文本层div
    const textLayerDiv = document.createElement("div");
    textLayerDiv.className = "text-layer";

    // 设置文本层的尺寸和位置
    textLayerDiv.style.width = `${textViewport.width}px`;
    textLayerDiv.style.height = `${textViewport.height}px`;
    textLayerWrapper.value.appendChild(textLayerDiv);

    // 渲染文本层
    await renderTextLayer({
      textContent,
      container: textLayerDiv,
      viewport: textViewport,
      textDivs: [],
    });
  } catch (err) {
    console.error("Error rendering page:", err);
    error.value = "页面渲染失败";
  }
};

const onPageChange = (page) => {
  currentPage.value = page;
  renderPage(page);
  saveReadingProgress();
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    renderPage(currentPage.value);
    saveReadingProgress();
  }
};

const nextPage = () => {
  if (currentPage.value < pageCount.value) {
    currentPage.value++;
    renderPage(currentPage.value);
    saveReadingProgress();
  }
};

const onScaleChange = (newScale) => {
  scale.value = newScale;
  renderPage(currentPage.value);
};

// 新增缩放功能
const zoomIn = () => {
  if (scale.value < 2) {
    // 使用更小的缩放增量以获得更平滑的缩放效果
    scale.value = Math.min(2, scale.value + 0.1);
    renderPage(currentPage.value);
  }
};

const zoomOut = () => {
  if (scale.value > 0.5) {
    scale.value = Math.max(0.5, scale.value - 0.1);
    renderPage(currentPage.value);
  }
};

const fitToPage = () => {
  // 计算适合容器的缩放比例
  if (!pdfDoc) return;

  const container = pdfContainer.value;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  pdfDoc.getPage(currentPage.value).then((page) => {
    const viewport = page.getViewport({ scale: 1 });
    const scaleWidth = containerWidth / viewport.width;
    const scaleHeight = containerHeight / viewport.height;
    scale.value = Math.min(scaleWidth, scaleHeight) * 0.95; // 留一些边距
    renderPage(currentPage.value);
  });
};

// 加载 PDF 大纲
const loadOutline = async () => {
  if (!pdfDoc) return;

  try {
    const pdfOutline = await pdfDoc.getOutline();
    if (pdfOutline) {
      outline.value = transformOutline(pdfOutline);
    }
  } catch (err) {
    console.error("Error loading outline:", err);
  }
};

// 转换 PDF 大纲为树形结构
const transformOutline = (pdfOutline, parentKey = "0") => {
  return pdfOutline.map((item, index) => {
    const key = `${parentKey}-${index}`;
    const result = {
      key,
      title: item.title,
      pageNumber: null,
      children: item.items ? transformOutline(item.items, key) : [],
    };

    // 获取目标页码
    if (item.dest) {
      if (typeof item.dest === "string") {
        pdfDoc.getDestination(item.dest).then((dest) => {
          if (dest) {
            pdfDoc.getPageIndex(dest[0]).then((pageIndex) => {
              result.pageNumber = pageIndex + 1;
            });
          }
        });
      } else if (Array.isArray(item.dest)) {
        pdfDoc.getPageIndex(item.dest[0]).then((pageIndex) => {
          result.pageNumber = pageIndex + 1;
        });
      }
    }

    return result;
  });
};

// 处理目录项点击
const jumpToPage = (pageNumber) => {
  if (pageNumber && pageNumber !== currentPage.value) {
    currentPage.value = pageNumber;
    renderPage(pageNumber);
    saveReadingProgress();
  }
};

// 切换目录显示
const toggleOutline = () => {
  outlineVisible.value = !outlineVisible.value;
};

onMounted(() => {
  loadPDF();
});

watch(() => props.source, loadPDF);
</script>

<style scoped>
.pdf-viewer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-2);
}

.pdf-controls {
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
}

.page-input-wrapper {
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.page-separator {
  margin: 0 4px;
  color: var(--color-text-2);
}

.total-pages {
  color: var(--color-text-3);
  min-width: 24px;
}

.pdf-viewer {
  flex-grow: 1;
  overflow: auto;
  position: relative;
  display: flex;
  justify-content: center;
  padding: 20px;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

.pdf-viewer canvas {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-text {
  color: var(--color-text-2);
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-danger);

  :deep(.icon) {
    font-size: 20px;
  }
}

.page-container {
  position: relative;
  margin: auto;
  display: inline-block;
}

.canvas-wrapper {
  position: relative;
  z-index: 1;
}

.text-layer-div {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 2;
  pointer-events: none; /* 允许点击穿透到文本 */
}

/* PDF.js 文本层样式 */
:deep(.text-layer) {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 1;
  line-height: 1;
  user-select: text;
  pointer-events: auto; /* 恢复文本的交互性 */
}

:deep(.text-layer > span) {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}

:deep(.text-layer ::selection) {
  background: rgba(0, 0, 255, 0.2);
}

/* 移除可能影响对齐的样式 */
.text-layer-wrapper {
  opacity: 1;
}

.outline-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  cursor: pointer;
  color: var(--color-text-1);

  &:hover {
    color: rgb(var(--primary-6));
  }
}

.page-number {
  color: var(--color-text-3);
  font-size: 12px;
  margin-left: 8px;
}

.empty-outline {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--color-text-3);

  :deep(.icon) {
    font-size: 48px;
    margin-bottom: 16px;
  }
}

:deep(.arco-tree-node-title) {
  width: 100%;
}

:deep(.arco-tree-node-selected) {
  .outline-item {
    color: rgb(var(--primary-6));
  }
}
</style>

<template>
  <div class="pdf-preview">
    <div class="pdf-toolbar">
      <a-space>
        <a-button-group>
          <a-button @click="currentPage--" :disabled="currentPage <= 1">
            <template #icon>
              <icon-left />
            </template>
            上一页
          </a-button>
          <a-button @click="currentPage++" :disabled="currentPage >= pageCount">
            下一页
            <template #icon>
              <icon-right />
            </template>
          </a-button>
        </a-button-group>
        <span>{{ currentPage }} / {{ pageCount }} 页</span>
        <a-select v-model="scale" style="width: 120px">
          <a-option value="0.5">50%</a-option>
          <a-option value="1">100%</a-option>
          <a-option value="1.5">150%</a-option>
          <a-option value="2">200%</a-option>
        </a-select>
      </a-space>
    </div>

    <div class="pdf-container" ref="container">
      <a-spin :loading="loading" dot>
        <vue-pdf-embed
          :source="source"
          :page="currentPage"
          :style="{ transform: `scale(${scale})` }"
          @rendered="onRendered"
          @loading="loading = true"
          @loaded="loading = false"
          @error="onError"
        />
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import VuePdfEmbed from "vue-pdf-embed";
import { IconLeft, IconRight } from "@arco-design/web-vue/es/icon";
import { Message } from "@arco-design/web-vue";

const currentPage = ref(1);
const pageCount = ref(1);
const scale = ref("1");
const loading = ref(true);
const container = ref();

const onRendered = (e: any) => {
  if (!pageCount.value) {
    pageCount.value = e.numPages;
  }
};

const onError = (error: Error) => {
  loading.value = false;
  Message.error("PDF 加载失败：" + error.message);
  console.error("PDF loading error:", error);
};
</script>

<style scoped>
.pdf-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
}

.pdf-toolbar {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-2);
}

.pdf-container {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
}

:deep(.vue-pdf-embed) {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform-origin: top center;
}
</style>

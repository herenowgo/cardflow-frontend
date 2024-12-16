<template>
  <div class="streaming-markdown-container">
    <div v-if="!content && loading" class="streaming-markdown-loading">
      <a-spin dot />
    </div>
    <template v-else>
      <div class="streaming-markdown-header" v-if="showHeader">
        <icon-robot v-if="showRobotIcon" />
        <span>{{ title }}</span>
      </div>

      <div class="streaming-markdown-content">
        <div class="streaming-markdown-text-wrapper">
          <MdViewer :value="content" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from "vue";
import { IconRobot } from "@arco-design/web-vue/es/icon";
import MdViewer from "@/components/MdViewer.vue";
import { eventStreamService } from "@/services/EventStreamService";

const props = defineProps<{
  // 请求ID，用于标识流式响应
  requestId?: string;
  // 初始内容
  initialContent?: string;
  // 是否显示头部
  showHeader?: boolean;
  // 是否显示机器人图标
  showRobotIcon?: boolean;
  // 标题
  title?: string;
  // 自定义样式
  customClass?: string;
}>();

const emit = defineEmits<{
  // 内容更新时触发
  (e: "update", content: string): void;
  // 加载完成时触发
  (e: "complete", content: string): void;
  // 发生错误时触发
  (e: "error", error: any): void;
}>();

const content = ref(props.initialContent || "");
const loading = ref(false);

// 开始流式接收内容
const startStreaming = async (requestId: string) => {
  if (!requestId) return;

  loading.value = true;
  content.value = "";

  try {
    await eventStreamService.waitForStreamingResult(
      requestId,
      (newContent: string) => {
        content.value = newContent;
        emit("update", newContent);
      }
    );
    emit("complete", content.value);
  } catch (error) {
    console.error("Streaming error:", error);
    emit("error", error);
  } finally {
    loading.value = false;
  }
};

// 监听 requestId 变化
watch(
  () => props.requestId,
  (newRequestId) => {
    if (newRequestId) {
      startStreaming(newRequestId);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.streaming-markdown-container {
  margin-top: 16px;
  border-radius: 8px;
  background: var(--color-bg-2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.streaming-markdown-header {
  padding: 12px 16px;
  background: var(--color-fill-2);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-1);
}

.streaming-markdown-header :deep(.icon-robot) {
  font-size: 18px;
  color: var(--color-primary);
}

.streaming-markdown-content {
  padding: 16px;
}

.streaming-markdown-text-wrapper {
  background: var(--color-bg-1);
  border-radius: 4px;
  padding: 16px;
}

.streaming-markdown-loading {
  display: flex;
  justify-content: center;
  padding: 8px;
}

/* 自定义 Markdown 样式 */
.streaming-markdown-text-wrapper :deep(.md-viewer) {
  background: transparent;
  padding: 0;
}

.streaming-markdown-text-wrapper :deep(.md-viewer pre) {
  background: var(--color-fill-1);
  border-radius: 4px;
  padding: 12px;
  margin: 12px 0;
}

.streaming-markdown-text-wrapper :deep(.md-viewer code) {
  font-family: var(--font-family-mono);
  background: var(--color-fill-1);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>

<template>
  <div id="userAnalysisView">
    <a-card class="analysis-card">
      <template #title>
        <div class="card-title">
          <icon-robot :style="{ fontSize: '24px', marginRight: '8px' }" />
          <span>AI 学习分析</span>
        </div>
      </template>

      <div class="analysis-content">
        <template v-if="loading">
          <div class="loading-container">
            <a-spin dot size="large">
              <template #tip>
                <p class="loading-text">AI正在分析您的学习记录...</p>
              </template>
            </a-spin>
          </div>
        </template>

        <template v-else-if="analysisResult">
          <div class="result-container">
            <MdViewer :value="analysisResult" />
          </div>

          <div class="action-container">
            <a-button type="primary" @click="refreshAnalysis">
              <template #icon>
                <icon-refresh />
              </template>
              重新分析
            </a-button>
          </div>
        </template>

        <template v-else>
          <a-empty description="暂无分析结果">
            <template #image>
              <icon-robot :style="{ fontSize: '64px', color: '#C9CDD4' }" />
            </template>
            <a-button type="primary" @click="getAnalysis"> 开始分析 </a-button>
          </a-empty>
        </template>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { AiControllerService } from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import { IconRobot, IconRefresh } from "@arco-design/web-vue/es/icon";
import MdViewer from "@/components/MdViewer.vue";

const loading = ref(false);
const analysisResult = ref("");

const getAnalysis = async () => {
  loading.value = true;
  try {
    const res = await AiControllerService.analyzeUserSubmitRecord();
    if (String(res.code) === "200") {
      analysisResult.value = res.data || "暂无分析结果";
    } else {
      message.error("分析失败：" + res.message);
    }
  } catch (error) {
    message.error("分析请求失败，请稍后重试");
  } finally {
    loading.value = false;
  }
};

const refreshAnalysis = () => {
  analysisResult.value = "";
  getAnalysis();
};
</script>

<style scoped>
#userAnalysisView {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.analysis-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
}

.analysis-content {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.loading-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 0;
}

.loading-text {
  margin-top: 16px;
  color: var(--color-text-2);
}

.result-container {
  padding: 16px;
  background: var(--color-fill-2);
  border-radius: 8px;
  margin-bottom: 16px;
}

.action-container {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

:deep(.arco-empty) {
  padding: 64px 0;
}

/* Markdown 查看器的自定义样式 */
:deep(.md-viewer) {
  background: transparent;
  padding: 0;
}

:deep(.md-viewer pre) {
  background-color: var(--color-fill-1);
  border-radius: 4px;
  padding: 16px;
}

:deep(.md-viewer code) {
  background-color: var(--color-fill-1);
  padding: 2px 6px;
  border-radius: 4px;
}

:deep(.md-viewer blockquote) {
  border-left: 4px solid var(--color-primary-light-3);
  padding-left: 16px;
  color: var(--color-text-2);
  background: var(--color-fill-1);
  border-radius: 0 4px 4px 0;
}

:deep(.md-viewer table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

:deep(.md-viewer th),
:deep(.md-viewer td) {
  border: 1px solid var(--color-border);
  padding: 8px 12px;
}

:deep(.md-viewer th) {
  background-color: var(--color-fill-1);
}
</style>

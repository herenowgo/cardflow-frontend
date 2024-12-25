<template>
  <div class="resource-preview-layout">
    <!-- 左侧 PDF 预览 -->
    <div class="pdf-section">
      <div class="toolbar">
        <a-button @click="router.back()">
          <template #icon>
            <icon-left />
          </template>
          返回
        </a-button>
      </div>

      <pdf-preview
        v-if="pdfUrl"
        :source="{
          url: pdfUrl,
          withCredentials: true,
        }"
      />
    </div>

    <!-- 右侧面板 -->
    <div class="interaction-section">
      <a-tabs>
        <a-tab-pane key="1" title="目录">
          <div class="outline-container" v-if="outlines && outlines.length">
            <a-tree :data="outlines" @select="handleOutlineSelect" />
          </div>
          <a-empty v-else description="暂无目录" />
        </a-tab-pane>
        <a-tab-pane key="2" title="制作卡片">
          <div class="card-creation">
            <a-form :model="cardForm" layout="vertical">
              <a-form-item label="问题">
                <a-textarea
                  v-model="cardForm.question"
                  :auto-size="{ minRows: 3 }"
                  placeholder="输入问题..."
                />
              </a-form-item>
              <a-form-item label="答案">
                <a-textarea
                  v-model="cardForm.answer"
                  :auto-size="{ minRows: 3 }"
                  placeholder="输入答案..."
                />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" @click="createCard">创建卡片</a-button>
              </a-form-item>
            </a-form>
          </div>
        </a-tab-pane>
        <a-tab-pane key="3" title="AI 助手">
          <div class="ai-chat">
            <div class="chat-messages" ref="chatContainer">
              <div
                v-for="(msg, index) in chatMessages"
                :key="index"
                :class="['message', msg.role]"
              >
                {{ msg.content }}
              </div>
            </div>
            <div class="chat-input">
              <a-input-search
                v-model="chatInput"
                placeholder="输入问题..."
                search-button
                @search="sendMessage"
              />
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Message } from "@arco-design/web-vue";
import PdfPreview from "@/components/PdfPreview.vue";
import { UserFileControllerService } from "../../../generated";

const router = useRouter();
const route = useRoute();
const pdfUrl = ref("");
const outlines = ref([]);
const cardForm = ref({
  question: "",
  answer: "",
});
const chatMessages = ref([]);
const chatInput = ref("");

// 获取 PDF URL
const getPdfUrl = async () => {
  try {
    if (!route.query.path) {
      Message.error("文件路径不存在");
      return;
    }
    console.log("Fetching PDF URL for path:", route.query.path);
    const res = await UserFileControllerService.previewFile(
      route.query.path as string
    );
    console.log("Preview file response:", res);
    if (res.code === 200 && res.data) {
      pdfUrl.value = res.data.url;
      console.log("PDF URL set to:", pdfUrl.value);
    }
  } catch (err) {
    console.error("Get PDF URL error:", err);
    Message.error("获取 PDF URL 失败");
  }
};

// 处理目录选择
const handleOutlineSelect = (selectedKeys: string[]) => {
  console.log("Selected outline:", selectedKeys);
};

// 创建卡片
const createCard = () => {
  // 实现创建卡片的逻辑
  console.log("Creating card:", cardForm.value);
};

// 发送消息
const sendMessage = () => {
  if (!chatInput.value.trim()) return;

  chatMessages.value.push({
    role: "user",
    content: chatInput.value,
  });

  chatInput.value = "";
};

onMounted(async () => {
  await getPdfUrl();
});
</script>

<style scoped>
.resource-preview-layout {
  height: 100%;
  display: flex;
  background: var(--color-bg-1);
}

.pdf-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
}

.toolbar {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-2);
}

.interaction-section {
  width: 400px;
  display: flex;
  flex-direction: column;
}
</style>

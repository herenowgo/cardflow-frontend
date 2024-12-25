<template>
  <div class="resource-preview-layout">
    <!-- 左侧 PDF 预览 -->
    <div class="pdf-section">
      <div class="pdf-toolbar">
        <a-space>
          <a-button @click="router.back()">
            <template #icon>
              <icon-left />
            </template>
            返回
          </a-button>
          <span class="file-name">{{ route.query.name }}</span>
        </a-space>
      </div>
      <div class="pdf-container">
        <a-spin :loading="loading">
          <vue-pdf-embed
            v-if="route.query.url"
            :source="route.query.url as string"
            :page="currentPage"
            @rendered="onRendered"
            @loading="loading = true"
            @loaded="loading = false"
            @error="onError"
          />
        </a-spin>
        <div class="pdf-navigation">
          <a-space>
            <a-button-group>
              <a-button @click="currentPage--" :disabled="currentPage <= 1">
                <template #icon>
                  <icon-left />
                </template>
                上一页
              </a-button>
              <a-button
                @click="currentPage++"
                :disabled="currentPage >= pageCount"
              >
                下一页
                <template #icon>
                  <icon-right />
                </template>
              </a-button>
            </a-button-group>
            <a-input-number
              v-model="currentPage"
              :min="1"
              :max="pageCount"
              style="width: 80px"
            />
            <span>/ {{ pageCount }} 页</span>
          </a-space>
        </div>
      </div>
    </div>

    <!-- 右侧卡片制作和AI互动 -->
    <div class="interaction-section">
      <a-tabs>
        <a-tab-pane key="1" title="制作卡片">
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
        <a-tab-pane key="2" title="AI 助手">
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
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import VuePdfEmbed from "vue-pdf-embed";
import { IconLeft, IconRight } from "@arco-design/web-vue/es/icon";
import { Message } from "@arco-design/web-vue";
import { CardControllerService } from "../../../generated";

const router = useRouter();
const route = useRoute();

// PDF 相关状态
const currentPage = ref(1);
const pageCount = ref(1);
const loading = ref(true);

// 卡片相关状态
const cardForm = ref({
  question: "",
  answer: "",
  group: "default", // 可以根据需要修改默认分组
});

// 聊天相关状态
const chatInput = ref("");
const chatMessages = ref<Array<{ role: string; content: string }>>([]);
const chatContainer = ref();

// PDF 事件处理
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

// 卡片创建
const createCard = async () => {
  try {
    if (!cardForm.value.question.trim() || !cardForm.value.answer.trim()) {
      Message.warning("请填写完整的问题和答案");
      return;
    }

    const res = await CardControllerService.addCard({
      question: cardForm.value.question,
      answer: cardForm.value.answer,
      group: cardForm.value.group,
    });

    if (res.code === 200) {
      Message.success("卡片创建成功");
      cardForm.value.question = "";
      cardForm.value.answer = "";
    }
  } catch (error) {
    Message.error("创建失败");
  }
};

// 发送消息
const sendMessage = async () => {
  if (!chatInput.value.trim()) return;

  const userMessage = chatInput.value;
  chatMessages.value.push({ role: "user", content: userMessage });
  chatInput.value = "";

  // TODO: 实现与 AI 的对话
  // 这里需要调用后端 AI 接口
  // const response = await AIService.chat(userMessage);
  // chatMessages.value.push({ role: "assistant", content: response });
};
</script>

<style scoped>
.resource-preview-layout {
  height: 100vh;
  display: flex;
}

.pdf-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
}

.pdf-toolbar {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
}

.file-name {
  font-weight: 500;
}

.pdf-container {
  flex: 1;
  overflow: auto;
  padding: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pdf-navigation {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.interaction-section {
  width: 400px;
  display: flex;
  flex-direction: column;
}

.card-creation {
  padding: 16px;
}

.ai-chat {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
}

.message {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 4px;
}

.message.user {
  background: var(--color-fill-2);
  margin-left: 20%;
}

.message.assistant {
  background: var(--color-primary-light-1);
  margin-right: 20%;
}

.chat-input {
  padding: 8px 0;
}
</style>

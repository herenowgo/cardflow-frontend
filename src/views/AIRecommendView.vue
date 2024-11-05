<template>
  <div id="aiRecommendView">
    <a-row :gutter="24">
      <!-- 左侧聊天区域 -->
      <a-col :span="12">
        <a-card class="chat-card">
          <template #title>
            <div class="chat-header">
              <span>与AI对话获取题目推荐</span>
              <a-button type="text" @click="clearChatHistory">
                <template #icon>
                  <icon-delete />
                </template>
                清除聊天记录
              </a-button>
            </div>
          </template>
          <div class="chat-container">
            <div class="chat-messages" ref="chatMessagesRef">
              <div
                v-for="(msg, index) in chatHistory"
                :key="index"
                :class="[
                  'message-wrapper',
                  msg.isUser ? 'user-message' : 'ai-message',
                ]"
              >
                <div class="message-content">
                  <a-avatar
                    :style="{
                      backgroundColor: msg.isUser ? '#3370ff' : '#00b42a',
                    }"
                  >
                    {{ msg.isUser ? "我" : "AI" }}
                  </a-avatar>
                  <div class="message-bubble">
                    <template v-if="msg.isLoading">
                      <a-spin dot />
                    </template>
                    <template v-else>
                      <MdViewer v-if="!msg.isUser" :value="msg.content" />
                      <template v-else>{{ msg.content }}</template>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <div class="chat-input">
              <a-input
                v-model="userInput"
                placeholder="请输入您的需求"
                :style="{ width: '100%' }"
                @keyup.enter="sendMessage"
              >
                <template #append>
                  <a-button
                    type="primary"
                    @click="sendMessage"
                    :loading="loading"
                    >发送
                  </a-button>
                </template>
              </a-input>
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- 右侧推荐题目区域 -->
      <a-col :span="12">
        <a-card class="recommended-questions">
          <template #title>推荐题目</template>
          <a-spin :loading="recommendLoading">
            <div
              v-if="recommendedQuestions.length > 0"
              class="recommended-list"
            >
              <a-list :data="recommendedQuestions" :bordered="false">
                <template #item="{ item }">
                  <a-list-item
                    class="question-item"
                    @click="goToQuestion(item.id)"
                  >
                    <div class="question-title">{{ item.title }}</div>
                    <div class="question-tags">
                      <a-tag v-for="tag in item.tags" :key="tag" size="small"
                        >{{ tag }}
                      </a-tag>
                    </div>
                    <div class="question-stats">
                      <span
                        >通过率:
                        {{ calculateAcceptedRate(item).toFixed(2) }}%</span
                      >
                      <span>点赞数: {{ item.thumbNum }}</span>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
            </div>
            <div v-else class="empty-state">
              <icon-robot :style="{ fontSize: '64px', color: '#C9CDD4' }" />
            </div>
          </a-spin>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { AiControllerService, QuestionVOForRecommend } from "../../generated";
import message from "@arco-design/web-vue/es/message";
import { IconDelete, IconRobot } from "@arco-design/web-vue/es/icon";
import MdViewer from "@/components/MdViewer.vue";

const router = useRouter();
const userInput = ref("");
const loading = ref(false);
const chatHistory = ref<
  Array<{ content: string; isUser: boolean; isLoading?: boolean }>
>([]);
const recommendedQuestions = ref<Array<QuestionVOForRecommend>>([]);
const chatMessagesRef = ref<HTMLElement | null>(null);
const recommendLoading = ref(false);

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  });
};

watch(chatHistory, scrollToBottom, { deep: true });

onMounted(() => {
  // 从 localStorage 恢复数据
  const savedChatHistory = localStorage.getItem("aiChatHistory");
  const savedRecommendedQuestions = localStorage.getItem(
    "aiRecommendedQuestions"
  );

  if (savedChatHistory) {
    chatHistory.value = JSON.parse(savedChatHistory);
  }

  if (savedRecommendedQuestions) {
    recommendedQuestions.value = JSON.parse(savedRecommendedQuestions);
  }

  scrollToBottom();
});

const sendMessage = async () => {
  if (!userInput.value.trim()) return;

  const userMessage = userInput.value;
  chatHistory.value.push({ content: userMessage, isUser: true });

  // 立即添加一个 AI 的加载状态消息
  const loadingMessageIndex =
    chatHistory.value.push({ content: "", isUser: false, isLoading: true }) - 1;

  userInput.value = "";
  loading.value = true;
  recommendLoading.value = true;

  // 分别发送两个请求
  const studyPromise = AiControllerService.getStudySuggestion(userMessage)
    .then((studyResponse) => {
      if (String(studyResponse.code) === "200") {
        chatHistory.value[loadingMessageIndex] = {
          content: studyResponse.data || "抱歉，我暂时无法提供建议。",
          isUser: false,
          isLoading: false,
        };
      } else {
        chatHistory.value[loadingMessageIndex] = {
          content: "获取建议失败，请稍后重试。",
          isUser: false,
          isLoading: false,
        };
      }
      // 保存聊天历史
      localStorage.setItem("aiChatHistory", JSON.stringify(chatHistory.value));
    })
    .catch(() => {
      chatHistory.value[loadingMessageIndex] = {
        content: "获取建议失败，请稍后重试。",
        isUser: false,
        isLoading: false,
      };
      localStorage.setItem("aiChatHistory", JSON.stringify(chatHistory.value));
    });

  const recommendPromise = AiControllerService.recommendQuestionUsingPost(
    userMessage
  )
    .then((recommendResponse) => {
      if (String(recommendResponse.code) === "200" && recommendResponse.data) {
        recommendedQuestions.value = recommendResponse.data.questions || [];
        // 保存推荐题目
        localStorage.setItem(
          "aiRecommendedQuestions",
          JSON.stringify(recommendedQuestions.value)
        );
      } else {
        message.error("获取推荐题目失败: " + recommendResponse.message);
      }
    })
    .catch((error) => {
      console.error("推荐题目请求失败:", error);
      message.error("获取推荐题目失败，请稍后重试");
    })
    .finally(() => {
      recommendLoading.value = false;
    });

  try {
    // 等待所有请求完成
    await Promise.all([studyPromise, recommendPromise]);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    loading.value = false;
  }
};

const calculateAcceptedRate = (question: QuestionVOForRecommend) => {
  if (question.submitNum === 0) return 0;
  return ((question.acceptedNum ?? 0) / (question.submitNum ?? 1)) * 100;
};

const goToQuestion = (id: number) => {
  router.push(`/view/question/${id}`);
};

const clearChatHistory = () => {
  chatHistory.value = [];
  recommendedQuestions.value = [];
  localStorage.removeItem("aiChatHistory");
  localStorage.removeItem("aiRecommendedQuestions");
  message.success("聊天记录已清除");
};
</script>

<style scoped>
#aiRecommendView {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
}

.chat-card,
.recommended-questions {
  height: calc(90vh - 100px);
  display: flex;
  flex-direction: column;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.chat-input {
  padding: 16px;
  background-color: #f5f5f5;
  border-top: 1px solid #e8e8e8;
}

.message-wrapper {
  margin-bottom: 16px;
}

.message-content {
  display: flex;
  align-items: flex-start;
}

.user-message .message-content {
  flex-direction: row-reverse;
}

.message-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  margin: 0 8px;
  word-break: break-word;
  min-height: 16px;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
}

.user-message .message-bubble {
  background-color: #3370ff;
  color: white;
}

.ai-message .message-bubble {
  background-color: #f0f0f0;
}

/* 为加载中的消息气泡添加特殊样式 */
.ai-message .message-bubble:has(.arco-spin) {
  padding: 4px 8px; /* 减小内边距 */
  min-height: 24px; /* 为加载动画设置更小的最小高度 */
}

.recommended-list {
  height: calc(100% - 40px);
  overflow-y: auto;
}

.question-item {
  cursor: pointer;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}

.question-item:hover {
  background-color: #f5f5f5;
}

.question-title {
  font-weight: bold;
  margin-bottom: 8px;
}

.question-tags {
  margin-bottom: 8px;
}

.question-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

:deep(.arco-card-body) {
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

/* 添加 markdown 查看器的自定义样式 */
:deep(.md-viewer) {
  background: transparent;
  padding: 0;
  margin: 0;
  color: inherit;
}

/* 用户消息中的 markdown 样式 */
.user-message .message-bubble :deep(.md-viewer) {
  color: white;
}

/* AI 消息中的 markdown 样式 */
.ai-message .message-bubble :deep(.md-viewer) {
  color: var(--color-text-1);
}

/* 调整 markdown 内容的代码块样式 */
:deep(.md-viewer pre) {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  margin: 8px 0;
}

.user-message .message-bubble :deep(.md-viewer pre) {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>

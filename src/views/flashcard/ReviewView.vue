<template>
  <div id="flashcardReview">
    <a-row :gutter="24" class="full-height">
      <!-- 左侧抽认卡区域 -->
      <a-col :span="16" class="full-height">
        <a-card class="review-card">
          <template #title>
            <div class="card-header">
              <span class="title">抽认卡复习</span>
              <a-space>
                <a-tag>剩余: {{ remainingCards }}/{{ totalCards }}</a-tag>
                <a-progress
                  :percent="progressPercent"
                  size="small"
                  :style="{ width: '200px' }"
                />
              </a-space>
            </div>
          </template>

          <div class="card-container">
            <div class="card-content" @click="flipCard">
              <a-spin :loading="loading">
                <div class="flashcard" :class="{ 'is-flipped': isFlipped }">
                  <div class="flashcard-inner">
                    <!-- 正面 -->
                    <div class="flashcard-front">
                      <div class="card-type">
                        <icon-question-circle />
                        问题
                      </div>
                      <div class="card-text-container">
                        <div class="card-text">{{ currentCard.question }}</div>
                      </div>
                      <div class="card-hint">
                        <icon-arrow-right />
                        点击查看答案
                      </div>
                    </div>
                    <!-- 背面 -->
                    <div class="flashcard-back">
                      <div class="card-type">
                        <icon-check-circle />
                        答案
                      </div>
                      <div class="card-text-container">
                        <div class="card-text">{{ currentCard.answer }}</div>
                      </div>

                      <!-- 熟悉度评价 -->
                      <div class="familiarity-rating" v-if="isFlipped">
                        <div class="rating-title">
                          对这个知识点的掌握程度如何？
                        </div>
                        <a-space size="large">
                          <a-button
                            @click.stop="rateFamiliarity(1)"
                            type="outline"
                            status="danger"
                            >完全不懂
                          </a-button>
                          <a-button
                            @click.stop="rateFamiliarity(2)"
                            type="outline"
                            status="warning"
                            >有点模糊
                          </a-button>
                          <a-button
                            @click.stop="rateFamiliarity(3)"
                            type="outline"
                            status="success"
                            >基本掌握
                          </a-button>
                          <a-button
                            @click.stop="rateFamiliarity(4)"
                            type="primary"
                            >完全掌握
                          </a-button>
                        </a-space>
                      </div>
                    </div>
                  </div>
                </div>
              </a-spin>
            </div>

            <div class="card-actions">
              <a-space>
                <a-button
                  type="secondary"
                  @click="previousCard"
                  :disabled="currentIndex === 0"
                >
                  <template #icon><icon-left /></template>
                  上一个
                </a-button>
                <a-button
                  type="primary"
                  @click="nextCard"
                  :disabled="currentIndex === cards.length - 1"
                >
                  下一个
                  <template #icon><icon-right /></template>
                </a-button>
              </a-space>
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- 右侧AI助手区域 -->
      <a-col :span="8">
        <a-card class="ai-chat-card">
          <template #title>
            <div class="card-header">
              <span class="title">AI助手</span>
              <a-button type="text" @click="clearChat">
                <template #icon>
                  <icon-delete />
                </template>
                清除对话
              </a-button>
            </div>
          </template>

          <div class="chat-container" ref="chatContainerRef">
            <div
              v-for="(msg, index) in chatHistory"
              :key="index"
              :class="['message', msg.isUser ? 'user-message' : 'ai-message']"
            >
              <a-avatar
                :style="{
                  backgroundColor: msg.isUser
                    ? 'var(--color-primary-light-4)'
                    : 'var(--color-success-light-4)',
                }"
              >
                {{ msg.isUser ? "我" : "AI" }}
              </a-avatar>
              <div class="message-content">
                <template v-if="msg.isLoading">
                  <a-spin dot />
                </template>
                <template v-else>
                  <MdViewer v-if="!msg.isUser" :value="msg.content" />
                  <span v-else>{{ msg.content }}</span>
                </template>
              </div>
            </div>
          </div>

          <div class="chat-input">
            <a-input-search
              v-model="userInput"
              placeholder="询问AI助手..."
              search-button
              @press-enter="sendMessage"
              @search="sendMessage"
            >
              <template #button-icon>
                <icon-send />
              </template>
            </a-input-search>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { Message } from "@arco-design/web-vue";
import {
  IconLeft,
  IconRight,
  IconDelete,
  IconSend,
  IconQuestionCircle,
  IconCheckCircle,
  IconArrowRight,
} from "@arco-design/web-vue/es/icon";
import MdViewer from "@/components/MdViewer.vue";

// 模拟数据
const cards = ref([
  {
    id: 1,
    question: "什么是Vue的响应式原理？",
    answer:
      "Vue的响应式原理基于ES6的Proxy（Vue3）或Object.defineProperty（Vue2），通过劫持数据的访问和修改操作，在数据变化时自动更新视图。",
    familiarity: 0,
  },
  // ... 更多卡片
]);

const loading = ref(false);
const currentIndex = ref(0);
const isFlipped = ref(false);
const userInput = ref("");
const chatHistory = ref([]);
const chatContainerRef = ref(null);

// 计算属性
const currentCard = computed(() => cards.value[currentIndex.value]);
const totalCards = computed(() => cards.value.length);
const remainingCards = computed(() => cards.value.length - currentIndex.value);
const progressPercent = computed(
  () => (currentIndex.value / totalCards.value) * 100
);

// 卡片翻转
const flipCard = () => {
  isFlipped.value = !isFlipped.value;
};

// 评价熟悉度
const rateFamiliarity = async (level: number) => {
  cards.value[currentIndex.value].familiarity = level;
  await nextTick();
  nextCard();
};

// 下一张卡片
const nextCard = () => {
  if (currentIndex.value < cards.value.length - 1) {
    currentIndex.value++;
    isFlipped.value = false;
  }
};

// 上一张卡片
const previousCard = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    isFlipped.value = false;
  }
};

// 发送消息给AI
const sendMessage = async () => {
  if (!userInput.value.trim()) return;

  const message = userInput.value;
  chatHistory.value.push({
    content: message,
    isUser: true,
    isLoading: false,
  });

  // 添加AI响应（加载状态）
  chatHistory.value.push({
    content: "",
    isUser: false,
    isLoading: true,
  });

  userInput.value = "";

  // 滚动到底部
  await nextTick();
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
  }

  try {
    // TODO: 调用AI接口
    const aiResponse = "这是AI的回复...";

    // 更新最后一条消息
    chatHistory.value[chatHistory.value.length - 1] = {
      content: aiResponse,
      isUser: false,
      isLoading: false,
    };
  } catch (error) {
    Message.error("AI响应失败，请重试");
    chatHistory.value.pop(); // 移除加载中的消息
  }
};

// 清除聊天记录
const clearChat = () => {
  chatHistory.value = [];
};

onMounted(() => {
  // 初始化加载
});
</script>

<style scoped>
#flashcardReview {
  padding: 24px;
  min-height: 100vh;
  background: var(--color-fill-2);
}

.full-height {
  height: 100%;
}

.review-card,
.ai-chat-card {
  height: calc(100vh - 72px);
  display: flex;
  flex-direction: column;
  background: var(--color-bg-2);
  border-radius: var(--border-radius-medium);
  overflow: hidden;
}

.card-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: var(--padding-medium);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  position: relative;
}

.flashcard {
  width: 100%;
  height: 500px;
  max-width: 800px;
  margin: 0 auto;
  perspective: 1000px;
  cursor: pointer;
}

.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flashcard.is-flipped .flashcard-inner {
  transform: rotateY(180deg);
}

.flashcard-front,
.flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: var(--padding-large);
  border-radius: var(--border-radius-large);
  background: var(--color-bg-3);
  box-shadow: var(--shadow2-center);
}

.flashcard-back {
  transform: rotateY(180deg);
}

.card-type {
  font-size: var(--font-size-body-3);
  color: var(--color-text-2);
  margin-bottom: var(--margin-medium);
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-type :deep(.arco-icon) {
  font-size: 20px;
  color: var(--color-primary-6);
}

.card-text-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--padding-medium);
  background: var(--color-fill-2);
  border-radius: var(--border-radius-medium);
  margin: var(--margin-medium) 0;
}

.card-text {
  font-size: var(--font-size-title-1);
  line-height: 1.8;
  color: var(--color-text-1);
  text-align: center;
  overflow-y: auto;
  padding: var(--padding-medium);
}

.card-hint {
  font-size: 14px;
  color: var(--color-text-3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
}

.familiarity-rating {
  margin-top: auto;
  width: 100%;
  text-align: center;
  background: var(--color-fill-2);
  padding: var(--padding-medium);
  border-radius: var(--border-radius-medium);
  box-shadow: var(--shadow1-center);
}

.rating-title {
  font-size: 16px;
  margin-bottom: 20px;
  color: var(--color-text-1);
}

.familiarity-rating .arco-space {
  flex-wrap: wrap;
  justify-content: center;
}

.familiarity-rating .arco-btn {
  min-width: 120px;
  margin: 8px;
  transition: all 0.3s ease;
}

.flashcard:hover {
  transform: translateY(-2px);
  transition: transform 0.3s ease;
}

.card-text-container {
  max-height: 250px;
  overflow: hidden;
}

.card-text {
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-primary-light-4) transparent;
}

.card-text::-webkit-scrollbar {
  width: 6px;
}

.card-text::-webkit-scrollbar-thumb {
  background-color: var(--color-primary-light-4);
  border-radius: 3px;
}

.card-text::-webkit-scrollbar-track {
  background: transparent;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: var(--color-fill-2);
  border-radius: 4px;
  margin-bottom: 16px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message-content {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  background: var(--color-bg-2);
}

.user-message .message-content {
  background: var(--color-primary-light-1);
  color: white;
}

.chat-input {
  padding: 16px 0;
}

@media screen and (max-width: 768px) {
  .flashcard {
    height: 400px;
  }

  .card-text {
    font-size: var(--font-size-body-3);
  }

  .familiarity-rating .arco-btn {
    padding: 4px 8px;
    min-width: 80px;
  }
}
</style>

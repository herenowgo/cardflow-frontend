<template>
  <div class="flashcard-review">
    <div class="review-container">
      <!-- 顶部信息栏 -->
      <div class="review-header">
        <div class="progress">
          <div class="progress-stats">
            <a-space>
              <span class="stat-item">待复习: {{ remainingCards }}</span>
              <span class="stat-item">正确率: {{ correctRate }}%</span>
            </a-space>
          </div>
          <a-progress
            :percent="progressPercent"
            :stroke-width="8"
            :show-text="false"
            class="progress-bar"
          />
        </div>
      </div>

      <!-- 卡片区域 -->
      <div class="review-content" :class="{ 'no-cards': !currentCard }">
        <div class="card-area">
          <template v-if="currentCard">
            <div
              class="flashcard"
              :class="{ 'is-flipped': isFlipped }"
              @click="toggleCard"
            >
              <div class="flashcard-inner">
                <!-- 正面 -->
                <div class="flashcard-front">
                  <div class="card-content">
                    <div class="content-type">问题</div>
                    <div class="content-text">
                      <md-viewer :value="currentCard.question" />
                    </div>
                    <div class="card-tags" v-if="currentCard.tags?.length">
                      <a-space>
                        <a-tag
                          v-for="tag in currentCard.tags"
                          :key="tag"
                          size="small"
                          color="arcoblue"
                        >
                          {{ tag }}
                        </a-tag>
                      </a-space>
                    </div>
                  </div>
                  <div class="card-hint">
                    <icon-arrow-right />
                    <span>点击卡片翻转</span>
                  </div>
                </div>

                <!-- 背面 -->
                <div class="flashcard-back">
                  <div class="card-content">
                    <div class="content-type">答案</div>
                    <div class="content-text">
                      <md-viewer :value="currentCard.answer" />
                    </div>
                    <div class="card-tags" v-if="currentCard.tags?.length">
                      <a-space>
                        <a-tag
                          v-for="tag in currentCard.tags"
                          :key="tag"
                          size="small"
                          color="arcoblue"
                        >
                          {{ tag }}
                        </a-tag>
                      </a-space>
                    </div>
                  </div>
                  <div class="card-hint">
                    <icon-arrow-left />
                    <span>点击卡片翻转</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 评分区域 -->
        <div class="rating-area" :class="{ show: showRatingButtons }">
          <div class="rating-title">对这个知识点的掌握程度如何？</div>
          <div class="rating-buttons">
            <a-button
              class="rating-btn"
              @click="rateCard(1)"
              status="danger"
              shape="round"
              size="large"
            >
              <template #icon>
                <icon-close />
              </template>
              完全不会 (<span class="shortcut">1</span>)
            </a-button>
            <a-button
              class="rating-btn"
              @click="rateCard(2)"
              status="warning"
              shape="round"
              size="large"
            >
              <template #icon>
                <icon-minus />
              </template>
              有点困难 (<span class="shortcut">2</span>)
            </a-button>
            <a-button
              class="rating-btn"
              @click="rateCard(3)"
              status="success"
              shape="round"
              size="large"
            >
              <template #icon>
                <icon-check />
              </template>
              记得住 (<span class="shortcut">3</span>)
            </a-button>
            <a-button
              class="rating-btn"
              @click="rateCard(4)"
              type="primary"
              shape="round"
              size="large"
            >
              <template #icon>
                <icon-star />
              </template>
              很简单 (<span class="shortcut">4</span>)
            </a-button>
          </div>
        </div>
      </div>

      <!-- 底部工具栏 -->
      <div class="review-footer">
        <a-space>
          <a-button>
            <template #icon>
              <icon-keyboard />
            </template>
            快捷键
          </a-button>
          <a-button>
            <template #icon>
              <icon-bar-chart />
            </template>
            统计
          </a-button>
          <a-button type="primary" :loading="syncLoading">
            <template #icon>
              <icon-sync />
            </template>
            同步到Anki
          </a-button>
          <t-button theme="primary" @click="showAIChat">AI助手可拖拽</t-button>
          <AIChat ref="aiChatRef" />
        </a-space>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MdViewer from "@/components/MdViewer.vue";
import { AnkiService } from "@/services/AnkiService";
import { eventStreamService } from "@/services/EventStreamService";
import { Message } from "@arco-design/web-vue";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBarChart,
  IconCheck,
  IconClose,
  IconMinus,
  IconStar,
  IconSync,
} from "@arco-design/web-vue/es/icon";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { AIChatRequest } from "../../../generated/models/AIChatRequest";
import { CardControllerService } from "../../../generated/services/CardControllerService";
import { ChatControllerService } from "../../../generated/services/ChatControllerService";
import AIChat from "@/components/AIChat.vue";

const aiChatRef = ref<InstanceType<typeof AIChat>>();
const showAIChat = () => {
  aiChatRef.value?.show();
};

// 定义类型
interface MockResponse {
  controller: {
    close: () => void;
  };
}

interface Card {
  id: number;
  question: string;
  answer: string;
  familiarity?: number;
  lastReviewTime?: Date;
  tags?: string[];
}

// 修改变量定义
const fetchCancel = ref<MockResponse | null>(null);

const loading = ref(false);
const isStreamLoad = ref(false);

// 添加 UUID 生成函数
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 修改聊天相关的状态变量
const currentSessionId = ref<string>(""); // 当前会话ID
const currentRequestId = ref<string>(""); // 当前请求ID

// 倒序渲染
const chatList = ref([
  {
    avatar: "https://tdesign.gtimg.com/site/chat-avatar.png",
    name: "AI助手",
    datetime: new Date().toLocaleString(),
    content: "你好！我是AI助手，有什么我可以帮你的吗？",
    role: "assistant",
  },
]);

const operation = function (type: string, options: any) {
  console.log(type, options);
};

const clearConfirm = function () {
  chatList.value = [];
  currentSessionId.value = generateUUID(); // 生成新的会话ID
};

const onStop = function () {
  if (isStreamLoad.value && currentRequestId.value) {
    eventStreamService.cancelRequest(currentRequestId.value);
    loading.value = false;
    isStreamLoad.value = false;
  }
};

const inputEnter = async function (inputValue: string) {
  if (isStreamLoad.value) {
    return;
  }
  if (!inputValue) return;

  // 如果没有会话ID，生成一个新的
  if (!currentSessionId.value) {
    currentSessionId.value = generateUUID();
  }

  // 添加用户消息
  const userMessage = {
    avatar: "https://tdesign.gtimg.com/site/avatar.jpg",
    name: "自己",
    datetime: new Date().toLocaleString(),
    content: inputValue,
    role: "user",
  };
  chatList.value.unshift(userMessage);

  // 添加AI消息占位
  const aiMessage = {
    avatar: "https://tdesign.gtimg.com/site/chat-avatar.png",
    name: "AI助手",
    datetime: new Date().toLocaleString(),
    content: "",
    role: "assistant",
  };
  chatList.value.unshift(aiMessage);

  try {
    loading.value = true;
    isStreamLoad.value = true;
    const lastItem = chatList.value[0];

    // 发送聊天请求，使用当前会话ID
    loading.value = true;
    const res = await ChatControllerService.chat({
      model: AIChatRequest.model.BASIC,
      content: inputValue,
      sessionId: currentSessionId.value,
    });

    if (res.code == 200 && res.data) {
      currentRequestId.value = res.data;

      // 使用 waitForStreamingResult 来获取流式响应
      let accumulatedContent = ""; // 累积的内容

      await eventStreamService.waitForStreamingResult(
        currentRequestId.value,
        (newContent: string) => {
          loading.value = false;
          // 找出新增的内容
          const addedContent = newContent.slice(accumulatedContent.length);
          accumulatedContent = newContent;

          // 更新显示内容
          if (lastItem && lastItem.role === "assistant") {
            lastItem.content = newContent;
          }
        }
      );
    }
  } catch (error) {
    if (chatList.value[0] && chatList.value[0].role === "assistant") {
      chatList.value[0].content = "抱歉，发生了错误，请稍后重试";
    }
  } finally {
    loading.value = false;
    isStreamLoad.value = false;
  }
};

interface Deck {
  id: number;
  name: string;
  description?: string;
  cardCount: number;
}

// 状态
const currentDeck = ref<Deck>({
  id: 1,
  name: "Vue基础知识",
  description: "Vue3核心概念和基础API",
  cardCount: 50,
});

const cards = ref<Card[]>([
  {
    id: 1,
    question: "# Vue的响应式原理是什么？",
    answer: `Vue3的响应式原理基于Proxy实现：

## 主要特点
1. 性能更好
2. 支持更多数据类型
3. 可以监听动态添加的属性

## 实现原理
\`\`\`js
const proxy = new Proxy(target, {
  get(target, key) {
    track(target, key)
    return target[key]
  },
  set(target, key, value) {
    target[key] = value
    trigger(target, key)
    return true
  }
})
\`\`\``,
    familiarity: 0,
  },
  {
    id: 2,
    question: "# Vue组件的生命周期有哪些？",
    answer: `Vue3组件的主要生命周期钩子：

- \`setup()\`
- \`onBeforeMount()\`
- \`onMounted()\`
- \`onBeforeUpdate()\`
- \`onUpdated()\`
- \`onBeforeUnmount()\`
- \`onUnmounted()\`

> 注意：setup() 是组合式 API 的入口点`,
    familiarity: 0,
  },
  {
    id: 3,
    question: "什么是Vue的计算属性？",
    answer:
      "计算属性是基于响应式依赖进行缓存的特殊属性：\n\n1. 只有依赖发生改变时才会重新计算\n2. 有缓存机制，多次访问只计算一次\n3. 适合处理复杂的数据计算",
    familiarity: 0,
  },
  {
    id: 4,
    question: "Vue3的组合式API有什么优势？",
    answer:
      "组合式API (Composition API) 的主要优势：\n\n1. 更好的代码组织\n2. 更好的逻辑复用\n3. 更好的类型推导\n4. 更小的打包体积",
    familiarity: 0,
  },
]);

const currentIndex = ref(0);
const isFlipped = ref(false);
const completedCards = ref(0);
const correctAnswers = ref(0);
const syncLoading = ref(false);

// 添加一个新的状态来跟踪当前显示的卡片内容
const displayCard = ref<Card | null>(null);

// 修改计算属性
const currentCard = computed(
  () => displayCard.value || cards.value[currentIndex.value]
);
const totalCards = computed(() => cards.value.length);
const remainingCards = computed(() => totalCards.value - currentIndex.value);
const progressPercent = computed(() => currentIndex.value / totalCards.value);
const correctRate = computed(() =>
  completedCards.value
    ? Math.round((correctAnswers.value / completedCards.value) * 100)
    : 0
);

// 控制评分按钮显示的计算属性
const showRatingButtons = computed(
  () => isFlipped.value && !ratingSubmitted.value
);

// 新增状态，用于跟踪是否已提交评分
const ratingSubmitted = ref(false);

// 切换卡片正反面
const toggleCard = () => {
  // 如果已经提交评分，不允许再次翻转
  if (ratingSubmitted.value) return;
  isFlipped.value = !isFlipped.value;
};

const rateCard = async (rating: number) => {
  if (!currentCard.value) return;

  // 立即更新统计状态
  if (rating >= 3) correctAnswers.value++;
  completedCards.value++;
  ratingSubmitted.value = true;

  // 保存当前卡片用于显示
  displayCard.value = currentCard.value;

  // 先翻转卡片到正面
  isFlipped.value = false;

  // 等待翻转动画完成后再更新索引和显示的卡片
  setTimeout(() => {
    currentIndex.value++;
    // 清除显示的卡片，使用新的当前卡片
    displayCard.value = null;
    ratingSubmitted.value = false;
  }, 300); // 300ms 是翻转动画的持续时间

  // 异步保存评分，不阻塞UI
  saveRating(currentCard.value.id, rating)
    .then(() => {
      Message.success("评分已保存");
    })
    .catch(() => {
      Message.error("保存失败，请重试");
    });
};

const restartReview = async () => {
  displayCard.value = null;
  currentIndex.value = 0;
  completedCards.value = 0;
  correctAnswers.value = 0;
  await loadDeckData();
};

// 键盘快捷键处理
const handleKeyPress = (e: KeyboardEvent) => {
  if (!currentCard.value) return;

  if (e.key === " ") {
    // 空格键用于翻转卡片
    if (!ratingSubmitted.value) {
      toggleCard();
      e.preventDefault();
    }
  } else if (isFlipped.value && ["1", "2", "3", "4"].includes(e.key)) {
    // 数字键用于评分
    if (!ratingSubmitted.value) {
      rateCard(parseInt(e.key));
      e.preventDefault();
    }
  }
};

// 修改加载数据方法
const loadDeckData = async () => {
  try {
    // 从Anki获取所有到期的卡片
    const deckNames = await AnkiService.getDeckNames();
    const firstLevelDeckNames = deckNames.filter(
      (name) => !name.includes("::")
    );
    const dueCardIds = await AnkiService.getDueCardsInDecks(
      firstLevelDeckNames
    );

    // 从数据库获取卡片详细信息
    const res = await CardControllerService.getCardsByAnkiCardIds({
      cardIds: dueCardIds,
    });

    if (res.code === 200 && res.data) {
      cards.value = res.data.map((card: any) => ({
        id: Number(card.id),
        question: card.question || "",
        answer: card.answer || "",
        familiarity: card.familiarity || 0,
        lastReviewTime: card.lastReviewTime
          ? new Date(card.lastReviewTime)
          : undefined,
        tags: card.tags || [],
      }));
    } else {
      Message.error("加载卡片失败");
    }
  } catch (error) {
    console.error("加载卡片失败:", error);
    Message.error("加载失败，请重试");
  }
};

// 模拟保存评分
const saveRating = async (cardId: number, rating: number) => {
  // TODO: 替换为实际的API调用
  // await CardControllerService.updateCardRating(cardId, rating);

  // 模拟保存延迟
  await new Promise((resolve) => setTimeout(resolve, 300));
};

onMounted(async () => {
  document.addEventListener("keydown", handleKeyPress);
  await loadDeckData();
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyPress);
});
</script>

<style scoped>
.flashcard-review {
  min-height: 100vh;
  background: var(--color-fill-2);
  padding: 16px;
  height: 100vh;
  overflow: hidden;
}

.review-container {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-header {
  background: var(--color-bg-2);
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--color-text-2);
}

.stat-item {
  color: var(--color-text-2);
}

.progress-bar {
  flex: 1;
  height: 6px;
}

.review-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  min-height: 0;
}

.card-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
  min-height: 0;
}

.flashcard {
  width: 100%;
  max-width: 800px;
  height: 100%;
  perspective: 2000px;
  cursor: pointer;
  position: relative;
  transform: translate3d(0, 0, 0);
  transform-style: preserve-3d;
  transition: transform 0.2s cubic-bezier(0.2, 0, 0.2, 1);
}

.flashcard-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform: translate3d(0, 0, 0);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  will-change: transform;
}

.flashcard.is-flipped .flashcard-inner {
  transform: rotateY(180deg);
}

.flashcard-front,
.flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  background: var(--color-bg-2);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 24px;
  display: flex;
  flex-direction: column;
  transform-style: preserve-3d;
  will-change: transform;
}

.flashcard-front {
  transform: translate3d(0, 0, 0) rotateY(0deg);
}

.flashcard-back {
  transform: translate3d(0, 0, 0) rotateY(180deg);
}

.flashcard:hover {
  transform: translate3d(0, -2px, 0);
}

.flashcard:active {
  transform: translate3d(0, 0, 0);
  transition: transform 0.1s;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  position: relative;
  overflow: hidden;
}

.content-type {
  font-size: 14px;
  color: var(--color-text-3);
  margin-bottom: 8px;
  position: sticky;
  top: 0;
  background: var(--color-bg-2);
  padding: 4px 0;
  z-index: 1;
}

.content-text {
  font-size: 18px;
  line-height: 1.6;
  color: var(--color-text-1);
  overflow-y: auto;
  padding: 0 4px;
  max-height: 100%;
  flex: 1;
  /* 隐藏滚动条 - Firefox */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* 隐藏滚动条 - Webkit */
.content-text::-webkit-scrollbar {
  display: none;
}

.card-hint {
  text-align: center;
  color: var(--color-text-3);
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0.8;
  transition: opacity 0.3s;
}

.flashcard:hover .card-hint {
  opacity: 1;
}

.rating-area {
  background: var(--color-bg-2);
  padding: 12px;
  border-radius: 16px;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(100%);
  opacity: 0;
  transition: all 0.3s ease;
}

.rating-area.show {
  transform: translateY(0);
  opacity: 1;
}

.rating-title {
  font-size: 16px;
  color: var(--color-text-2);
  text-align: center;
  margin-bottom: 12px;
}

.rating-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
}

.rating-btn {
  font-size: 14px;
  transition: all 0.3s;
  padding: 8px 16px;
  border-radius: 24px;
}

.rating-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.shortcut {
  opacity: 0.7;
  font-size: 12px;
}

.review-footer {
  padding: 8px;
  background: var(--color-bg-2);
  border-radius: 8px;
  text-align: center;
}

@media screen and (max-width: 768px) {
  .flashcard-review {
    padding: 8px;
  }

  .review-header {
    padding: 6px 8px;
  }

  .progress-stats {
    font-size: 13px;
  }

  .flashcard {
    height: calc(100vh - 180px);
  }
}

@media screen and (max-height: 600px) {
  .flashcard {
    height: calc(100vh - 140px);
  }

  .review-header {
    padding: 6px 12px;
  }
}

/* 自定义 Markdown 样式 */
:deep(.markdown-body) {
  background: transparent;
  font-size: inherit;
  line-height: inherit;
  padding: 8px;
  height: 100%;
  overflow-y: auto;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep(.markdown-body)::-webkit-scrollbar {
  display: none;
}

:deep(.markdown-body pre) {
  background: var(--color-bg-1);
  border-radius: 8px;
  margin: 8px 0;
  overflow-y: auto;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
  /* 确保代码可以换行显示 */
  white-space: pre-wrap;
  word-wrap: break-word;
}

:deep(.markdown-body pre)::-webkit-scrollbar {
  display: none;
}

:deep(.markdown-body code) {
  background: var(--color-bg-1);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 14px;
  word-break: break-word;
}

/* 优化代码块内容的显示 */
:deep(.markdown-body pre code) {
  padding: 0;
  font-size: 14px;
  line-height: 1.6;
  background: transparent;
}

:deep(.markdown-body h1) {
  border-bottom: none;
  padding-bottom: 0;
  margin-top: 0;
  font-size: 24px;
}

:deep(.markdown-body h2) {
  border-bottom: 1px solid var(--color-border);
  margin-top: 12px;
  font-size: 20px;
  padding-bottom: 8px;
}

:deep(.markdown-body blockquote) {
  border-left-color: var(--color-primary);
  background: var(--color-bg-1);
  border-radius: 4px;
  padding: 8px 12px;
  margin: 8px 0;
}

:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  padding-left: 20px;
  margin: 8px 0;
}

:deep(.markdown-body li) {
  margin: 4px 0;
}

.card-tags {
  margin-top: 8px;
  padding: 4px 0;
  border-top: 1px solid var(--color-border);
}

.chat-ai {
  height: 600px;
}
</style>

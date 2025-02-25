<template>
  <div class="flashcard-review fullscreen">
    <div class="review-container">
      <!-- 卡片区域 -->
      <div class="review-content" :class="{ 'no-cards': !currentCard }">
        <div class="card-container" :class="{ 'shift-left': isAIChatVisible }">
          <div class="card-area">
            <template v-if="currentCard">
              <div
                class="flashcard"
                :class="{
                  'is-flipped': isFlipped,
                  'is-editing': isEditing,
                }"
                @click="handleCardClick"
              >
                <div class="flashcard-inner">
                  <!-- 正面 -->
                  <div class="flashcard-front">
                    <div class="card-content">
                      <div class="content-type">问题</div>
                      <div class="content-text">
                        <template v-if="!isEditing">
                          <md-viewer :value="currentCard.question" />
                        </template>
                        <template v-else>
                          <md-editor
                            :value="editForm.question"
                            :handleChange="(v) => (editForm.question = v)"
                          />
                        </template>
                      </div>
                      <div class="card-tags" v-if="currentCard.tags?.length">
                        <template v-if="!isEditing">
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
                        </template>
                        <template v-else>
                          <a-input-tag v-model="editForm.tags" allow-clear />
                        </template>
                      </div>
                      <!-- 编辑按钮 -->
                      <div class="card-actions">
                        <a-button-group>
                          <template v-if="!isEditing">
                            <a-button
                              type="text"
                              size="small"
                              @click.stop="showEditModal"
                            >
                              <template #icon><icon-edit /></template>
                              编辑
                            </a-button>
                            <a-button
                              type="text"
                              size="small"
                              @click.stop="generateTags"
                              :loading="isGeneratingTags"
                            >
                              <template #icon><icon-tag /></template>
                              自动标签
                            </a-button>
                            <a-button
                              type="text"
                              status="danger"
                              size="small"
                              @click.stop="showDeleteConfirm"
                            >
                              <template #icon><icon-delete /></template>
                              删除
                            </a-button>
                          </template>
                          <template v-else>
                            <a-button
                              type="primary"
                              size="small"
                              @click.stop="handleEditSave"
                            >
                              <template #icon><icon-check /></template>
                              完成
                            </a-button>
                            <a-button
                              type="outline"
                              size="small"
                              @click.stop="cancelEdit"
                            >
                              <template #icon><icon-close /></template>
                              取消
                            </a-button>
                          </template>
                        </a-button-group>
                      </div>
                    </div>
                    <div class="card-hint">
                      <icon-arrow-right />
                      <span>点击或空格使卡片翻转</span>
                      <span class="hint-divider">|</span>
                      <icon-robot />
                      <span>按 <span class="shortcut">F</span> 召唤AI助手</span>
                    </div>
                  </div>

                  <!-- 背面 -->
                  <div class="flashcard-back">
                    <div class="card-content">
                      <div class="content-type">答案</div>
                      <div class="content-text">
                        <template v-if="!isEditing">
                          <md-viewer :value="currentCard.answer" />
                        </template>
                        <template v-else>
                          <md-editor
                            :value="editForm.answer"
                            :handleChange="(v) => (editForm.answer = v)"
                          />
                        </template>
                      </div>
                      <div class="card-tags" v-if="currentCard.tags?.length">
                        <template v-if="!isEditing">
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
                        </template>
                        <template v-else>
                          <a-input-tag v-model="editForm.tags" allow-clear />
                        </template>
                      </div>
                      <!-- 编辑按钮 -->
                      <div class="card-actions">
                        <a-button-group>
                          <template v-if="!isEditing">
                            <a-button
                              type="text"
                              size="small"
                              @click.stop="showEditModal"
                            >
                              <template #icon><icon-edit /></template>
                              编辑
                            </a-button>
                            <a-button
                              type="text"
                              size="small"
                              @click.stop="generateTags"
                              :loading="isGeneratingTags"
                            >
                              <template #icon><icon-tag /></template>
                              自动标签
                            </a-button>
                            <a-button
                              type="text"
                              status="danger"
                              size="small"
                              @click.stop="showDeleteConfirm"
                            >
                              <template #icon><icon-delete /></template>
                              删除
                            </a-button>
                          </template>
                          <template v-else>
                            <a-button
                              type="primary"
                              size="small"
                              @click.stop="handleEditSave"
                            >
                              <template #icon><icon-check /></template>
                              完成
                            </a-button>
                            <a-button
                              type="outline"
                              size="small"
                              @click.stop="cancelEdit"
                            >
                              <template #icon><icon-close /></template>
                              取消
                            </a-button>
                          </template>
                        </a-button-group>
                      </div>
                    </div>
                    <div class="card-hint">
                      <icon-arrow-left />
                      <span>点击或空格使卡片翻转</span>
                      <span class="hint-divider">|</span>
                      <icon-robot />
                      <span>按 <span class="shortcut">F</span> 召唤AI助手</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- AI助手按钮 -->
          <div class="ai-helper-button" @click="showAIChat">
            <t-button shape="circle" theme="primary" size="large">
              <template #icon><icon-robot /></template>
            </t-button>
          </div>
        </div>

        <!-- AI助手窗口 -->
        <div
          class="ai-helper-panel"
          :class="{ show: isAIChatVisible }"
          @mouseenter="isMouseInAIChat = true"
          @mouseleave="isMouseInAIChat = false"
        >
          <AIChat
            ref="aiChatRef"
            :embedded="true"
            @close="handleAIChatClose"
            @update-current-card="handleCardUpdate"
            @cards-drawer-change="handleCardsDrawerChange"
            @get-current-review-card="getCurrentReviewCard"
          />
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
              重来 (<span class="shortcut">1</span>)
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
              困难 (<span class="shortcut">2</span>)
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
              良好 (<span class="shortcut">3</span>)
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
              简单 (<span class="shortcut">4</span>)
            </a-button>
          </div>
        </div>
      </div>

      <!-- 底部工具栏 -->
      <div class="review-footer">
        <!-- 进度区域 -->
        <div class="review-progress">
          <div class="progress-stats">
            <div class="progress-stat-item">
              <span class="stat-label">已完成</span>
              <span class="stat-value"
                >{{ completedCards }} / {{ totalCards }}</span
              >
            </div>
            <div class="progress-stat-item">
              <span class="stat-label">正确率</span>
              <span class="stat-value">{{ correctRate }}%</span>
            </div>
          </div>
          <a-progress
            :percent="progressPercent"
            :show-text="false"
            :stroke-width="8"
            :animation="true"
          />
        </div>

        <a-space>
          <!-- <a-button>
            <template #icon>
              <icon-keyboard />
            </template>
            快捷键
          </a-button> -->
          <!-- <a-button>
            <template #icon>
              <icon-bar-chart />
            </template>
            统计
          </a-button><a-button>
            <template #icon>
              <icon-bar-chart />
            </template>
            统计
          </a-button> -->
          <a-button type="primary" :loading="syncLoading" @click="syncWithAnki">
            <template #icon>
              <icon-sync />
            </template>
            同步Anki的复习记录
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <a-modal
      v-model:visible="isEditModalVisible"
      title="编辑卡片"
      @ok="handleEditSave"
      :mask-closable="false"
      :closable="true"
      :ok-text="'保存'"
      :cancel-text="'取消'"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="问题">
          <a-textarea
            v-model="editForm.question"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="答案">
          <a-textarea
            v-model="editForm.answer"
            :auto-size="{ minRows: 4, maxRows: 8 }"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="标签">
          <a-input-tag v-model="editForm.tags" allow-clear />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 标签选择对话框 -->
    <a-modal
      v-model:visible="isTagsModalVisible"
      title="选择标签"
      @ok="handleTagsSave"
      @cancel="handleTagsCancel"
      :mask-closable="false"
      :closable="true"
      :ok-text="'保存'"
      :cancel-text="'取消'"
    >
      <div class="tags-selection">
        <div class="tags-section">
          <div class="section-title">现有标签</div>
          <a-space wrap>
            <a-checkbox-group v-model="selectedExistingTags">
              <template v-for="tag in existingTags" :key="tag">
                <a-checkbox :value="tag">{{ tag }}</a-checkbox>
              </template>
            </a-checkbox-group>
          </a-space>
        </div>
        <div class="tags-section">
          <div class="section-title">新生成的标签</div>
          <a-space wrap>
            <a-checkbox-group v-model="selectedNewTags">
              <template v-for="tag in newGeneratedTags" :key="tag">
                <a-checkbox :value="tag">{{ tag }}</a-checkbox>
              </template>
            </a-checkbox-group>
          </a-space>
        </div>
      </div>
    </a-modal>

    <!-- 添加删除确认对话框 -->
    <a-modal
      v-model:visible="deleteModalVisible"
      @ok="handleDelete"
      @cancel="cancelDelete"
      simple
    >
      <template #title>确认删除</template>
      <div>确定要删除这张卡片吗？此操作不可恢复。</div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import MdEditor from "@/components/MdEditor.vue";
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
  IconRobot,
  IconEdit,
  IconTag,
  IconDelete,
} from "@arco-design/web-vue/es/icon";
import { computed, onMounted, onUnmounted, ref, nextTick } from "vue";
import { AIChatRequest } from "../../../generated/models/AIChatRequest";
// import { CardControllerService } from "../../../generated/services/CardControllerService";

import { ChatControllerService } from "../../../generated/services/ChatControllerService";
import AIChat from "@/components/AIChat.vue";
import { CardControllerService, CardDTO } from "@backendApi/index";
import { FsrsService } from "@/services/FsrsService";
import { Grade } from "ts-fsrs";
import { AnkiSyncService } from "@/services/AnkiSyncService";

const aiChatRef = ref<InstanceType<typeof AIChat>>();
const isAIChatVisible = ref(false);

const cardSentToAI = ref(new Set<string>());

const syncWithAnki = async () => {
  const reviewedCardIds = await AnkiSyncService.syncReviewCards(cards.value);
  cards.value = cards.value.filter(
    (card) => card.id && reviewedCardIds.includes(card.id) === false
  );
};

// 添加清理 Obsidian 链接的函数
const cleanObsidianLinks = (text: string) => {
  // 匹配 Obsidian 链接的正则表达式
  const obsidianLinkRegex = /<a href="obsidian:\/\/[^>]+>.*?<\/a>/g;
  return text.replace(obsidianLinkRegex, "");
};

// 添加获取当前复习卡片的方法
const getCurrentReviewCard = (callback: (card: CardDTO) => void) => {
  const card = {
    id: currentCard.value?.id,
    question: currentCard.value?.question,
    answer: currentCard.value?.answer,
    tags: currentCard.value?.tags || [],
  };
  callback(card);
};

const showAIChat = async () => {
  // 如果已经显示，则不需要重复显示
  if (isAIChatVisible.value) return;

  isAIChatVisible.value = true;
  // 等待DOM更新后再显示AI助手
  await nextTick();
  aiChatRef.value?.show();

  // 如果当前卡片存在且还没有发送过给 AI
  if (currentCard.value && !cardSentToAI.value.has(currentCard.value.id)) {
    // 清空之前的聊天记录，开始新的会话
    aiChatRef.value?.clear();

    // 清理内容中的 Obsidian 链接
    const cleanQuestion = cleanObsidianLinks(currentCard.value.question);
    const cleanAnswer = cleanObsidianLinks(currentCard.value.answer);

    // 构造发送给 AI 的消息
    const message = `请帮我检查这张闪卡的内容：

问题：
${cleanQuestion}

答案：
${cleanAnswer}

${
  currentCard.value.tags?.length
    ? `标签：${currentCard.value.tags.join(", ")}`
    : ""
}`;

    // 记录这张卡片已经发送过
    cardSentToAI.value.add(currentCard.value.id);

    // 等待 AI 助手组件完全显示后再发送消息
    setTimeout(() => {
      aiChatRef.value?.sendMessage(message);
    }, 100);
  }
};

const handleAIChatClose = () => {
  // 如果已经关闭，则不需要重复关闭
  if (!isAIChatVisible.value) return;

  isAIChatVisible.value = false;
  isMouseInAIChat.value = false;

  // 等待过渡动画完成后再隐藏
  setTimeout(() => {
    aiChatRef.value?.hide();
  }, 300);
};

// 定义类型
interface MockResponse {
  controller: {
    close: () => void;
  };
}

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

const cards = ref<CardDTO[]>([]);

const currentIndex = ref(0);
const isFlipped = ref(false);
const completedCards = ref(0);
const correctAnswers = ref(0);
const syncLoading = ref(false);

// 添加一个新的状态来跟踪当前显示的卡片内容
const displayCard = ref<CardDTO | null>(null);

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

const fsrsService = new FsrsService();

// 控制评分按钮显示的计算属性
const showRatingButtons = computed(
  () => isFlipped.value && !ratingSubmitted.value
);

// 新增状态，用于跟踪是否已提交评分
const ratingSubmitted = ref(false);

// 切换卡片正反面
const toggleCard = () => {
  // 如果已经提交评分或正在编辑，不允许翻转
  if (ratingSubmitted.value || isEditModalVisible.value) return;
  isFlipped.value = !isFlipped.value;
};

const rateCard = async (rating: number) => {
  if (!currentCard.value) return;

  // 关闭 AI 助手并重置会话
  if (isAIChatVisible.value) {
    handleAIChatClose();
  }
  // 清空 AI 助手的聊天记录，为下一张卡片准备
  aiChatRef.value?.clear();
  // 重置已发送卡片的记录，这样切换到新卡片时可以重新发送
  cardSentToAI.value.clear();
  try {
    const ttt = currentCard.value;
    console.log("currentCard.value", ttt);
    await fsrsService.reviewCard(currentCard.value, rating);

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
    }, 100); // 300ms 是翻转动画的持续时间

    Message.success("评分已保存");
  } catch (error) {
    console.error("保存评分失败:", error);
    Message.error("保存失败，请重试");
  }
};

const restartReview = async () => {
  displayCard.value = null;
  currentIndex.value = 0;
  completedCards.value = 0;
  correctAnswers.value = 0;
  await loadDeckData();
};

// 在 script setup 中添加新的状态
const isMouseInAIChat = ref(false);

// 添加新的状态
const isCardsDrawerVisible = ref(false);

// 修改键盘事件处理函数
const handleKeyPress = (e: KeyboardEvent) => {
  // 如果抽屉打开或者正在编辑，禁用所有快捷键
  if (isCardsDrawerVisible.value || isEditing.value || isEditModalVisible.value)
    return;

  // 如果 AI 助手正在显示，且鼠标在 AI 助手区域内，不处理任何快捷键
  if (isAIChatVisible.value && isMouseInAIChat.value) return;

  // 按 f 键召唤 AI 助手
  if (e.key.toLowerCase() === "f") {
    e.preventDefault(); // 先阻止默认行为

    if (isAIChatVisible.value) {
      handleAIChatClose();
    } else {
      showAIChat();
    }
    return;
  }

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
    const res = await CardControllerService.getExpiredCards();

    if (res.code === 200 && res.data) {
      if (res.data.length === 0) {
        // 显示友好提示：暂无需要复习的卡片
        Message.success("恭喜！您已完成所有卡片的复习");

        // 提供一张示例卡片，以便用户看到界面效果
        cards.value = [
          {
            id: "sample",
            question:
              "# 恭喜！您已完成所有卡片的复习\n这是一张示例卡片\n\n卡片的背面介绍了复习功能的使用\n\n鼠标点击卡片或敲击空格即可使卡片翻转",
            answer:
              '# 使用提示\n\n## 1. 评分系统\n根据您的掌握情况，点击下方的按钮进行评分。系统会根据您的评分和卡片的信息使用<a href="https://github.com/open-spaced-repetition" target="_blank" rel="noopener">FSRS算法</a>计算出下一次复习时间和相关参数并保存起来。（这是一张示例卡无法真正保存）\n\n## 2. AI助手\n按**F键**或点击右方的蓝色机器人图标来召唤AI助手，他会自动帮你检查卡片内容的正确性和全面性。\n\n复习的过程中有任何疑问，您都可以和他进行交流，他能帮您答疑解惑。\n\n并且可以根据交流的内容，一键提取关键知识点自动生成适合学习复习的卡片。\n\n## 3. 编辑卡片\n将鼠标悬停在卡片上，点击右上角的编辑按钮就可以快速修改卡片的内容。\n*这是一张示例卡，所以修改、删除功能无法真正执行*',
            tags: ["我是标签", "知识点标签"],
          },
        ];
        return;
      }
      // 使用 Fisher-Yates 算法打乱卡片顺序
      cards.value = shuffleArray(res.data);
    } else {
      Message.error("加载卡片失败");
    }
  } catch (error) {
    console.error("加载卡片失败:", error);
    Message.error("加载失败，请重试");
  }
};

// 使用 Fisher-Yates 算法打乱卡片顺序
function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// 在 script setup 中添加
const isEditModalVisible = ref(false);
const editForm = ref({
  question: "",
  answer: "",
  tags: [] as string[],
});

// 添加编辑状态
const isEditing = ref(false);

// 修改 showEditModal 函数
const showEditModal = () => {
  if (!currentCard.value) return;
  editForm.value = {
    question: currentCard.value.question,
    answer: currentCard.value.answer,
    tags: currentCard.value.tags || [],
  };
  isEditing.value = true;
};

// 修改保存函数
const handleEditSave = async () => {
  if (!currentCard.value) return;
  try {
    const res = await CardControllerService.updateCard1({
      id: currentCard.value.id,
      question: editForm.value.question,
      answer: editForm.value.answer,
      tags: editForm.value.tags,
      group: currentCard.value.group,
    });

    if (res.code === 200 && res.data) {
      Message.success("更新成功");
      // 更新当前卡片内容
      if (currentCard.value) {
        currentCard.value.question = editForm.value.question;
        currentCard.value.answer = editForm.value.answer;
        currentCard.value.tags = editForm.value.tags;
      }
      // 重置所有编辑状态
      isEditing.value = false;
      isEditModalVisible.value = false;
    } else {
      Message.error("更新失败");
    }
  } catch (error) {
    console.error("更新卡片失败:", error);
    Message.error("更新失败，请重试");
  }
};

// 修改取消编辑函数
const cancelEdit = () => {
  // 重置所有编辑状态
  isEditing.value = false;
  isEditModalVisible.value = false;
  editForm.value = {
    question: currentCard.value?.question || "",
    answer: currentCard.value?.answer || "",
    tags: currentCard.value?.tags || [],
  };
};

// 添加处理卡片点击的函数
const handleCardClick = () => {
  if (!isEditing.value) {
    toggleCard();
  }
};

// 添加标签生成相关的状态
const isGeneratingTags = ref(false);

// 在 script setup 中添加新的状态
const isTagsModalVisible = ref(false);
const newGeneratedTags = ref<string[]>([]);
const selectedNewTags = ref<string[]>([]);
const existingTags = ref<string[]>([]);
const selectedExistingTags = ref<string[]>([]);

// 添加类型定义
type Tag = string;

// 修改生成标签的函数
const generateTags = async (e: Event) => {
  e.stopPropagation();
  if (!currentCard.value) return;

  try {
    isGeneratingTags.value = true;
    const content = `问题：${currentCard.value.question}\n\n答案：${currentCard.value.answer}`;

    const model =
      aiChatRef.value?.getCurrentModel() || AIChatRequest.model.BASIC;

    const res = await ChatControllerService.getTags({
      model: model,
      content,
    });

    if (res.code == 200 && res.data) {
      const requestId = res.data;
      let tagsReceived = false;

      try {
        await eventStreamService.waitForStreamingResult(
          requestId,
          async (newContent: string) => {
            try {
              const eventData = JSON.parse(newContent);
              if (
                eventData.eventType === "TAGS" &&
                Array.isArray(eventData.data)
              ) {
                const tags: Tag[] = eventData.data;
                if (tags.length > 0 && !tagsReceived) {
                  tagsReceived = true;
                  // 保存现有标签和新生成的标签
                  existingTags.value = currentCard.value?.tags || [];
                  selectedExistingTags.value = [...existingTags.value];
                  newGeneratedTags.value = tags.filter(
                    (tag: Tag) => !existingTags.value.includes(tag)
                  );
                  selectedNewTags.value = [...newGeneratedTags.value];

                  // 显示标签选择对话框
                  isTagsModalVisible.value = true;
                  isGeneratingTags.value = false;
                  Message.success({
                    content: `已生成 ${newGeneratedTags.value.length} 个新标签`,
                    duration: 2000,
                  });
                }
              }
            } catch (parseError) {
              console.error("解析标签失败:", parseError, newContent);
              isGeneratingTags.value = false;
            }
          }
        );
      } catch (streamError: any) {
        if (streamError?.message === "Request timeout" && tagsReceived) {
          // 如果已经收到并处理了标签，忽略超时错误
          return;
        }
        if (streamError?.message === "Request timeout") {
          Message.error("生成标签超时，请重试");
        } else {
          throw streamError;
        }
      }
    } else {
      Message.error("生成标签失败");
    }
  } catch (error) {
    console.error("生成标签失败:", error);
    Message.error("生成标签失败，请重试");
  } finally {
    isGeneratingTags.value = false;
  }
};

// 修改保存选中标签的函数
const handleTagsSave = async () => {
  if (!currentCard.value) return;

  try {
    // 合并选中的现有标签和新标签
    const finalTags = [...selectedExistingTags.value, ...selectedNewTags.value];

    // 更新卡片标签
    await CardControllerService.updateCard1({
      id: currentCard.value.id,
      tags: finalTags,
    });

    // 更新本地状态
    currentCard.value.tags = finalTags;
    editForm.value.tags = finalTags;

    Message.success("标签已更新");
    isTagsModalVisible.value = false;
  } catch (error) {
    console.error("保存标签失败:", error);
    Message.error("保存标签失败，请重试");
  }
};

// 修改取消选择的函数
const handleTagsCancel = () => {
  isTagsModalVisible.value = false;
  isGeneratingTags.value = false;
};

const handleCardUpdate = async (updateData: {
  type: "question" | "answer" | "tags" | "all";
  data: {
    question: string;
    answer: string;
    tags: string[];
  };
}) => {
  if (!currentCard.value) return;

  try {
    const { type, data } = updateData;

    // 根据更新类型更新不同的内容
    if (type === "question" || type === "all") {
      currentCard.value.question = data.question;
      editForm.value.question = data.question;
    }

    if (type === "answer" || type === "all") {
      currentCard.value.answer = data.answer;
      editForm.value.answer = data.answer;
    }

    if (type === "tags" || type === "all") {
      currentCard.value.tags = [...data.tags];
      editForm.value.tags = [...data.tags];
    }

    // 保存更新到后端
    await CardControllerService.updateCard1({
      id: currentCard.value.id,
      question: currentCard.value.question,
      answer: currentCard.value.answer,
      tags: currentCard.value.tags,
      group: currentCard.value.group,
    });

    Message.success("卡片已更新");
  } catch (error) {
    console.error("Update card error:", error);
    Message.error("更新失败");
  }
};

// 添加抽屉状态变化处理函数
const handleCardsDrawerChange = (visible: boolean) => {
  isCardsDrawerVisible.value = visible;
};

// 添加删除相关的状态
const deleteModalVisible = ref(false);

// 显示删除确认对话框
const showDeleteConfirm = () => {
  deleteModalVisible.value = true;
};

// 取消删除
const cancelDelete = () => {
  deleteModalVisible.value = false;
};

// 处理删除
const handleDelete = async () => {
  if (!currentCard.value) return;

  try {
    if (!currentCard.value.id) throw new Error("当前卡片不存在ID");
    const res = await CardControllerService.deleteCard1(currentCard.value.id);
    if (res.code === 200) {
      Message.success("删除成功");
      // 从卡片列表中移除当前卡片
      cards.value = cards.value.filter(
        (card) => card.id != currentCard.value?.id
      );
      // 更新当前卡片
      // currentCard.value = cards.value[0] || null;
      // 关闭对话框
      deleteModalVisible.value = false;
    }
  } catch (error) {
    console.error("Delete card error:", error);
    Message.error("删除失败");
  }
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
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
  padding: 6px 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  overflow: visible;
  padding: 0 1px;
  margin: 1px 0;
}

.card-container {
  position: relative;
  width: 100%;
  height: 100%;
  transition: all 0.29s ease;
  will-change: transform, width;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 8px 0;
}

.card-container.shift-left {
  width: 50%;
  transform: translateX(0);
}

.ai-helper-button {
  position: absolute;
  right: -60px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  transition: opacity 0.29s ease;
}

.ai-helper-panel {
  position: absolute;
  right: -20px;
  top: 0.8%;
  width: 50%;
  height: 87%;
  background: var(--color-bg-2);
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
  transition: all 0.29s ease;
  will-change: transform, opacity, visibility;
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 5px;
  border-radius: 16px;
  margin: 2px 0;
  visibility: hidden;
  opacity: 0;
  transform: translateX(100%);
}

.ai-helper-panel.show {
  transform: translateX(0);
  visibility: visible;
  opacity: 1;
}

:deep(.t-dialog) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  max-width: none;
  box-shadow: none;
  border-radius: 16px;
  background: var(--color-bg-2);
  display: flex;
  flex-direction: column;
}

:deep(.t-dialog__header) {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

:deep(.t-dialog__body) {
  padding: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.t-chat) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 16px;
}

:deep(.t-chat .t-chat__message-list) {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep(.t-chat .t-chat__input-wrapper) {
  padding: 16px 0;
  margin: 0;
  border-top: 1px solid var(--color-border);
  background: transparent;
  position: relative;
  flex-shrink: 0;
}

.card-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 0;
  padding: 4px 0;
}

.flashcard {
  width: 100%;
  height: 100%;
  perspective: 2000px;
  cursor: pointer;
  position: relative;
  transform: translate3d(0, 0, 0);
  transform-style: preserve-3d;
  transition: transform 0.29s cubic-bezier(0.29, 0, 0.29, 1);
}

.flashcard-inner {
  position: relative;
  width: 100%;
  height: 95%;
  left: -45px;
  transform: translate3d(0, 0, 0);
  transition: transform 0.29s cubic-bezier(0.4, 0, 0.29, 1);
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

/* 编辑器样式 */
.content-text :deep(.bytemd) {
  height: 100%;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  transition: all 0.29s;
}

.content-text :deep(.bytemd:hover),
.content-text :deep(.bytemd:focus-within) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light-3);
}

.content-text :deep(.bytemd-toolbar) {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-1);
}

.content-text :deep(.bytemd-editor) {
  background: transparent;
}

.card-tags {
  margin-top: 8px;
  padding: 4px 0;
  border-top: 1px solid var(--color-border);
}

.chat-ai {
  height: 600px;
}

.card-container.shift-left .ai-helper-button {
  opacity: 0;
}

/* 修改卡片的过渡效果 */
.card-container {
  transition: width 0.29s ease;
}

.card-container.shift-left {
  width: 50%;
}

/* 添加 AI 助手面板的过渡效果 */
.ai-helper-panel {
  transition: transform 0.29s ease, visibility 0.29s ease, opacity 0.29s ease;
}

.card-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.29s;
  pointer-events: auto;
}

.flashcard:hover .card-actions {
  opacity: 1;
}

:deep(.arco-textarea-wrapper) {
  font-family: monospace;
}

/* 修改编辑按钮的样式 */
:deep(.arco-btn-text) {
  background: var(--color-bg-2);
  border: 1px solid var(--color-border);
  &:hover {
    background: var(--color-fill-2);
  }
}

/* 确保编辑对话框在最上层 */
:deep(.arco-modal-wrapper) {
  z-index: 1000;
}

.flashcard {
  width: 100%;
  height: 100%;
  perspective: 2000px;
  cursor: pointer;
  position: relative;
  transform: translate3d(0, 0, 0);
  transform-style: preserve-3d;
  transition: transform 0.29s cubic-bezier(0.29, 0, 0.29, 1);
}

.flashcard.is-editing {
  cursor: default; /* 编辑模式下移除指针样式 */
}

/* 编辑模式下的标签输入样式 */
.card-tags :deep(.arco-input-tag) {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  transition: all 0.29s;
  min-height: 32px;
}

.card-tags :deep(.arco-input-tag:hover),
.card-tags :deep(.arco-input-tag:focus-within) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light-3);
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
  transition: opacity 0.29s;
  font-size: 14px;
}

.hint-divider {
  margin: 0 8px;
  opacity: 0.5;
}

.card-hint .shortcut {
  color: var(--color-primary);
  font-weight: 500;
  padding: 2px 6px;
  background: var(--color-fill-2);
  border-radius: 4px;
  margin: 0 2px;
}

.flashcard:hover .card-hint {
  opacity: 1;
}

.rating-area {
  background: var(--color-bg-2);
  padding: 8px;
  border-radius: 16px;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(100%);
  opacity: 0;
  transition: all 0.29s ease;
}

.rating-area.show {
  transform: translateY(0);
  opacity: 1;
}

.rating-title {
  font-size: 16px;
  color: var(--color-text-2);
  text-align: center;
  margin-bottom: 8px;
}

.rating-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
}

.rating-btn {
  font-size: 14px;
  transition: all 0.29s;
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
  padding: 6px;
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

@media screen and (max-height: 768px) {
  .review-content {
    padding: 0 40px;
    margin: 4px 0;
  }

  .card-content {
    padding: 8px;
  }

  .rating-area {
    padding: 6px;
  }

  .rating-buttons {
    gap: 8px;
  }

  .rating-btn {
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

.tags-selection {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tags-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-2);
  margin-bottom: 4px;
}

:deep(.arco-checkbox) {
  margin-right: 12px;
  margin-bottom: 8px;
}

:deep(.arco-checkbox-group) {
  width: 100%;
}

:deep(.arco-space-wrap) {
  width: 100%;
}

/* 添加删除按钮的样式 */
:deep(.arco-btn-status-danger) {
  &:hover {
    color: var(--color-danger);
    background: var(--color-danger-light);
  }
}
</style>

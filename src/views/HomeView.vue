<template>
  <div class="home-container">
    <!-- 顶部搜索区域 -->
    <div
      class="search-section"
      :class="{ 'search-minimized': showAIChat }"
      v-if="!hideSearchBar"
    >
      <div class="search-content">
        <h1 class="search-title">CardFlow</h1>
        <p class="search-subtitle">
          多样的学习资源<br />
          高效的学习流程（思考-->制卡-->复习-->致用）<br />
          智能的学习辅助（一键制卡、自动构建知识图谱）
        </p>
        <div class="search-input-wrapper">
          <div class="textarea-container">
            <a-textarea
              v-model="searchInput"
              style="border-radius: 8px"
              placeholder="询问任何问题，然后一键制卡，自动构建个人知识图谱"
              allow-clear
              :auto-size="{ minRows: 2, maxRows: 4 }"
              :max-length="500"
              class="custom-textarea"
              @keypress.enter="
                (e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }
              "
            />
          </div>
          <a-button
            type="primary"
            size="large"
            class="search-button"
            style="border-radius: 8px"
            @click="handleSearch"
          >
            <template #icon>
              <icon-search />
            </template>
            <span>出发</span>
          </a-button>
        </div>
      </div>
      <div class="search-background"></div>
    </div>

    <!-- AI聊天组件 -->
    <div v-if="showAIChat" class="ai-chat-wrapper">
      <div class="ai-chat-header">
        <h3>AI学习助手</h3>
        <a-button type="text" @click="resetSearch">
          <template #icon>
            <icon-close />
          </template>
        </a-button>
      </div>
      <AIChat
        ref="aiChatRef"
        embedded
        :title="''"
        height="700px"
        :show-clear="true"
      />
    </div>

    <!-- 资源推荐区域 -->
    <div class="resource-section" :class="{ 'with-chat': showAIChat }">
      <a-row :gutter="[16, 16]">
        <!-- 学习资源推荐 -->
        <a-col :span="showAIChat ? 24 : 8">
          <a-card class="resource-card" title="热门学习资料" :bordered="false">
            <template #extra>
              <a-button type="text" @click="() => navigateTo('/resource')">
                查看更多
                <template #icon>
                  <icon-right />
                </template>
              </a-button>
            </template>
            <a-spin :loading="resourcesLoading">
              <a-list :data="recommendedResources" :bordered="false">
                <template #item="{ item }">
                  <a-list-item
                    class="resource-list-item"
                    @click="() => navigateTo(`/resource-preview?id=${item.id}`)"
                  >
                    <div class="resource-item">
                      <div class="resource-icon">
                        <icon-file-pdf v-if="item.fileType === 'pdf'" />
                        <icon-file-image
                          v-else-if="item.fileType === 'image'"
                        />
                        <icon-file-video
                          v-else-if="item.fileType === 'video'"
                        />
                        <icon-file v-else />
                      </div>
                      <div class="resource-info">
                        <div class="resource-title">{{ item.title }}</div>
                        <div class="resource-meta">
                          <a-space>
                            <a-tag size="small" color="arcoblue">
                              {{ item.category }}
                            </a-tag>
                            <span class="views-count">
                              <icon-eye /> {{ item.viewCount }}
                            </span>
                          </a-space>
                        </div>
                      </div>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
            </a-spin>
          </a-card>
        </a-col>

        <!-- 卡片推荐 -->
        <a-col :span="showAIChat ? 24 : 8">
          <a-card class="resource-card" title="热门抽认卡片" :bordered="false">
            <template #extra>
              <a-button type="text" @click="() => navigateTo('/cardManage')">
                查看更多
                <template #icon>
                  <icon-right />
                </template>
              </a-button>
            </template>
            <a-spin :loading="cardsLoading">
              <div class="cards-grid">
                <div
                  v-for="card in recommendedCards"
                  :key="card.id"
                  class="card-item"
                  @click="() => navigateTo('/cardManage')"
                >
                  <div class="card-front">
                    <div class="card-content">{{ card.question }}</div>
                    <div class="card-tags">
                      <a-tag v-for="tag in card.tags" :key="tag" size="small">
                        {{ tag }}
                      </a-tag>
                    </div>
                  </div>
                </div>
              </div>
            </a-spin>
          </a-card>
        </a-col>

        <!-- 知识图谱推荐 -->
        <a-col :span="showAIChat ? 24 : 8">
          <a-card class="resource-card" title="热门知识图谱" :bordered="false">
            <template #extra>
              <a-button type="text" @click="() => navigateTo('/graph')">
                查看更多
                <template #icon>
                  <icon-right />
                </template>
              </a-button>
            </template>
            <a-spin :loading="graphsLoading">
              <a-list :data="recommendedGraphs" :bordered="false">
                <template #item="{ item }">
                  <a-list-item
                    class="resource-list-item"
                    @click="() => navigateTo('/graph')"
                  >
                    <div class="resource-item">
                      <div class="resource-icon graph-icon">
                        <icon-mind-mapping />
                      </div>
                      <div class="resource-info">
                        <div class="resource-title">{{ item.title }}</div>
                        <div class="resource-meta">
                          <a-space>
                            <a-tag size="small" color="green">
                              {{ item.nodeCount }} 节点
                            </a-tag>
                            <span class="views-count">
                              <icon-user /> {{ item.userCount }}
                            </span>
                          </a-space>
                        </div>
                      </div>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
            </a-spin>
          </a-card>
        </a-col>
      </a-row>

      <!-- 编程题目推荐 -->
      <div class="section-title">
        <h2>推荐编程题目</h2>
        <a-button type="text" @click="() => navigateTo('/questions')">
          查看更多
          <template #icon>
            <icon-right />
          </template>
        </a-button>
      </div>
      <a-spin :loading="questionsLoading">
        <a-row :gutter="[16, 16]">
          <a-col
            :span="showAIChat ? 12 : 6"
            v-for="question in recommendedQuestions"
            :key="question.id"
          >
            <a-card
              class="question-card"
              :bordered="false"
              @click="() => navigateTo(`/view/question/${question.id}`)"
            >
              <div class="question-title">{{ question.title }}</div>
              <div class="question-tags">
                <a-space wrap>
                  <a-tag v-for="tag in question.tags" :key="tag" size="small">
                    {{ tag }}
                  </a-tag>
                </a-space>
              </div>
              <div class="question-stats">
                <div
                  class="difficulty"
                  :class="getDifficultyClass(question.tags?.[0])"
                >
                  {{ question.tags?.[0] || "未知" }}
                </div>
                <div class="success-rate">
                  通过率: {{ getAcceptedRate(question) }}%
                </div>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from "vue";
import AIChat from "@/components/AIChat.vue";
import { useRouter } from "vue-router";
import { Message } from "@arco-design/web-vue";
import { useStore } from "vuex";
import {
  IconSearch,
  IconClose,
  IconRight,
  IconFilePdf,
  IconFileImage,
  IconFileVideo,
  IconFile,
  IconEye,
  IconUser,
  IconMindMapping,
} from "@arco-design/web-vue/es/icon";
import { QuestionControllerService, QuestionVO } from "../../generated";
import { authService } from "@/services/AuthService";

// 路由实例
const router = useRouter();
const store = useStore();

// 使用统一认证服务
const isLoggedIn = computed(() => store.getters["user/isLoggedIn"]);

// 权限检查与路由导航
const checkLoginBeforeAction = async (callback: () => void) => {
  const loggedIn = await authService.checkLogin();
  if (loggedIn) {
    callback();
  }
};

// 搜索和AIChat状态
const searchInput = ref("");
const showAIChat = ref(false);
const hideSearchBar = ref(false);
const aiChatRef = ref<InstanceType<typeof AIChat> | null>(null);

// 加载状态
const resourcesLoading = ref(true);
const cardsLoading = ref(true);
const graphsLoading = ref(true);
const questionsLoading = ref(true);

// 模拟数据 - 实际项目中应该从API获取
const recommendedResources = ref([
  {
    id: "678f00bad6a32c3155b50979",
    title: "Appach Dubbo微服务",
    category: "微服务",
    viewCount: 1253,
    fileType: "pdf",
  },
  {
    id: "678f00bad6a32c3155b50979",
    title: "Java高级编程指南",
    category: "编程语言",
    viewCount: 856,
    fileType: "pdf",
  },
  {
    id: "678f00bad6a32c3155b50979",
    title: "机器学习入门课程",
    category: "人工智能",
    viewCount: 2341,
    fileType: "video",
  },
  {
    id: "678f00bad6a32c3155b50979",
    title: "Web前端开发实战",
    category: "前端开发",
    viewCount: 1028,
    fileType: "image",
  },
]);

const recommendedCards = ref([
  { id: 1, question: "什么是HTTP协议?", tags: ["网络", "基础"] },
  {
    id: 2,
    question: "Java 中的序列化和反序列化是什么?",
    tags: ["Java", "后端"],
  },
  { id: 3, question: "如何实现快速排序算法?", tags: ["算法", "排序"] },
  { id: 4, question: "什么是Docker容器?", tags: ["容器化", "运维"] },
]);

const recommendedGraphs = ref([
  { id: 1, title: "Java知识图谱", nodeCount: 156, userCount: 2344 },
  { id: 2, title: "Spring", nodeCount: 203, userCount: 3128 },
  { id: 3, title: "微服务", nodeCount: 184, userCount: 1876 },
  { id: 4, title: "数据结构与算法", nodeCount: 243, userCount: 2567 },
]);

const recommendedQuestions = ref(Array<QuestionVO>());

// 处理搜索事件
const handleSearch = async () => {
  const loginUser = await store.dispatch("user/getLoginUser");

  // 如果用户未登录，直接跳转到登录页
  if (!loginUser) {
    Message.warning("请先登录");
    router.push("/user/login");
    return;
  }
  if (!searchInput.value.trim()) {
    Message.warning("请输入搜索内容");
    return;
  }

  try {
    // 显示AIChat组件
    showAIChat.value = true;

    // 等待DOM更新，确保AIChat组件已加载
    await nextTick();

    // 如果AIChat引用存在，发送用户输入的内容
    if (aiChatRef.value) {
      setTimeout(() => {
        aiChatRef.value?.sendMessage(searchInput.value, "chat");

        // 添加滚动逻辑，滚动到AI聊天组件位置
        const aiChatElement = document.querySelector(".home-container");
        if (aiChatElement) {
          aiChatElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300); // 稍微延迟，确保组件完全初始化
    }
  } catch (error) {
    console.error("Error sending message to AIChat:", error);
    Message.error("发送消息失败，请重试");
  }
};

// 重置搜索
const resetSearch = () => {
  showAIChat.value = false;
  hideSearchBar.value = false;
  searchInput.value = "";
};

// 导航到指定路径
const navigateTo = (path: string) => {
  router.push(path);
};

// 获取题目难度对应的样式类名
const getDifficultyClass = (difficultyTag: string | undefined) => {
  if (!difficultyTag) return "easy";

  if (difficultyTag.includes("简单")) {
    return "easy";
  } else if (difficultyTag.includes("中等")) {
    return "medium";
  } else if (difficultyTag.includes("困难") || difficultyTag.includes("hard")) {
    return "hard";
  } else {
    return "easy";
  }
};

// 获取题目难度显示文本方法保留但不再使用
const getDifficultyText = (difficulty: string | number) => {
  if (typeof difficulty === "string") {
    difficulty = parseInt(difficulty);
  }

  switch (difficulty) {
    case 1:
      return "简单";
    case 2:
      return "中等";
    case 3:
      return "困难";
    default:
      return "简单";
  }
};

// 计算题目通过率
const getAcceptedRate = (question) => {
  if (!question.submitNum) return 0;
  return ((question.acceptedNum / question.submitNum) * 100).toFixed(1);
};

// 加载热门编程题目
const loadTopQuestions = async () => {
  try {
    questionsLoading.value = true;
    const res = await QuestionControllerService.getTopFiftyUsingGet();
    // console.log("res" + res.value);
    if (res.code == 200 && res.data) {
      // 只展示前8个题目
      recommendedQuestions.value = res.data.slice(0, 8);
      console.log("recommendQuestions" + recommendedQuestions.value);
    } else {
      console.error("Failed to load top questions:", res.message);
    }
  } catch (error) {
    console.error("Error loading top questions:", error);
  } finally {
    questionsLoading.value = false;
  }
};

// 模拟加载数据
const loadData = () => {
  // 实际项目中这里应该发起API请求
  resourcesLoading.value = false;
  cardsLoading.value = false;
  graphsLoading.value = false;
};

// 组件挂载时加载数据
onMounted(() => {
  loadData();
  loadTopQuestions();
});
</script>

<style scoped>
.search-input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.textarea-container {
  width: 100%;
  position: relative;
}

.custom-textarea {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
}

.custom-textarea:deep(.arco-textarea-wrapper) {
  padding: 12px 16px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--color-primary-light-2);
}

.custom-textarea:deep(.arco-textarea-wrapper:focus-within) {
  border-color: var(--color-primary-5);
  box-shadow: 0 0 0 2px rgba(var(--primary-6), 0.2);
}

.textarea-hint {
  position: absolute;
  right: 12px;
  bottom: 8px;
  font-size: 12px;
  color: var(--color-text-3);
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  border-radius: 4px;
}

.search-button {
  width: 180px;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(var(--primary-6), 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.search-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(var(--primary-6), 0.4);
}
.home-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
}

/* 搜索区域样式 */
.search-section {
  position: relative;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  margin-bottom: 24px;
  overflow: hidden;
  transition: all 0.5s ease;
}

.search-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    var(--color-primary-light-4),
    var(--color-success-light-4)
  );
  z-index: -1;
  opacity: 0.8;
}

.search-minimized {
  height: 0;
  margin: 0;
  padding: 0;
  opacity: 0;
  overflow: hidden;
}

.search-content {
  text-align: center;
  max-width: 600px;
  padding: 0 24px;
}

.search-title {
  color: var(--color-text-1);
  font-size: 38px;
  font-weight: 600;
  margin-bottom: 16px;
}

.search-subtitle {
  color: var(--color-text-2);
  font-size: 16px;
  margin-bottom: 32px;
}

.search-input-wrapper {
  width: 100%;
}

.search-input-wrapper :deep(.arco-input-search) {
  height: 50px;
}

.search-input-wrapper :deep(.arco-input-wrapper) {
  border-radius: 25px;
  height: 50px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.search-input-wrapper :deep(.arco-input-search-button) {
  height: 50px;
  border-radius: 0 25px 25px 0;
  width: 100px;
  font-size: 16px;
}

/* AI聊天相关样式 */
.ai-chat-wrapper {
  background: var(--color-bg-2);
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  /* margin-bottom: 24px; */
  height: 800px;
  overflow: hidden;
}

.ai-chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-neutral-3);
}

/* 资源区域样式 */
.resource-section {
  transition: all 0.3s ease;
}

.resource-section.with-chat {
  padding-top: 24px;
}

.resource-card {
  height: 100%;
  transition: transform 0.3s ease;
}

.resource-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.resource-list-item {
  cursor: pointer;
  padding: 8px 0;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.resource-list-item:hover {
  background-color: var(--color-fill-2);
  padding-left: 8px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resource-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-fill-2);
  border-radius: 8px;
  color: var(--color-primary-6);
  font-size: 20px;
}

.graph-icon {
  background-color: var(--color-success-light-1);
  color: var(--color-success-6);
}

.resource-info {
  flex: 1;
}

.resource-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--color-text-1);
}

.resource-meta {
  font-size: 12px;
  color: var(--color-text-3);
}

.views-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 卡片网格样式 */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.card-item {
  height: 120px;
  border-radius: 8px;
  background-color: var(--color-fill-2);
  padding: 16px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  background-color: var(--color-primary-light-1);
}

.card-front {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-content {
  flex: 1;
  font-weight: 500;
  color: var(--color-text-1);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.card-tags {
  margin-top: 8px;
}

/* 题目相关样式 */
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 32px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.section-title h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0;
}

.question-card {
  height: 100%;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.question-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
}

.question-title {
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--color-text-1);
  font-size: 15px;
}

.question-tags {
  margin-bottom: 16px;
}

.question-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--color-text-3);
  font-size: 13px;
}

.difficulty {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.difficulty.easy {
  background-color: var(--color-success-light-1);
  color: var(--color-success-6);
}

.difficulty.medium {
  background-color: var(--color-warning-light-1);
  color: var(--color-warning-6);
}

.difficulty.hard {
  background-color: var(--color-danger-light-1);
  color: var(--color-danger-6);
}
</style>

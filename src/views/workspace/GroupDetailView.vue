<template>
  <div id="groupDetailView">
    <div class="page-header">
      <div class="header-left">
        <a-button type="text" @click="router.back()">
          <template #icon>
            <icon-left />
          </template>
          返回
        </a-button>
        <h2>{{ decodeURIComponent(group) }}</h2>
      </div>
      <a-space>
        <a-button type="primary" @click="showAddCard">
          <template #icon>
            <icon-plus />
          </template>
          新建卡片
        </a-button>
        <a-button type="primary" status="success" @click="syncWithAnki">
          <template #icon>
            <icon-sync />
          </template>
          同步到Anki
        </a-button>
      </a-space>
    </div>

    <a-spin :loading="cardsLoading">
      <div class="cards-container">
        <div class="cards-grid">
          <!-- 卡片列表 -->
          <a-card
            v-for="card in cards"
            :key="card.id"
            class="card-item"
            hoverable
          >
            <template #title>
              <div class="card-title">
                <icon-file />
                问题
              </div>
            </template>
            <div class="card-question">
              {{ truncateContent(card.question) }}
            </div>
            <div class="card-divider"></div>
            <div class="card-answer-title">
              <icon-message />
              答案
            </div>
            <div class="card-answer">
              {{ truncateContent(card.answer) }}
            </div>
            <template #extra>
              <a-space>
                <a-button type="text" @click="editCard(card)">
                  <template #icon>
                    <icon-edit />
                  </template>
                </a-button>
                <a-button type="text" status="danger" @click="deleteCard(card)">
                  <template #icon>
                    <icon-delete />
                  </template>
                </a-button>
              </a-space>
            </template>
          </a-card>
        </div>

        <div class="pagination-container">
          <a-pagination
            v-if="total > 0"
            :total="total"
            :current="currentPage"
            :page-size="pageSize"
            show-total
            show-jumper
            :page-size-options="[12, 24, 36, 48]"
            @change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          />
        </div>
      </div>
    </a-spin>

    <!-- 新建/编辑卡片对话框 -->
    <a-modal
      v-model:visible="cardModalVisible"
      :title="cardModalTitle"
      @ok="handleCardSubmit"
      @cancel="cardModalVisible = false"
    >
      <a-form :model="cardForm" ref="cardFormRef">
        <a-form-item field="question" label="问题" required>
          <a-textarea
            v-model="cardForm.question"
            placeholder="请输入问题"
            :auto-size="{ minRows: 2, maxRows: 4 }"
          />
        </a-form-item>
        <a-form-item field="answer" label="答案" required>
          <a-textarea
            v-model="cardForm.answer"
            placeholder="请输入答案"
            :auto-size="{ minRows: 3, maxRows: 6 }"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加删除确认对话框 -->
    <a-modal
      v-model:visible="deleteModalVisible"
      @ok="confirmDelete"
      @cancel="cancelDelete"
      simple
    >
      <template #title>确认删除</template>
      <div>确定要删除这张卡片吗？此操作不可恢复。</div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  IconPlus,
  IconFolder,
  IconEdit,
  IconDelete,
  IconSync,
  IconFile,
  IconMessage,
  IconLeft,
} from "@arco-design/web-vue/es/icon";
import { Message } from "@arco-design/web-vue";
import { CardControllerService } from "../../../generated/services/CardControllerService";
import type { CardAddRequest } from "../../../generated/models/CardAddRequest";
import type { CardUpdateRequest } from "../../../generated/models/CardUpdateRequest";
import { AnkiService } from "@/services/AnkiService";

const router = useRouter();
const route = useRoute();
const group = route.params.group as string;

// 接口定义
interface Card {
  id: string;
  question: string;
  answer: string;
  group?: string;
}

// 状态变量
const cards = ref<Card[]>([]);
const cardsLoading = ref(false);
const syncLoading = ref(false);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(12);
const total = ref(0);

// 模态框状态
const cardModalVisible = ref(false);
const cardModalTitle = ref("新建卡片");
const cardForm = ref<Card>({
  id: "",
  question: "",
  answer: "",
  group: "",
});
const isEditingCard = ref(false);

// 添加删除相关的状态
const deleteModalVisible = ref(false);
const cardToDelete = ref<Card | null>(null);

// 加载卡片列表
const loadCards = async () => {
  cardsLoading.value = true;
  try {
    const res = await CardControllerService.getUserGroupCardsWithPagination(
      decodeURIComponent(group),
      currentPage.value - 1,
      pageSize.value
    );
    if (res.code === 200 && res.data) {
      cards.value = res.data.content;
      total.value = res.data.totalElements;
    }
  } catch (error) {
    Message.error("加载卡片失败");
  } finally {
    cardsLoading.value = false;
  }
};

// 显示新建卡片对话框
const showAddCard = () => {
  isEditingCard.value = false;
  cardModalTitle.value = "新建卡片";
  cardForm.value = {
    id: "",
    question: "",
    answer: "",
    group: decodeURIComponent(group),
  };
  cardModalVisible.value = true;
};

// 编辑卡片
const editCard = (card: Card) => {
  isEditingCard.value = true;
  cardModalTitle.value = "编辑卡片";
  cardForm.value = { ...card };
  cardModalVisible.value = true;
};

// 提交卡片表单
const handleCardSubmit = async () => {
  if (!cardForm.value.question.trim() || !cardForm.value.answer.trim()) {
    Message.warning("请填写完整信息");
    return;
  }

  try {
    if (isEditingCard.value) {
      const updateParams: CardUpdateRequest = {
        id: cardForm.value.id,
        question: cardForm.value.question,
        answer: cardForm.value.answer,
        group: decodeURIComponent(group),
      };
      const res = await CardControllerService.updateCard(updateParams);
      if (res.code === 200) {
        Message.success("更新成功");
        cardModalVisible.value = false;
        loadCards();
      }
    } else {
      const addParams: CardAddRequest = {
        question: cardForm.value.question,
        answer: cardForm.value.answer,
        group: decodeURIComponent(group),
      };
      const res = await CardControllerService.createCard(addParams);
      if (res.code === 200) {
        Message.success("创建成功");
        cardModalVisible.value = false;
        loadCards();
      }
    }
  } catch (error) {
    Message.error(isEditingCard.value ? "更新失败" : "创建失败");
  }
};

// 删除卡片
const deleteCard = (card: Card) => {
  cardToDelete.value = card;
  deleteModalVisible.value = true;
};

// 确认删除
const confirmDelete = async () => {
  if (!cardToDelete.value) return;

  try {
    const res = await CardControllerService.deleteCard(cardToDelete.value.id);
    if (res.code === 200) {
      Message.success("删除成功");
      loadCards();
    }
  } catch (error) {
    Message.error("删除失败");
  } finally {
    deleteModalVisible.value = false;
    cardToDelete.value = null;
  }
};

// 取消删除
const cancelDelete = () => {
  deleteModalVisible.value = false;
  cardToDelete.value = null;
};

// 同步到Anki
const syncWithAnki = async () => {
  syncLoading.value = true;
  try {
    const res = await CardControllerService.syncWithAnki(
      decodeURIComponent(group)
    );
    if (res.code === 200 && res.data?.ankiNoteAddRequests?.length > 0) {
      const deckName = decodeURIComponent(group);
      const deckCreated = await AnkiService.createDeckIfNotExists(deckName);
      if (!deckCreated) {
        throw new Error("Failed to create deck in Anki");
      }

      // 添加笔记到Anki
      const noteIds = await AnkiService.addNotes(
        deckName,
        res.data.ankiNoteAddRequests.map((request) => ({
          question: request.question,
          answer: request.answer,
          tags: request.tags || [],
        }))
      );

      if (noteIds.length === 0) {
        throw new Error("Failed to add notes to Anki");
      }

      // 获取笔记信息（包含mod值）
      const notesInfo = await AnkiService.getNotesInfo(noteIds);

      // 获取卡片信息
      const cardsInfo = await AnkiService.getCardsInfo(noteIds);

      // 更新系统中的卡片信息
      for (let i = 0; i < res.data.ankiNoteAddRequests.length; i++) {
        const cardInfo = cardsInfo[i];
        const noteInfo = notesInfo[i];
        const request = res.data.ankiNoteAddRequests[i];
        if (cardInfo && noteInfo) {
          const updateRequest = {
            id: request.id, // 使用ankiNoteAddRequests中的id
            ankiInfo: {
              noteId: cardInfo.note,
              cardId: cardInfo.cardId,
              syncTime: noteInfo.mod, // 使用note的mod值作为syncTime
            },
          };

          await CardControllerService.updateCard(updateRequest);
        }
      }

      Message.success("同步成功");
      loadCards();
    }
  } catch (error) {
    console.error("Sync failed:", error);
    Message.error(
      "同步失败：" + (error instanceof Error ? error.message : "未知错误")
    );
  } finally {
    syncLoading.value = false;
  }
};

// 内容预览截断
const truncateContent = (content: string | undefined) => {
  if (!content) return "";
  return content.length > 50 ? content.slice(0, 50) + "..." : content;
};

// 分页处理
const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadCards();
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  loadCards();
};

onMounted(() => {
  loadCards();
});
</script>

<style scoped>
#groupDetailView {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cards-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 重要：允许内容滚动 */
}

.cards-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
  overflow-y: auto; /* 允许卡片内滚动 */
}

.card-item {
  height: 280px;
  transition: all 0.3s;
}

.card-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-2);
}

.card-question {
  flex: 1;
  margin: 8px 0;
  font-size: 16px;
  font-weight: 500;
}

.card-divider {
  height: 1px;
  background-color: var(--color-neutral-3);
  margin: 8px 0;
}

.card-answer-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-2);
  margin-top: 8px;
}

.card-answer {
  flex: 1;
  margin: 8px 0;
  color: var(--color-text-3);
}

.add-card {
  height: 280px;
  border: 2px dashed var(--color-neutral-3);
  background-color: var(--color-fill-2);
  cursor: pointer;
  transition: all 0.3s;
}

.add-card:hover {
  border-color: var(--color-primary);
  background-color: var(--color-fill-3);
}

.add-card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  color: var(--color-text-3);
}

.add-card:hover .add-card-content {
  color: var(--color-primary);
}

.pagination-container {
  padding: 16px;
  background-color: var(--color-bg-2);
  border-top: 1px solid var(--color-border);
}
</style>

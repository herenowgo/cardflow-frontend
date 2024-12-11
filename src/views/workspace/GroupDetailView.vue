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
            <div class="card-tags" v-if="card.tags && card.tags.length > 0">
              <a-space>
                <a-tag
                  v-for="tag in card.tags"
                  :key="tag"
                  size="small"
                  color="arcoblue"
                >
                  {{ tag }}
                </a-tag>
              </a-space>
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
        <a-form-item field="tags" label="标签">
          <a-input-tag
            v-model="cardForm.tags"
            placeholder="输入标签后按回车添加"
            allow-clear
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

    <!-- 添加冲突解决对话框 -->
    <a-modal
      v-model:visible="conflictModalVisible"
      title="解决同步冲突"
      @cancel="handleConflictCancel"
      :footer="false"
    >
      <template v-if="conflictCards.length > 0">
        <div class="conflict-card">
          <h3>
            第 {{ currentConflictIndex + 1 }}/{{ conflictCards.length }} 个冲突
          </h3>
          <div class="conflict-versions">
            <div class="version system">
              <h4>系统版本</h4>
              <div class="content">
                <div class="field">
                  <label>问题：</label>
                  <p>
                    {{
                      conflictCards[currentConflictIndex].systemCard.question
                    }}
                  </p>
                </div>
                <div class="field">
                  <label>答案：</label>
                  <p>
                    {{ conflictCards[currentConflictIndex].systemCard.answer }}
                  </p>
                </div>
                <div class="field">
                  <label>标签：</label>
                  <a-space>
                    <a-tag
                      v-for="tag in conflictCards[currentConflictIndex]
                        .systemCard.tags"
                      :key="tag"
                      size="small"
                    >
                      {{ tag }}
                    </a-tag>
                  </a-space>
                </div>
              </div>
              <a-button type="primary" @click="resolveConflict('system')">
                使用系统版本
              </a-button>
            </div>
            <div class="version anki">
              <h4>Anki版本</h4>
              <div class="content">
                <div class="field">
                  <label>问题：</label>
                  <p>
                    {{ conflictCards[currentConflictIndex].ankiCard.question }}
                  </p>
                </div>
                <div class="field">
                  <label>��案：</label>
                  <p>
                    {{ conflictCards[currentConflictIndex].ankiCard.answer }}
                  </p>
                </div>
                <div class="field">
                  <label>标签：</label>
                  <a-space>
                    <a-tag
                      v-for="tag in conflictCards[currentConflictIndex].ankiCard
                        .tags"
                      :key="tag"
                      size="small"
                    >
                      {{ tag }}
                    </a-tag>
                  </a-space>
                </div>
              </div>
              <a-button type="primary" @click="resolveConflict('anki')">
                使用Anki版本
              </a-button>
            </div>
          </div>
        </div>
      </template>
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
  tags?: string[];
}

// 添加冲突卡片的接口定义
interface ConflictCard {
  systemCard: Card & { modifiedTime: number };
  ankiCard: {
    question: string;
    answer: string;
    tags: string[];
    mod: number;
  };
  cardId: string;
}

// 修改 AnkiSyncedCard 接口定义
interface AnkiSyncedCard {
  cardId: number;
  syncTime: number;
  modifiedTime: number;
}

interface AnkiNote {
  noteId: number;
  mod: number;
  fields: {
    Front: { value: string };
    Back: { value: string };
  };
  tags: string[];
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
  tags: [],
});
const isEditingCard = ref(false);

// 添加删除相关的状态
const deleteModalVisible = ref(false);
const cardToDelete = ref<Card | null>(null);

// 添加冲突处理相关的状态
const conflictModalVisible = ref(false);
const conflictCards = ref<ConflictCard[]>([]);
const currentConflictIndex = ref(0);

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
    tags: [],
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
        tags: cardForm.value.tags,
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
        tags: cardForm.value.tags,
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
    const deckName = decodeURIComponent(group);

    // 1. 确保 Anki 中存在对应的牌组
    const deckExists = await AnkiService.createDeckIfNotExists(deckName);
    if (!deckExists) {
      throw new Error("Failed to create or verify deck");
    }

    // 2. 获取系统同步状态
    const res = await CardControllerService.syncWithAnki(deckName);
    if (res.code !== 200 || !res.data) {
      throw new Error("Failed to get sync status");
    }

    // 3. 处理新卡片同步
    if (res.data.ankiNoteAddRequests?.length > 0) {
      console.log("Adding new notes to Anki:", res.data.ankiNoteAddRequests);

      // 将新卡片添加到 Anki
      const notes = res.data.ankiNoteAddRequests.map((request) => ({
        question: request.question || "",
        answer: request.answer || "",
        tags: request.tags || [],
      }));

      const noteIds = await AnkiService.addNotes(deckName, notes);

      // 检查是否所有笔记都添加成功
      if (noteIds.length !== notes.length) {
        throw new Error("Failed to add some notes to Anki");
      }

      // 更新系统中卡片的 Anki 信息
      for (let i = 0; i < noteIds.length; i++) {
        const request = res.data.ankiNoteAddRequests[i];
        const noteId = noteIds[i];

        // 获取新添加笔记对应的卡片信息和笔记信息
        const cardInfo = await AnkiService.getCardsInfo([noteId]);
        const noteInfo = await AnkiService.getNotesInfo([noteId]);

        if (!cardInfo?.[0] || !noteInfo?.[0]) {
          console.error(`Failed to get card/note info for note: ${noteId}`);
          continue;
        }

        // 更新系统中的卡片信息，添加 syncTime
        const updateRequest: CardUpdateRequest = {
          id: request.id || "",
          ankiInfo: {
            cardId: cardInfo[0].cardId,
            noteId: noteId,
            modelName: "Basic",
            syncTime: noteInfo[0].mod, // 设置 syncTime 为笔记的 mod 值
          },
        };

        const updateRes = await CardControllerService.updateCard(updateRequest);
        if (updateRes.code !== 200) {
          console.error(`Failed to update card in system: ${request.id}`);
        }
      }
    }

    // 4. 处理已同步卡片的更新
    if (res.data.ankiSyncedCards?.length > 0) {
      // 获取所有卡片的详细信息
      const cardsInfo = await AnkiService.getCardsInfo(res.data.cardIds);
      const notesInfo = await AnkiService.getNotesInfo(
        cardsInfo
          .map((card) => card.note)
          .filter((id): id is number => id !== undefined)
      );

      // 找出系统中更新过的卡片
      const systemUpdatedCards = res.data.ankiSyncedCards.filter(
        (syncCard) => syncCard.modifiedTime > syncCard.syncTime
      );

      // 找出 Anki 中更新过的卡片
      const ankiUpdatedCards = res.data.ankiSyncedCards.filter((syncCard) => {
        const cardInfo = cardsInfo.find(
          (info) => info.cardId === syncCard.cardId
        );
        const noteInfo = cardInfo
          ? notesInfo.find((note) => note.noteId === cardInfo.note)
          : null;
        return noteInfo && noteInfo.mod > syncCard.syncTime;
      });

      // 处理冲突：找出两边都更新过的卡片
      const conflicts: ConflictCard[] = [];

      for (const systemCard of systemUpdatedCards) {
        const ankiUpdated = ankiUpdatedCards.find(
          (card) => card.cardId === systemCard.cardId
        );

        if (ankiUpdated) {
          try {
            // 获取系统中的最新数据 todo 有很大的优化空间
            const systemCardInfo = await getSystemCardInfo(
              systemCard.cardId.toString()
            );

            // 获取 Anki 中的数据
            const cardInfo = cardsInfo.find(
              (info) => info.cardId === systemCard.cardId
            );
            const noteInfo = cardInfo
              ? notesInfo.find((note) => note.noteId === cardInfo.note)
              : null;

            if (noteInfo) {
              conflicts.push({
                systemCard: {
                  ...systemCard,
                  question: systemCardInfo.question,
                  answer: systemCardInfo.answer,
                  tags: systemCardInfo.tags || [],
                },
                ankiCard: {
                  question: noteInfo.fields.Front.value,
                  answer: noteInfo.fields.Back.value,
                  tags: noteInfo.tags,
                  mod: noteInfo.mod,
                },
                cardId: systemCard.cardId.toString(),
              });
            }
          } catch (error) {
            console.error("Failed to process conflict:", error);
            continue;
          }
        }
      }

      // 如果有冲突，显示冲突解决对话框
      if (conflicts.length > 0) {
        conflictCards.value = conflicts;
        currentConflictIndex.value = 0;
        conflictModalVisible.value = true;
        return; // 等待用户解决冲突后再继续
      }

      // 没有冲突，直接处理更新
      await handleUpdates(
        systemUpdatedCards,
        ankiUpdatedCards,
        cardsInfo,
        notesInfo
      );
    }

    // 继续处理新卡片的步...
    // ... (保持原有的新卡片同步逻辑不变)

    Message.success("同步成功");
    loadCards();
  } catch (error) {
    console.error("Sync failed:", error);
    Message.error(
      "同步失败：" + (error instanceof Error ? error.message : "未知错误")
    );
  } finally {
    syncLoading.value = false;
  }
};

// 修改处理更新的辅助方法
const handleUpdates = async (
  systemUpdatedCards: AnkiSyncedCard[],
  ankiUpdatedCards: AnkiSyncedCard[],
  cardsInfo: any[],
  notesInfo: AnkiNote[]
) => {
  console.log("System updated cards:", systemUpdatedCards);

  // 处理系统更新到 Anki
  for (const syncCard of systemUpdatedCards) {
    try {
      console.log("Processing card:", syncCard.cardId);

      // 获取系统中的卡片信息
      const systemCard = await getSystemCardInfo(syncCard.cardId.toString());
      console.log("Found system card:", systemCard);

      // 获取对应的 Anki 卡片信息
      const cardInfo = cardsInfo.find(
        (info) => info.cardId === syncCard.cardId
      );
      if (!cardInfo?.note) {
        console.error(`Failed to find note ID for card: ${syncCard.cardId}`);
        continue;
      }

      // 更新 Anki 中的笔记
      const result = await AnkiService.updateNote({
        id: cardInfo.note,
        fields: {
          Front: systemCard.question,
          Back: systemCard.answer,
        },
        tags: systemCard.tags || [],
      });

      if (!result) {
        console.error(
          `Failed to update note in Anki for card ${syncCard.cardId}`
        );
        continue;
      }

      // 获取更新后的笔记信息，以获取新的 mod 值
      const updatedNoteInfo = await AnkiService.getNotesInfo([cardInfo.note]);
      if (!updatedNoteInfo?.[0]) {
        console.error(
          `Failed to get updated note info for note: ${cardInfo.note}`
        );
        continue;
      }

      // 更新系统中的卡片信息，使用 Anki 笔记的 mod 值作为 syncTime
      const updateRequest: CardUpdateRequest = {
        id: systemCard.id,
        ankiInfo: {
          cardId: cardInfo.cardId,
          noteId: cardInfo.note,
          modelName: "Basic",
          syncTime: updatedNoteInfo[0].mod,
        },
      };

      const updateRes = await CardControllerService.updateCard(updateRequest);
      if (updateRes.code !== 200) {
        console.error(
          `Failed to update card sync time in system: ${systemCard.id}`
        );
      }
    } catch (error) {
      console.error("Failed to update note in Anki:", error);
    }
  }

  // 处理 Anki 更��到系统
  for (const card of ankiUpdatedCards) {
    if (!systemUpdatedCards.includes(card)) {
      const cardInfo = cardsInfo.find((info) => info.cardId === card.cardId);
      const noteInfo = cardInfo
        ? notesInfo.find((note) => note.noteId === cardInfo.note)
        : null;

      if (noteInfo && cardInfo) {
        try {
          // 获取系统中的卡片信息，以获取正确的系统 ID
          const systemCard = await getSystemCardInfo(card.cardId.toString());

          const updateRequest: CardUpdateRequest = {
            id: systemCard.id, // 使用系统中的卡片 ID，而不是 Anki 的 cardId
            question: noteInfo.fields.Front.value,
            answer: noteInfo.fields.Back.value,
            tags: noteInfo.tags,
            ankiInfo: {
              cardId: cardInfo.cardId,
              noteId: cardInfo.note,
              modelName: cardInfo.modelName,
              syncTime: noteInfo.mod,
            },
          };

          const res = await CardControllerService.updateCard(updateRequest);
          if (res.code !== 200) {
            console.error("Failed to update card in system:", card.cardId);
          }
        } catch (error) {
          console.error("Failed to update card in system:", error);
        }
      }
    }
  }
};

// 内预览截断
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

// 修改冲突解决方法
const resolveConflict = async (version: "system" | "anki") => {
  const currentConflict = conflictCards.value[currentConflictIndex.value];
  if (!currentConflict) return;

  try {
    if (version === "system") {
      // 获取系统中的卡片信息
      const res = await CardControllerService.getUserGroupCardsWithPagination(
        decodeURIComponent(group),
        0,
        1
      );
      if (res.code !== 200 || !res.data?.content?.length) {
        throw new Error("Failed to get system card info");
      }

      // 获取 Anki 中的笔记信息
      const cardInfo = await AnkiService.getCardsInfo([
        parseInt(currentConflict.cardId),
      ]);
      if (!cardInfo?.[0]?.note) {
        throw new Error("Failed to find note ID");
      }

      const result = await AnkiService.updateNote({
        id: cardInfo[0].note,
        fields: {
          Front: currentConflict.systemCard.question,
          Back: currentConflict.systemCard.answer,
        },
        tags: currentConflict.systemCard.tags || [],
      });

      if (!result) {
        throw new Error("Failed to update Anki note");
      }
    } else {
      // 使用 Anki 版本更新到系统
      const cardInfo = await AnkiService.getCardsInfo([
        parseInt(currentConflict.cardId),
      ]);
      if (!cardInfo?.[0]?.note) {
        throw new Error("Failed to find note ID");
      }

      // 获取系统中的卡片信息
      const systemCard = await getSystemCardInfo(currentConflict.cardId);

      const updateRequest: CardUpdateRequest = {
        id: systemCard.id, // 使用系统中的卡片 ID
        question: currentConflict.ankiCard.question,
        answer: currentConflict.ankiCard.answer,
        tags: currentConflict.ankiCard.tags,
        ankiInfo: {
          cardId: parseInt(currentConflict.cardId),
          noteId: cardInfo[0].note,
          modelName: "Basic",
          syncTime: currentConflict.ankiCard.mod,
        },
      };

      const res = await CardControllerService.updateCard(updateRequest);
      if (res.code !== 200) {
        throw new Error("Failed to update system card");
      }
    }

    // 处理下一个冲突
    if (currentConflictIndex.value < conflictCards.value.length - 1) {
      currentConflictIndex.value++;
    } else {
      // 所有冲突都已解决
      conflictModalVisible.value = false;
      Message.success("所有冲突已解决");
      loadCards();
    }
  } catch (error) {
    console.error("Failed to resolve conflict:", error);
    Message.error(
      "解决冲突失败：" + (error instanceof Error ? error.message : "未知错误")
    );
  }
};

// 修改获取系统卡片信息的逻辑
const getSystemCardInfo = async (cardId: string) => {
  // 使用分页接口，设置条件只获取指定 ID 的卡片
  const res = await CardControllerService.getUserGroupCardsWithPagination(
    decodeURIComponent(group),
    0,
    100 // 增大页面大小以确保能找到卡片
  );
  if (res.code !== 200 || !res.data?.content) {
    throw new Error(`Failed to get system card info: ${cardId}`);
  }

  // 从结果中找到定 ID 的卡片
  const card = res.data.content.find(
    (c) => c.ankiInfo?.cardId === parseInt(cardId)
  );
  if (!card) {
    throw new Error(`Card not found: ${cardId}`);
  }

  return card;
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

.card-tags {
  margin: 8px 0;
  min-height: 24px;
}

:deep(.arco-tag) {
  margin: 2px;
}

.conflict-card {
  padding: 16px;
}

.conflict-versions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.version {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.version h4 {
  margin-bottom: 16px;
  color: var(--color-text-1);
}

.field {
  margin-bottom: 12px;
}

.field label {
  font-weight: 500;
  color: var(--color-text-2);
}

.field p {
  margin: 4px 0;
  color: var(--color-text-1);
}
</style>

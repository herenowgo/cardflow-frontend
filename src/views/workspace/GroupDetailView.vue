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
                  <label>答案：</label>
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
import type { AnkiInfo } from "../../../generated";

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
  noteId: string;
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

// 添加缺失的变量定义
const deckName = decodeURIComponent(group);

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
      try {
        await AnkiService.deleteNotes([cardToDelete.value.ankiInfo.noteId]);
      } catch (error) {
        Message.error("Anki同步删除失败，打开anki后点击同步到Anki即可");
        // todo 记录删除信息，延迟删除
      }
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
  try {
    // 1. 获取同步状态
    const res = await CardControllerService.syncWithAnki(deckName);
    if (res.code !== 200 || !res.data) {
      throw new Error("Failed to get sync status");
    }

    // 2. 处理新卡片同步
    // 2.1 处理系统中的新卡片
    if (res.data.ankiNoteAddRequests?.length > 0) {
      // 确保目标牌组存在
      const deckExists = await AnkiService.createDeckIfNotExists(deckName);
      if (!deckExists) {
        throw new Error(`Failed to create or verify deck: ${deckName}`);
      }

      // 将新卡片添加到 Anki
      const notes = res.data.ankiNoteAddRequests.map((request) => ({
        question: request.question || "",
        answer: request.answer || "",
        tags: request.tags || [],
      }));

      // 添加笔记到 Anki
      const noteIds = await AnkiService.addNotes(deckName, notes);
      if (!noteIds || noteIds.length !== notes.length) {
        throw new Error("Failed to add some notes to Anki");
      }

      // 获取新添加笔记的卡片信息
      const noteInfos = await AnkiService.getNotesInfo(noteIds);
      const cardInfos = await AnkiService.getCardsInfo(noteIds);
      if (!cardInfos || cardInfos.length === 0) {
        throw new Error("Failed to get card info for new notes");
      }

      // 批量更新系统卡片的 Anki 信息
      const updates = res.data.ankiNoteAddRequests.map((request, index) => {
        const noteInfo = noteInfos[index];
        if (!noteInfo) {
          throw new Error(`No note info found for note ${noteIds[index]}`);
        }
        return {
          id: request.id,
          ankiInfo: {
            cardId: noteInfo.cards[0],
            noteId: noteInfo.noteId,
            modelName: "Basic",
            syncTime: noteInfo.mod,
          },
        };
      });

      // 批量更新系统卡片
      await Promise.all(
        updates.map((update) => CardControllerService.updateCard(update))
      );
    }

    // 2.2 处理anki中的新卡片
    const deckCardIds = await AnkiService.getDeckCardIds(group);
    // 如果deckCardIds中有res.data.cardIds中没有的，那就是anki中的新卡片，保存到一个新的数组中
    const ankiNewCards = deckCardIds.filter(
      (cardId) => !res.data.cardIds.includes(cardId)
    );
    if (ankiNewCards.length > 0) {
      const ankiNewCardsInfo = await AnkiService.getCardsInfo(ankiNewCards);
      console.log("ankiNewCardsCreates", JSON.stringify(ankiNewCardsInfo));
      ankiNewCardsInfo.map(async (card, index) => {
        const noteInfos = await AnkiService.getNotesInfo([card.cardId]);
        const noteInfo = noteInfos[0];
        console.log("noteInfo", JSON.stringify(noteInfo));

        if (!noteInfo) {
          throw new Error(`No note info found for note ${card.note}`);
        }

        CardControllerService.createCard({
          ankiInfo: {
            cardId: card.cardId,
            noteId: card.note,
            modelName: card.modelName,
            syncTime: noteInfo.mod,
          },
          question: card.fields.Front.value,
          answer: card.fields.Back.value,
          tags: noteInfo.tags,
          group: group,
        });
      });
    }
    // 3. 处理已同步卡片的更新
    if (res.data.ankiSyncedCards?.length > 0) {
      // 获取 Anki 中的卡片和笔记信息
      const cardsInfo = await AnkiService.getCardsInfo(res.data.cardIds);
      const notesInfo = await AnkiService.getNotesInfo(
        cardsInfo.map((card) => card.note).filter(Boolean)
      );

      // 处理冲突和更新
      const { conflicts, updates } = await processCardsSync(
        res.data.ankiSyncedCards,
        cardsInfo,
        notesInfo
      );

      if (conflicts.length > 0) {
        conflictCards.value = conflicts;
        currentConflictIndex.value = 0;
        conflictModalVisible.value = true;
        return;
      }

      // 批量处理所有更新
      if (updates.length > 0) {
        await Promise.all(
          updates.map((update) => CardControllerService.updateCard(update))
        );
      }
    }

    Message.success("同步成功");
    await loadCards();
  } catch (error) {
    console.error("Sync failed:", error);
    Message.error("同步失败");
  }
};
// 修改处理同步的辅助函数
const processCardsSync = async (
  syncedCards: AnkiSyncedCard[],
  cardsInfo: any[],
  notesInfo: any[]
) => {
  const conflicts: ConflictCard[] = [];
  const updates: CardUpdateRequest[] = [];

  for (const syncCard of syncedCards) {
    // 使用 cardId 查找 Anki 中的卡片信息
    const cardInfo = cardsInfo.find((info) => info.cardId === syncCard.cardId);

    if (!cardInfo) {
      console.error(`Card info not found for card ${syncCard.cardId}`);
      continue;
    }

    // 使用卡片关联的 note ID 查找笔记信息
    const noteInfo = notesInfo.find((note) => note.noteId === cardInfo.note);

    if (!noteInfo) {
      console.error(`Note info not found for note ${cardInfo.note}`);
      continue;
    }

    // 检查系统是否有更新（修改时间大于上次同步时间）
    const systemHasUpdate = syncCard.modifiedTime > syncCard.syncTime;
    // 检查 Anki 是否有更新（修改时间大于上次同步时间）
    const ankiHasUpdate = noteInfo.mod > syncCard.syncTime;

    if (systemHasUpdate && ankiHasUpdate) {
      // todo 优化为批量处理
      const systemCard = await CardControllerService.getCardById(syncCard.id);
      console.log("systemCard:" + JSON.stringify(systemCard.data));
      if (systemCard.code !== 200 || !systemCard.data) {
        throw new Error("Failed to get system card");
      }
      // 双方都有更新，产生冲突
      conflicts.push({
        systemCard: {
          id: systemCard.data?.id,
          modifiedTime: systemCard.data?.modifiedTime,
          question: systemCard.data?.question,
          answer: systemCard.data?.answer,
          tags: systemCard.data?.tags || [],
        },
        ankiCard: {
          question: noteInfo.fields.Front.value,
          answer: noteInfo.fields.Back.value,
          tags: noteInfo.tags,
          mod: noteInfo.mod,
        },
        cardId: syncCard.cardId.toString(),
        noteId: cardInfo.note,
      });
    } else if (systemHasUpdate) {
      // 只有系统有更新，需要更新到 Anki
      try {
        // todo 优化为批量处理
        // 先获取系统中的最新卡片信息
        const systemCard = await CardControllerService.getCardById(syncCard.id);
        if (systemCard.code !== 200 || !systemCard.data) {
          throw new Error("Failed to get system card");
        }

        // 更新到 Anki
        console.log("111更新note了:" + JSON.stringify(systemCard.data));
        const result = await AnkiService.updateNote({
          id: cardInfo.note, // 使用 note ID 而不是 card ID
          fields: {
            Front: systemCard.data.question,
            Back: systemCard.data.answer,
          },
          tags: systemCard.data.tags || [],
        });

        const mod = await AnkiService.getNotesModTime([cardInfo.note]);

        if (mod !== null && result) {
          // 确保 mod 是有效值
          updates.push({
            id: syncCard.id,
            ankiInfo: {
              syncTime: Number(mod), // 确保转换为数值
            },
          });
          // CardControllerService.updateCard({
          //   id: syncCard.id,
          //   ankiInfo: {
          //     syncTime: Number(mod), // 确保转换为数值
          //   },
          // });
        }
      } catch (error) {
        console.error("Error updating Anki:", error);
      }
    } else if (ankiHasUpdate) {
      // 只有 Anki 有更新，需要更新到系统
      updates.push({
        id: syncCard.id,
        question: noteInfo.fields.Front.value,
        answer: noteInfo.fields.Back.value,
        tags: noteInfo.tags || [],
        ankiInfo: {
          syncTime: noteInfo.mod,
        },
      });
    }
  }

  return { conflicts, updates };
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
      // 使用系统版本更新到 Anki
      const result = await AnkiService.updateNote({
        id: Number(currentConflict.noteId),
        fields: {
          Front: currentConflict.systemCard.question,
          Back: currentConflict.systemCard.answer,
        },
        tags: currentConflict.systemCard.tags || [],
      });

      if (!result) {
        throw new Error("Failed to update Anki note");
      }

      // 把anki中这个note的mod更新到系统中的card
      const mod = await AnkiService.getNotesModTime([currentConflict.noteId]);
      if (mod !== null) {
        // 确保 mod 是有效值
        await CardControllerService.updateCard({
          id: currentConflict.systemCard?.id,
          ankiInfo: {
            syncTime: Number(mod), // 确保转换为数值
          },
        });
      }
    } else {
      // 使用 Anki 版本更新到系统

      const updateRequest: CardUpdateRequest = {
        id: currentConflict.systemCard.id, // 使用系统中的卡片 ID
        question: currentConflict.ankiCard.question,
        answer: currentConflict.ankiCard.answer,
        tags: currentConflict.ankiCard.tags,
        ankiInfo: {
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

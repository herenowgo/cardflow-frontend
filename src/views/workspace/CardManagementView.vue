<template>
  <div id="cardManagementView">
    <div class="page-header">
      <h2>卡片管理</h2>
    </div>

    <!-- 筛选条件区域 -->
    <a-card class="filter-area">
      <a-form
        :model="filterForm"
        layout="grid"
        :grid="{ cols: 3, gutter: 24 }"
        @submit="handleSearch"
      >
        <a-form-item label="牌组" field="group">
          <a-select
            v-model="filterForm.group"
            placeholder="选择牌组"
            allow-clear
          >
            <a-option v-for="group in groups" :key="group" :value="group">{{
              group
            }}</a-option>
          </a-select>
        </a-form-item>

        <a-form-item label="标签" field="tags">
          <a-input-tag
            v-model="filterForm.tags"
            placeholder="输入标签后按回车"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="问题内容" field="question">
          <a-input
            v-model="filterForm.question"
            placeholder="搜索问题内容"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="答案内容" field="answer">
          <a-input
            v-model="filterForm.answer"
            placeholder="搜索答案内容"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="是否公开" field="overt">
          <a-select
            v-model="filterForm.overt"
            placeholder="选择状态"
            allow-clear
          >
            <a-option :value="true">公开</a-option>
            <a-option :value="false">私有</a-option>
          </a-select>
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" html-type="submit">
              <template #icon><icon-search /></template>
              搜索
            </a-button>
            <a-button @click="resetFilters">
              <template #icon><icon-refresh /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 卡片列表 -->
    <a-card class="card-table">
      <a-spin :loading="loading">
        <a-table
          :data="cards"
          :pagination="pagination"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
          :bordered="false"
          row-key="id"
          :stripe="true"
          :scroll="{ x: '100%' }"
        >
          <template #columns>
            <a-table-column title="问题" data-index="question" :width="200">
              <template #cell="{ record }">
                <div class="question-cell">
                  {{ truncateText(record.question, 100) }}
                </div>
              </template>
            </a-table-column>
            <a-table-column title="答案" data-index="answer" :width="200">
              <template #cell="{ record }">
                <div class="answer-cell">
                  {{ truncateText(record.answer, 100) }}
                </div>
              </template>
            </a-table-column>
            <a-table-column title="标签" data-index="tags" :width="100">
              <template #cell="{ record }">
                <div class="tags-cell">
                  <a-space wrap size="mini">
                    <a-tag
                      v-for="tag in record.tags"
                      :key="tag"
                      size="small"
                      color="arcoblue"
                    >
                      {{ tag }}
                    </a-tag>
                  </a-space>
                </div>
              </template>
            </a-table-column>
            <a-table-column title="牌组" data-index="group" :width="40" />
            <!-- <a-table-column title="状态" data-index="overt" :width="40">
              <template #cell="{ record }">
                <a-tag :color="overtModalVisible ? 'green' : 'gray'">
                  {{ overtModalVisible ? "公开" : "私有" }}
                </a-tag>
              </template>
            </a-table-column> -->
            <!-- <a-table-column title="创建时间" :width="150">
              <template #cell="{ record }">
                {{ formatDate(record.createTime) }}
              </template>
            </a-table-column> -->
            <a-table-column title="操作" :width="200" fixed="left">
              <template #cell="{ record }">
                <a-space>
                  <a-button
                    type="text"
                    size="small"
                    @click="viewCardDetail(record)"
                  >
                    <template #icon><icon-eye /></template>
                    详情
                  </a-button>

                  <!-- 公开卡片模式或者是公开卡片时只显示收藏按钮 -->
                  <template v-if="isPublicCardsMode || record.overt">
                    <a-button
                      type="text"
                      status="warning"
                      size="small"
                      @click="importCard(record)"
                    >
                      <template #icon><icon-star /></template>
                      收藏
                    </a-button>
                  </template>

                  <!-- 非公开卡片模式下私有卡片显示完整操作 -->
                  <template v-else-if="!isPublicCardsMode && !record.overt">
                    <a-button
                      type="text"
                      size="small"
                      @click="editCard(record)"
                    >
                      <template #icon><icon-edit /></template>
                      编辑
                    </a-button>
                    <a-button
                      type="text"
                      status="danger"
                      size="small"
                      @click="confirmDeleteCard(record)"
                    >
                      <template #icon><icon-delete /></template>
                      删除
                    </a-button>
                    <a-button
                      type="text"
                      status="success"
                      size="small"
                      @click="confirmSetCardOvert(record)"
                    >
                      <template #icon><icon-send /></template>
                      公开
                    </a-button>
                  </template>
                </a-space>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </a-spin>
    </a-card>

    <!-- 卡片详情对话框 -->
    <a-modal
      v-model:visible="cardDetailVisible"
      title="卡片详情"
      :footer="false"
      :mask-closable="true"
    >
      <div v-if="selectedCard" class="card-detail">
        <div class="detail-section">
          <h4>问题：</h4>
          <div
            class="detail-content question-content"
            v-html="formatContent(selectedCard.question)"
          ></div>
        </div>
        <div class="detail-section">
          <h4>答案：</h4>
          <div
            class="detail-content answer-content"
            v-html="formatContent(selectedCard.answer)"
          ></div>
        </div>
        <div class="detail-section">
          <h4>标签：</h4>
          <div class="detail-tags">
            <a-space wrap>
              <a-tag
                v-for="tag in selectedCard.tags"
                :key="tag"
                color="arcoblue"
              >
                {{ tag }}
              </a-tag>
            </a-space>
          </div>
        </div>
        <div class="detail-section">
          <h4>牌组：</h4>
          <div>{{ selectedCard.group }}</div>
        </div>
        <div class="detail-section">
          <h4>状态：</h4>
          <a-tag :color="overtModalVisible ? 'green' : 'gray'">
            {{ overtModalVisible ? "公开" : "私有" }}
          </a-tag>
        </div>
        <div class="detail-section">
          <h4>创建时间：</h4>
          <div>{{ formatDate(selectedCard.createTime) }}</div>
        </div>
      </div>
    </a-modal>

    <!-- 编辑卡片对话框 -->
    <a-modal
      v-model:visible="editModalVisible"
      :title="isCreatingCard ? '创建卡片' : '编辑卡片'"
      @ok="handleSaveCard"
      @cancel="editModalVisible = false"
    >
      <a-form :model="cardForm" ref="cardFormRef" :rules="cardFormRules">
        <a-form-item field="question" label="问题" required>
          <a-textarea
            v-model="cardForm.question"
            placeholder="请输入问题内容"
            :auto-size="{ minRows: 3, maxRows: 6 }"
          />
        </a-form-item>
        <a-form-item field="answer" label="答案" required>
          <a-textarea
            v-model="cardForm.answer"
            placeholder="请输入答案内容"
            :auto-size="{ minRows: 3, maxRows: 6 }"
          />
        </a-form-item>
        <a-form-item field="tags" label="标签">
          <a-input-tag
            v-model="cardForm.tags"
            placeholder="输入标签后按回车添加"
            allow-clear
          />
        </a-form-item>
        <a-form-item field="group" label="牌组" required>
          <a-select v-model="cardForm.group" placeholder="选择牌组" allow-clear>
            <a-option v-for="group in groups" :key="group" :value="group">{{
              group
            }}</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认对话框 -->
    <a-modal
      v-model:visible="deleteModalVisible"
      title="确认删除"
      @ok="handleDeleteCard"
      @cancel="deleteModalVisible = false"
      simple
    >
      <p>确定要删除这张卡片吗？此操作不可恢复。</p>
    </a-modal>

    <!-- 设为公开确认对话框 -->
    <a-modal
      v-model:visible="overtModalVisible"
      title="确认操作"
      @ok="handleSetCardOvert"
      @cancel="overtModalVisible = false"
      simple
    >
      <p>确定要将该卡片设为公开吗？公开后将对所有用户可见。</p>
    </a-modal>

    <!-- 收藏卡片确认对话框 -->
    <a-modal
      v-model:visible="importModalVisible"
      title="收藏卡片"
      @ok="handleImportCard"
      @cancel="importModalVisible = false"
    >
      <p>将该卡片收藏到您的牌组中：</p>
      <a-form :model="importForm">
        <a-form-item field="group" label="目标牌组" required>
          <a-select
            v-model="importForm.group"
            placeholder="选择目标牌组"
            allow-clear
          >
            <a-option v-for="group in groups" :key="group" :value="group">{{
              group
            }}</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import { Message, Modal } from "@arco-design/web-vue";
import {
  IconSearch,
  IconRefresh,
  IconEye,
  IconEdit,
  IconDelete,
  IconSend,
  IconStar,
} from "@arco-design/web-vue/es/icon";
import {
  CardControllerService,
  GroupControllerService,
} from "@backendApi/index";
import type { CardDTO } from "@backendApi/models/CardDTO";
import type { CardPageRequest } from "@backendApi/models/CardPageRequest";
import type { CardUpdateRequest } from "@backendApi/models/CardUpdateRequest";
import type { CardAddRequest } from "@backendApi/models/CardAddRequest";
import { formatDate as formatDateUtil } from "@/utils/dateUtils";

// 状态变量
const cards = ref<CardDTO[]>([]);
const loading = ref(false);
const groups = ref<string[]>([]);
const totalElements = ref(0);
const selectedCard = ref<CardDTO | null>(null);

// 对话框状态
const cardDetailVisible = ref(false);
const editModalVisible = ref(false);
const deleteModalVisible = ref(false);
const overtModalVisible = ref(false);
const importModalVisible = ref(false);
const isCreatingCard = ref(false);

// 筛选表单
const filterForm = reactive({
  group: "",
  tags: [] as string[],
  question: "",
  answer: "",
  overt: null as boolean | null,
});

// 编辑表单
const cardForm = reactive({
  id: "",
  question: "",
  answer: "",
  tags: [] as string[],
  group: "",
});

// 导入表单
const importForm = reactive({
  group: "",
});

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showJumper: true,
  pageSizeOptions: [10, 20, 50, 100],
});

// 表单验证规则
const cardFormRules = {
  question: [{ required: true, message: "请输入问题内容" }],
  answer: [{ required: true, message: "请输入答案内容" }],
  group: [{ required: true, message: "请选择牌组" }],
};

// 加载分组列表
const loadGroups = async () => {
  try {
    const res = await GroupControllerService.getUserGroups();
    if (res.code === 200 && res.data) {
      groups.value = res.data;
    }
  } catch (error) {
    Message.error("加载分组失败");
    console.error("加载分组失败:", error);
  }
};

// 加载卡片列表
const loadCards = async () => {
  loading.value = true;
  try {
    // 构建请求参数
    const request: CardPageRequest = {
      current: pagination.current - 1, // API 从 0 开始计数
      pageSize: pagination.pageSize,
      group: filterForm.group || undefined,
      tags: filterForm.tags.length > 0 ? filterForm.tags : undefined,
      question: filterForm.question || undefined,
      answer: filterForm.answer || undefined,
      overt: filterForm.overt,
    };

    const res = await CardControllerService.getCardsWithPagination(request);

    if (res.code === 200 && res.data) {
      cards.value = res.data.content || [];
      totalElements.value = res.data.totalElements || 0;
      pagination.total = totalElements.value;
    } else {
      Message.error("加载卡片失败");
    }
  } catch (error) {
    Message.error("加载卡片失败");
    console.error("加载卡片失败:", error);
  } finally {
    loading.value = false;
  }
};

const isPublicCardsMode = ref(false);

// 搜索事件
const handleSearch = () => {
  // 更新公开卡片模式状态
  isPublicCardsMode.value = filterForm.overt === true;
  pagination.current = 1;
  loadCards();
};

// 重置筛选条件
const resetFilters = () => {
  filterForm.group = "";
  filterForm.tags = [];
  filterForm.question = "";
  filterForm.answer = "";
  filterForm.overt = null;
  // 重置公开卡片模式
  isPublicCardsMode.value = false;
  pagination.current = 1;
  loadCards();
};

// 分页事件处理
const handlePageChange = (page: number) => {
  pagination.current = page;
  loadCards();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.current = 1;
  loadCards();
};

// 截断文本
const truncateText = (text: string, maxLength: number) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

// 格式化日期
const formatDate = (timestamp?: number) => {
  if (!timestamp) return "-";
  return formatDateUtil(timestamp);
};

// 格式化内容，保留基本格式
const formatContent = (content: string) => {
  if (!content) return "";
  // 简单地将换行符转为 <br>
  return content.replace(/\n/g, "<br>");
};

// 查看卡片详情
const viewCardDetail = (card: CardDTO) => {
  selectedCard.value = card;
  cardDetailVisible.value = true;
};

// 编辑卡片
const editCard = (card: CardDTO) => {
  isCreatingCard.value = false;
  cardForm.id = card.id || "";
  cardForm.question = card.question || "";
  cardForm.answer = card.answer || "";
  cardForm.tags = card.tags || [];
  cardForm.group = card.group || "";
  editModalVisible.value = true;
};

// 确认删除卡片
const confirmDeleteCard = (card: CardDTO) => {
  selectedCard.value = card;
  deleteModalVisible.value = true;
};

// 处理删除卡片
const handleDeleteCard = async () => {
  if (!selectedCard.value?.id) {
    Message.error("卡片ID不存在");
    return;
  }

  try {
    const res = await CardControllerService.deleteCard1(selectedCard.value.id);
    if (res.code === 200) {
      Message.success("删除成功");
      loadCards();
    } else {
      Message.error("删除失败");
    }
  } catch (error) {
    Message.error("删除失败");
    console.error("删除失败:", error);
  } finally {
    deleteModalVisible.value = false;
  }
};

// 确认设置卡片为公开
const confirmSetCardOvert = (card: CardDTO) => {
  selectedCard.value = card;
  overtModalVisible.value = true;
};

// 处理设置卡片为公开
const handleSetCardOvert = async () => {
  if (!selectedCard.value?.id) {
    Message.error("卡片ID不存在");
    return;
  }

  try {
    const res = await CardControllerService.setCardOvert(selectedCard.value.id);
    if (res.code === 200) {
      Message.success("设置成功");
      loadCards();
    } else {
      Message.error("设置失败");
    }
  } catch (error) {
    Message.error("设置失败");
    console.error("设置失败:", error);
  } finally {
    overtModalVisible.value = false;
  }
};

// 收藏公开卡片
const importCard = (card: CardDTO) => {
  selectedCard.value = card;
  importForm.group = "";
  importModalVisible.value = true;
};

// 处理收藏卡片
const handleImportCard = async () => {
  if (!selectedCard.value) {
    Message.error("未选择卡片");
    return;
  }

  if (!importForm.group) {
    Message.error("请选择目标牌组");
    return;
  }

  try {
    // 创建一个新卡片请求
    const request: CardAddRequest = {
      question: selectedCard.value.question || "",
      answer: selectedCard.value.answer || "",
      tags: selectedCard.value.tags || [],
      group: importForm.group,
    };

    const res = await CardControllerService.createCard(request);
    if (res.code === 200) {
      Message.success("收藏成功");
      loadCards();
    } else {
      Message.error("收藏失败");
    }
  } catch (error) {
    Message.error("收藏失败");
    console.error("收藏失败:", error);
  } finally {
    importModalVisible.value = false;
  }
};

// 保存卡片
const handleSaveCard = async () => {
  if (!cardForm.question.trim() || !cardForm.answer.trim() || !cardForm.group) {
    Message.warning("请填写完整信息");
    return;
  }

  try {
    if (isCreatingCard.value) {
      // 创建新卡片
      const request: CardAddRequest = {
        question: cardForm.question,
        answer: cardForm.answer,
        tags: cardForm.tags,
        group: cardForm.group,
      };

      const res = await CardControllerService.createCard(request);
      if (res.code === 200) {
        Message.success("创建成功");
        editModalVisible.value = false;
        loadCards();
      } else {
        Message.error("创建失败");
      }
    } else {
      // 更新卡片
      const request: CardUpdateRequest = {
        id: cardForm.id,
        question: cardForm.question,
        answer: cardForm.answer,
        tags: cardForm.tags,
        group: cardForm.group,
      };

      const res = await CardControllerService.updateCard1(request);
      if (res.code === 200) {
        Message.success("更新成功");
        editModalVisible.value = false;
        loadCards();
      } else {
        Message.error("更新失败");
      }
    }
  } catch (error) {
    Message.error(isCreatingCard.value ? "创建失败" : "更新失败");
    console.error(isCreatingCard.value ? "创建失败:" : "更新失败:", error);
  }
};

onMounted(() => {
  loadGroups();
  loadCards();
});
</script>

<style scoped>
#cardManagementView {
  padding: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-area {
  margin-bottom: 16px;
}

.card-table {
  margin-bottom: 16px;
}

.question-cell,
.answer-cell {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 80px;
  overflow: hidden;
}

.tags-cell {
  max-width: 150px;
}

.card-detail {
  padding: 16px;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section h4 {
  margin-bottom: 8px;
  font-weight: 600;
}

.detail-content {
  white-space: pre-wrap;
  word-break: break-word;
  background-color: var(--color-fill-2);
  padding: 12px;
  border-radius: 4px;
}

.question-content {
  border-left: 4px solid var(--color-primary);
}

.answer-content {
  border-left: 4px solid var(--color-success);
}

.detail-tags {
  margin-top: 8px;
}

:deep(.arco-table .arco-table-container) {
  border-radius: 4px;
}

:deep(.arco-tag) {
  margin: 2px;
}

:deep(.arco-form-item-label-col) {
  font-weight: 500;
}

:deep(.arco-table-th) {
  background-color: var(--color-fill-2);
  font-weight: 600;
}

.conflict-versions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}
</style>

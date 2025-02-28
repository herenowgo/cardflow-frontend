<template>
  <div id="workspaceView">
    <div class="page-header">
      <h2>我的分组</h2>
      <a-button type="primary" @click="showAddGroup">
        <template #icon>
          <icon-plus />
        </template>
        新建分组
      </a-button>
    </div>

    <div class="groups-grid">
      <!-- 新建分组卡片 -->
      <!--      <a-card class="group-card add-group" hoverable @click="showAddGroup">-->
      <!--        <div class="add-group-content">-->
      <!--          <icon-plus :style="{ fontSize: '32px' }" />-->
      <!--          <span>新建分组</span>-->
      <!--        </div>-->
      <!--      </a-card>-->

      <!-- 分组卡片列表 -->
      <a-card
        v-for="group in groups"
        :key="group"
        class="group-card"
        hoverable
        @click="goToGroupDetail(group)"
      >
        <div class="group-card-content">
          <div class="group-icon">
            <icon-folder :style="{ fontSize: '32px' }" />
          </div>
          <div class="group-info">
            <div class="group-name">{{ group }}</div>
          </div>
        </div>
      </a-card>
    </div>

    <!-- 新建分组对话框 -->
    <a-modal
      v-model:visible="groupModalVisible"
      title="新建分组"
      @ok="handleGroupSubmit"
      @cancel="groupModalVisible = false"
    >
      <a-form :model="{ name: newGroupName }">
        <a-form-item field="name" label="分组名称">
          <a-input v-model="newGroupName" placeholder="请输入分组名称" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Message } from "@arco-design/web-vue";
import { IconFolder, IconPlus } from "@arco-design/web-vue/es/icon";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import type { CardAddRequest } from "../../../generated/models/CardAddRequest";
import type { CardUpdateRequest } from "../../../generated/models/CardUpdateRequest";
import { CardControllerService } from "../../../generated/services/CardControllerService";
import { GroupControllerService } from "@backendApi/index";

// 接口定义
interface Card {
  id: string;
  question: string;
  answer: string;
  group?: string;
}

// 状态变量
const groups = ref<string[]>([]);
const cards = ref<Card[]>([]);
const currentGroup = ref<string>("");
const cardsLoading = ref(false);
const syncLoading = ref(false);

// 模态框状态
const cardModalVisible = ref(false);
const cardModalTitle = ref("新建卡片");
const groupModalVisible = ref(false);
const newGroupName = ref("");
const cardForm = ref<Card>({
  id: "",
  question: "",
  answer: "",
  group: "",
});
const isEditingCard = ref(false);

// 添加分页相关的状态
const currentPage = ref(1);
const pageSize = ref(12); // 每页显示12张卡片，适合网格布局
const total = ref(0);

// 加载分组列表
const loadGroups = async () => {
  try {
    const res = await GroupControllerService.getUserGroups();
    if (res.code === 200 && res.data) {
      groups.value = res.data;
    }
  } catch (error) {
    Message.error("加载分组失败");
  }
};

// 修改加载卡片列表的方法
const loadCards = async (group: string) => {
  if (!group) return;
  cardsLoading.value = true;
  try {
    const res = await CardControllerService.getUserGroupCardsWithPagination(
      group,
      currentPage.value - 1, // 后端从0开始计数
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

// 选择分组
const selectGroup = (group: string) => {
  currentGroup.value = group;
  loadCards(group);
};

// 显示新建分组对话框
const showAddGroup = () => {
  newGroupName.value = "";
  groupModalVisible.value = true;
};

// 提交新建分组
const handleGroupSubmit = async () => {
  if (!newGroupName.value.trim()) {
    Message.warning("请输入分组名称");
    return;
  }
  try {
    const res = await GroupControllerService.addGroup(newGroupName.value);
    if (res.code === 200) {
      Message.success("创建成功");
      groupModalVisible.value = false;
      loadGroups();
    }
  } catch (error) {
    Message.error("创建失败");
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
    group: "",
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
      // 更新卡片
      const updateParams: CardUpdateRequest = {
        id: cardForm.value.id,
        question: cardForm.value.question,
        answer: cardForm.value.answer,
        group: currentGroup.value,
      };
      const res = await CardControllerService.updateCard(updateParams);
      if (res.code === 200) {
        Message.success("更新成功");
        cardModalVisible.value = false;
        loadCards(currentGroup.value);
      }
    } else {
      // 创建卡片
      const addParams: CardAddRequest = {
        question: cardForm.value.question,
        answer: cardForm.value.answer,
        group: currentGroup.value,
      };
      const res = await CardControllerService.createCard(addParams);
      if (res.code === 200) {
        Message.success("创建成功");
        cardModalVisible.value = false;
        loadCards(currentGroup.value);
      }
    }
  } catch (error) {
    Message.error(isEditingCard.value ? "���新失败" : "创建失败");
  }
};

// 删除卡片
const deleteCard = async (card: any) => {
  try {
    const res = await CardControllerService.deleteCard(card.id);
    if (res.code === 200) {
      Message.success("删除成功");
      loadCards(currentGroup.value);
    }
  } catch (error) {
    Message.error("删除失败");
  }
};

// 同步到Anki
const syncWithAnki = async () => {
  syncLoading.value = true;
  try {
    const res = await CardControllerService.syncWithAnki();
    if (res.code === 200) {
      Message.success("同步成功");
    }
  } catch (error) {
    Message.error("同步失败");
  } finally {
    syncLoading.value = false;
  }
};

// 内容预览截断
const truncateContent = (content: string | undefined) => {
  if (!content) return "";
  return content.length > 50 ? content.slice(0, 50) + "..." : content;
};

// 添加页码改变的处理方法
const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadCards(currentGroup.value);
};

// 添加每页条数改变的处理方法
const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1; // 重置到第一页
  loadCards(currentGroup.value);
};

// 跳转到分组详情页面
const router = useRouter();
const goToGroupDetail = (group: string) => {
  router.push({
    name: "groupDetail",
    params: { group: encodeURIComponent(group) },
  });
};

// 获取分组中的卡片数量（可以通过接口获取或者缓存）
const getGroupCardCount = (group: string) => {
  // TODO: 实现获取分组卡片数量的逻辑
  return "0";
};

onMounted(() => {
  loadGroups();
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 16px;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 16px;
}

.group-card {
  height: 160px;
  transition: all 0.3s;
}

.group-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.add-group {
  border: 2px dashed var(--color-neutral-3);
  background-color: var(--color-fill-2);
}

.add-group:hover {
  border-color: var(--color-primary);
  background-color: var(--color-fill-3);
}

.add-group-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  color: var(--color-text-3);
}

.add-group:hover .add-group-content {
  color: var(--color-primary);
}

.group-card-content {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.group-icon {
  color: var(--color-primary);
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.group-stats {
  color: var(--color-text-3);
  font-size: 14px;
}
</style>

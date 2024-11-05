<template>
  <div id="editQuestionSolvingView">
    <div class="header">
      <h2>我的题解</h2>
      <a-button v-if="updatePage" status="danger" @click="showDeleteConfirm">
        <template #icon>
          <icon-delete />
        </template>
        删除题解
      </a-button>
    </div>
    <a-spin
      :loading="loading"
      tip="This may take a while..."
      id="editQuestionSolvingView"
    >
      <a-form :model="form" label-align="left">
        <a-form-item field="title" label="标题">
          <a-input v-model="form.title" placeholder="请输入标题" />
        </a-form-item>
        <a-form-item field="content" label="题解内容">
          <MdEditor :value="form.text" :handle-change="onContentChange" />
        </a-form-item>
        <div style="margin-top: 16px" />
        <a-form-item>
          <a-button type="primary" style="min-width: 200px" @click="doSubmit"
            >提交
          </a-button>
        </a-form-item>
      </a-form>
    </a-spin>

    <a-modal
      v-model:visible="deleteModalVisible"
      @cancel="cancelDelete"
      @ok="doDelete"
      simple
      :okButtonProps="{ status: 'danger' }"
      okText="确认删除"
      cancelText="取消"
    >
      <template #title>确认删除</template>
      <div>确定要删除这篇题解吗？此操作不可恢复。</div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, ref, defineEmits } from "vue";
import MdEditor from "@/components/MdEditor.vue";
import { QuestionSolvingControllerService } from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import { IconDelete } from "@arco-design/web-vue/es/icon";

const store = useStore();
let loading = ref(false);
const route = useRoute();
// 如果页面地址包含 update，视为更新页面
let updatePage = false;

// const questionId = defineProps({
//   questionId: { type: Number, default: 0 },
// });
const questionId = inject("questionId");
let form = ref({
  id: undefined as number | undefined,
  title: "",
  text: "",
  questionId: questionId,
});

/**
 * 根据题目 id 获取老的数据
 */
const loadData = async () => {
  if (!questionId) {
    return;
  }
  loading.value = true;
  const res =
    await QuestionSolvingControllerService.getQuestionSolvingUsingPost({
      questionId: questionId as number,
      userId: store.state.user.loginUser.id,
    });
  loading.value = false;
  if (String(res.code) === "200" && res.data) {
    updatePage = true;
    form.value = {
      id: res.data.id,
      title: res.data.title,
      text: res.data.text,
      questionId: questionId,
    };
  } else {
    updatePage = false;
    form.value = {
      id: undefined,
      title: "",
      text: "",
      questionId: questionId,
    };
  }
};

onMounted(() => {
  updatePage = false;
  form.value = {
    id: undefined,
    title: "",
    text: "",
    questionId: questionId,
  };
  loadData();
});

// 添加 emit 定义
const emit = defineEmits<{
  (e: "submit-success"): void;
}>();

const doSubmit = async () => {
  if (updatePage) {
    const updateRequest = {
      id: form.value.id,
      title: form.value.title,
      text: form.value.text,
      questionId: questionId,
    };
    const res =
      await QuestionSolvingControllerService.updateQuestionSolvingUsingPost(
        updateRequest
      );
    if (String(res.code) === "200") {
      message.success("更新成功");
      emit("submit-success");
      loadData();
    } else {
      message.error("更新失败，" + res.message);
    }
  } else {
    const addRequest = {
      title: form.value.title,
      text: form.value.text,
      questionId: questionId,
    };
    const res =
      await QuestionSolvingControllerService.addQuestionSolvingUsingPost(
        addRequest
      );
    if (String(res.code) === "200") {
      message.success("创建成功");
      emit("submit-success");
      loadData();
    } else {
      message.error("创建失败，" + res.message);
    }
  }
};

const onContentChange = (value: string) => {
  form.value.text = value;
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

// 执行删除操作
const doDelete = async () => {
  if (!form.value.id) {
    message.error("题解ID不存在");
    return;
  }

  try {
    const res =
      await QuestionSolvingControllerService.deleteQuestionSolvingUsingPost({
        id: form.value.id,
      });

    if (String(res.code) === "200") {
      message.success("删除成功");
      emit("submit-success");
      // 清空表单
      form.value = {
        id: undefined,
        title: "",
        text: "",
        questionId: questionId,
      };
      updatePage = false;
      deleteModalVisible.value = false;
    } else {
      message.error("删除失败：" + res.message);
    }
  } catch (error) {
    message.error("删除失败，请重试");
    console.error(error);
  }
};
</script>

<style scoped>
#editQuestionSolvingView {
  max-width: 1400px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

/* 让标题保持原有样式 */
.header h2 {
  margin: 0;
}
</style>

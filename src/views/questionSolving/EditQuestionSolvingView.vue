<template>
  <div id="editQuestionSolvingView">
    <h2>我的题解</h2>
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
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from "vue";
import MdEditor from "@/components/MdEditor.vue";
import { QuestionSolvingControllerService } from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import { useRoute } from "vue-router";
import { useStore } from "vuex";

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
  title: "",
  text: "",
  questionId: questionId,
});

/**
 * 根据题目 id 获取老的数据
 */
const loadData = async () => {
  if (questionId == 0 || questionId == null) {
    return;
  }
  loading.value = true;
  console.log("User" + store.state.user.loginUser.id);
  const res =
    await QuestionSolvingControllerService.getQuestionSolvingUsingPost({
      questionId: questionId as number,
      userId: store.state.user.loginUser.id,
    });
  loading.value = false;
  if (res.code === 0) {
    updatePage = true;
    form.value = res.data as any;
  } else {
    return;
  }
};

onMounted(() => {
  loadData();
});

const doSubmit = async () => {
  if (updatePage) {
    const res =
      await QuestionSolvingControllerService.updateQuestionSolvingUsingPost(
        form.value
      );
    if (String(res.code) === "200") {
      message.success("更新成功");
    } else {
      message.error("更新失败，" + res.message);
    }
  } else {
    const res =
      await QuestionSolvingControllerService.addQuestionSolvingUsingPost(
        form.value
      );
    if (String(res.code) === "200") {
      message.success("创建成功");
    } else {
      message.error("创建失败，" + res.message);
    }
    loadData();
  }
};

const onContentChange = (value: string) => {
  form.value.text = value;
};
</script>

<style scoped>
#editQuestionSolvingView {
  max-width: 1400px;
  //width: 100%;
}
</style>

<template>
  <div id="viewQuestionView">
    <a-row :gutter="[24, 24]">
      <a-col :md="12" :xs="24">
        <a-tabs default-active-key="question" lazy-load>
          <a-tab-pane key="question" title="题目">
            <a-card v-if="question" :title="question.title">
              <a-descriptions
                title="判题条件"
                :column="{ xs: 1, md: 2, lg: 3 }"
              >
                <a-descriptions-item label="时间限制">
                  {{ question.judgeConfig.timeLimit ?? 0 }}
                </a-descriptions-item>
                <a-descriptions-item label="内存限制">
                  {{ question.judgeConfig.memoryLimit ?? 0 }}
                </a-descriptions-item>
                <a-descriptions-item label="堆栈限制">
                  {{ question.judgeConfig.stackLimit ?? 0 }}
                </a-descriptions-item>
              </a-descriptions>
              <MdViewer :value="question.content || ''" />
              <template #extra>
                <a-space wrap>
                  <a-tag
                    v-for="(tag, index) of question.tags"
                    :key="index"
                    color="green"
                    >{{ tag }}
                  </a-tag>
                </a-space>
              </template>
            </a-card>
          </a-tab-pane>
          <a-tab-pane key="questionSolving" title="题解">
            <ViewQuestionSolvingView />
          </a-tab-pane>
          <a-tab-pane key="editQuestionSolving" title="写题解">
            <EditQuestionSolvingView />
          </a-tab-pane>
          <a-tab-pane key="answer" title="提交记录" disabled>
            暂时无法查看答案
          </a-tab-pane>
        </a-tabs>
      </a-col>
      <a-col :md="12" :xs="24">
        <a-form :model="form" layout="inline">
          <a-form-item
            field="language"
            label="编程语言"
            style="min-width: 240px"
          >
            <a-select
              v-model="form.language"
              :style="{ width: '320px' }"
              placeholder="选择编程语言"
            >
              <a-option>java</a-option>
              <a-option>cpp</a-option>
              <a-option>go</a-option>
            </a-select>
          </a-form-item>
        </a-form>
        <CodeEditor
          :value="form.code as string"
          :language="form.language"
          :handle-change="changeCode"
        />
        <a-divider size="0" />
        <a-button
          type="primary"
          style="min-width: 200px; float: right; margin-bottom: 20px"
          @click="doSubmit"
          :loading="submitLoading.value"
        >
          提交代码
        </a-button>
        <div v-if="isSubmited">
          <a-divider style="margin-bottom: 0; margin-top: 0"></a-divider>
          <a-space size="large">
            <h2>代码提交状态：</h2>
            <a-space v-if="submitStatus.status == 0">
              <h2 style="color: gray">判题中</h2>
              <a-spin :size="28" />
            </a-space>
            <a-space v-else>
              <h2 v-if="submitStatus.status == 3" style="color: red">
                {{ submitStatus.judgeInfo.message }}
              </h2>
              <h2
                v-else-if="
                  submitStatus.status == 2
                  // submitStatus.judgeInfo.message === 'Accepted'
                "
                style="color: green"
              >
                {{ submitStatus.judgeInfo.message }}
              </h2>
            </a-space>
          </a-space>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import {
  onMounted,
  ref,
  watchEffect,
  withDefaults,
  defineProps,
  onBeforeUnmount,
} from "vue";
import message from "@arco-design/web-vue/es/message";
import CodeEditor from "@/components/CodeEditor.vue";
import MdViewer from "@/components/MdViewer.vue";
import {
  QuestionControllerService,
  QuestionSubmitAddRequest,
  QuestionSubmitControllerService,
  QuestionVO,
} from "../../../generated";
import QuestionSolvingView from "@/views/questionSolving/ViewQuestionSolvingView.vue";
import EditQuestionSolvingView from "@/views/questionSolving/EditQuestionSolvingView.vue";
import { useRoute } from "vue-router";
import { provide } from "vue";
import ViewQuestionSolvingView from "@/views/questionSolving/ViewQuestionSolvingView.vue";

interface Props {
  id: string;
}

const route = useRoute();
const props = withDefaults(defineProps<Props>(), {
  id: () => "",
});

const questionId = route.params.id;
const question = ref<QuestionVO>();
provide("questionId", questionId);
const loadData = async () => {
  const res = await QuestionControllerService.getQuestionVoByIdUsingGet(
    props.id as any
  );
  if (res.code === 0) {
    question.value = res.data;
  } else {
    message.error("加载失败，" + res.message);
  }
};

const form = ref<QuestionSubmitAddRequest>({
  language: "java",
  code: "",
});

let isSubmited = ref(false);

let submitState = ref(0);

let submitStatus = ref({
  judgeInfo: {
    message: "判题中",
    memory: "",
    time: "",
  },
  status: 0,
});
let submitLoading = ref(false);
let timer: number | null | undefined = null;

const clearTimer = () => {
  if (timer != null) {
    window.clearInterval(timer);
  }
};
const getState = (questionSubmitId: number) => {
  clearTimer();
  // var that = this;
  // setInterval不会清除定时器队列，每重复执行1次都会导致定时器叠加 \
  timer = window.setInterval(() => {
    // setTimeout是自带清除定时器
    setTimeout(async function () {
      const state =
        await QuestionSubmitControllerService.getQuestionSubmitStateUsingGet(
          questionSubmitId
        );
      if (state != 0 && state != 1) {
        const res =
          await QuestionSubmitControllerService.getJudgeInformationUsingGet(
            questionSubmitId
          );
        if (res.code === 0) {
          submitStatus.value = res.data;
          // getState(res.data.id);
          console.log(submitStatus.value.judgeInfo.message);
          clearTimer();
          return;
          // clearInterval(this)          return;
        } else {
          // submitStatus.value.status = 3;
          // submitStatus.value.judgeInfo.message = "编译错误";
          clearTimer();
          return;
          // message.error("提交失败," + res.message);
        }
      }
      // submitStatus.value.status = state;
    }, 0);
  }, 500);
};
/**
 * 提交代码
 */
const doSubmit = async () => {
  if (form.value.code == null || form.value.code == "") {
    message.error("代码不能为空");
    return;
  }
  submitStatus.value.status = 0;
  isSubmited.value = true;
  if (!question.value?.id) {
    message.error("提交失败");
    return;
  }

  submitLoading.value = true;
  const res = await QuestionSubmitControllerService.doQuestionSubmitUsingPost({
    ...form.value,
    questionId: question.value.id,
  });
  // console.log("res" + JSON.stringify(res.data));
  submitLoading.value = false;
  if (res.code === 0) {
    message.success("提交成功");
    // submitStatus.value = res.data;
    // console.log("data!!:" + res.data);
    getState(res.data);
    // console.log(submitStatus.value.judgeInfo.message);
  } else {
    isSubmited.value = false;
    message.error(res.message);
    // submitStatus.value.status = 3;
    // submitStatus.value.judgeInfo.message = "编译错误";
    // message.error("提交失败," + res.message);
  }
};

/**
 * 页面加载时，请求数据
 */
onMounted(() => {
  // console.log(questionId);
  loadData();
});

onBeforeUnmount(() => {
  // 在组件销毁之前执行的逻辑
  clearTimer();
});

const changeCode = (value: string) => {
  form.value.code = value;
};
</script>

<style>
#viewQuestionView {
  max-width: 2400px;
  margin: 0 auto;
}

#viewQuestionView .arco-space-horizontal .arco-space-item {
  margin-bottom: 0 !important;
}
</style>

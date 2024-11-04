/* prettier-ignore */
<template>
  <div id="viewQuestionView">
    <a-row :gutter="[24, 24]">
      <a-col :span="12">
        <a-card
          v-if="question"
          :bodyStyle="{ height: 'calc(100vh - 200px)', overflow: 'auto' }"
        >
          <a-tabs v-model:activeKey="activeTabKey">
            <a-tab-pane key="1" title="题目描述">
              <a-descriptions
                title="判题条件"
                :column="{ xs: 1, md: 2, lg: 3 }"
                size="small"
              >
                <a-descriptions-item label="时间限制">
                  {{ question.judgeConfig?.timeLimit ?? 0 }}
                </a-descriptions-item>
                <a-descriptions-item label="内存限制">
                  {{ question.judgeConfig?.memoryLimit ?? 0 }}
                </a-descriptions-item>
                <a-descriptions-item label="堆栈限制">
                  {{ question.judgeConfig?.stackLimit ?? 0 }}
                </a-descriptions-item>
              </a-descriptions>
              <MdViewer :value="question.content || ''" />
            </a-tab-pane>
            <a-tab-pane key="2" title="题解">
              <ViewQuestionSolvingView :questionId="questionId" />
            </a-tab-pane>
            <!-- 新增AI建议标签页 -->
            <a-tab-pane key="3" title="AI建议">
              <a-spin v-if="!isSubmited">请先提交代码</a-spin>
              <template v-else>
                <a-collapse v-model:activeKey="activeCollapseKeys">
                  <a-collapse-item
                    v-for="(input, index) in submitStatus.judgeInfo.inputList"
                    :key="index"
                    :header="`测试用例 ${index + 1}`"
                  >
                    <a-spin :loading="aiLoading[index]" tip="AI正在思考中...">
                      <template v-if="aiSuggestions[index]">
                        <MdViewer :value="aiSuggestions[index]" />
                      </template>
                      <a-empty v-else description="暂无AI建议" />
                    </a-spin>
                  </a-collapse-item>
                </a-collapse>
              </template>
            </a-tab-pane>
          </a-tabs>
          <template #title>
            <div class="card-title">
              <span>{{ question.title }}</span>
              <a-space>
                <a-tag
                  v-for="(tag, index) of question.tags"
                  :key="index"
                  color="green"
                  >{{ tag }}
                </a-tag>
              </a-space>
            </div>
          </template>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card
          :bodyStyle="{
            height: 'calc(100vh - 200px)',
            display: 'flex',
            flexDirection: 'column',
          }"
        >
          <a-form :model="form" layout="inline" style="margin-bottom: 16px">
            <a-form-item
              field="language"
              label="编程语言"
              style="min-width: 240px"
            >
              <a-select
                v-model="form.language"
                :style="{ width: '320px' }"
                placeholder="选择编程语言"
                @change="handleLanguageChange"
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
            style="flex: 1; overflow: auto; margin-bottom: 16px"
          />
          <a-button
            type="primary"
            style="min-width: 200px; align-self: flex-end; margin-bottom: 16px"
            @click="doSubmit"
            :loading="submitLoading"
          >
            提交代码
          </a-button>
          <div v-if="isSubmited" style="overflow-y: auto">
            <a-result
              v-if="submitStatus.status != 0"
              :status="getResultStatus(submitStatus.status)"
              style="padding: 16px"
            >
              <template #icon>
                <icon-check-circle-fill
                  v-if="submitStatus.status === 2"
                  style="color: #00b42a; font-size: 48px"
                />
                <icon-close-circle-fill
                  v-else-if="submitStatus.status === 3"
                  style="color: #f53f3f; font-size: 48px"
                />
                <icon-exclamation-circle-fill
                  v-else
                  style="color: #ff7d00; font-size: 48px"
                />
              </template>
              <template #title>
                <span class="result-title">{{
                  getResultTitle(submitStatus.status)
                }}</span>
              </template>
              <template #subtitle>
                <span class="result-subtitle">{{
                  submitStatus.judgeInfo.message
                }}</span>
              </template>
              <template #extra>
                <a-space direction="vertical" size="medium" style="width: 100%">
                  <a-alert
                    v-if="submitStatus.judgeInfo.compileErrorOutput"
                    type="error"
                    title="编译错误"
                  >
                    <pre style="max-height: 100px; overflow: auto">{{
                      submitStatus.judgeInfo.compileErrorOutput
                    }}</pre>
                  </a-alert>
                  <template v-else>
                    <a-collapse>
                      <a-collapse-item
                        v-for="(input, index) in submitStatus.judgeInfo
                          .inputList"
                        :key="index"
                        :header="`测试用例 ${index + 1}`"
                      >
                        <a-descriptions :column="1" size="small" bordered>
                          <a-descriptions-item label="输入">
                            <pre>{{ input }}</pre>
                          </a-descriptions-item>
                          <a-descriptions-item label="输出">
                            <pre>{{
                              submitStatus.judgeInfo.runOutput?.[index]
                            }}</pre>
                          </a-descriptions-item>
                          <a-descriptions-item label="预期结果">
                            <pre>{{
                              submitStatus.judgeInfo.answers?.[index]
                            }}</pre>
                          </a-descriptions-item>
                        </a-descriptions>
                        <a-button
                          v-if="submitStatus.status === 3"
                          @click="getAiSuggestion(index)"
                          :loading="aiLoading[index]"
                          style="margin-top: 16px"
                        >
                          获取AI建议
                        </a-button>
                      </a-collapse-item>
                    </a-collapse>
                    <a-alert
                      v-if="submitStatus.judgeInfo.runErrorOutput"
                      type="error"
                      title="运行错误"
                    >
                      <pre style="max-height: 100px; overflow: auto">{{
                        submitStatus.judgeInfo.runErrorOutput
                      }}</pre>
                    </a-alert>
                    <a-descriptions :column="2" size="small" bordered>
                      <a-descriptions-item label="内存占用"
                        >{{
                          submitStatus.judgeInfo.memory
                        }}
                        KB</a-descriptions-item
                      >
                      <a-descriptions-item label="运行时间"
                        >{{
                          submitStatus.judgeInfo.time
                        }}
                        ms</a-descriptions-item
                      >
                    </a-descriptions>
                  </template>
                </a-space>
              </template>
            </a-result>
            <a-result v-else status="info" title="判题中" style="padding: 16px">
              <template #icon>
                <a-spin :size="48" />
              </template>
            </a-result>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import CodeEditor from "@/components/CodeEditor.vue";
import MdViewer from "@/components/MdViewer.vue";
import ViewQuestionSolvingView from "@/views/questionSolving/ViewQuestionSolvingView.vue";
import {
  IconCheckCircleFill,
  IconCloseCircleFill,
  IconExclamationCircleFill,
} from "@arco-design/web-vue/es/icon";
import message from "@arco-design/web-vue/es/message";
import {
  defineProps,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  withDefaults,
} from "vue";
import { useRoute } from "vue-router";
import {
  AiControllerService,
  QuestionControllerService,
  QuestionSubmitAddRequest,
  QuestionSubmitControllerService,
  QuestionSubmitStateVO,
  QuestionVO,
} from "../../../generated";

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
  if (String(res.code) === "200") {
    question.value = res.data;
    loadSavedCode();
  } else {
    message.error("加载失败，" + res.message);
  }
};

const form = ref<QuestionSubmitAddRequest>({
  language: "java",
  code: "",
});

// 添加加载保存的代码的函数
const loadSavedCode = () => {
  const savedCode = localStorage.getItem(`code_${questionId}`);
  const savedLanguage = localStorage.getItem(`language_${questionId}`);
  if (savedCode) {
    form.value.code = savedCode;
  }
  if (savedLanguage) {
    form.value.language = savedLanguage;
  }
};

let isSubmited = ref(false);

let submitState = ref(0);

let submitStatus = ref<QuestionSubmitStateVO>({
  judgeInfo: {
    message: "判题中",
    memory: 0,
    time: 0,
    compileErrorOutput: "",
    runOutput: [],
    runErrorOutput: "",
    inputList: [],
    answers: [],
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
  timer = window.setInterval(() => {
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
        if (String(res.code) === "200" && res.data) {
          submitStatus.value = {
            ...submitStatus.value,
            ...res.data,
            judgeInfo: {
              ...submitStatus.value.judgeInfo,
              ...res.data.judgeInfo,
            },
          };
          console.log(submitStatus.value.judgeInfo.message);
          clearTimer();
          return;
        } else {
          clearTimer();
          return;
        }
      }
    }, 0);
  }, 500);
};

// 添加一个新的 ref 来存储最后一次提交的 questionSubmitId
const lastSubmitId = ref<number | null>(null);

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
  submitLoading.value = false;
  if (String(res.code) === "200") {
    message.success("提交成功");
    lastSubmitId.value = res.data;
    getState(res.data);
  } else {
    isSubmited.value = false;
    message.error(res.message);
  }
};

/**
 * 页面加载时，请求数据
 */
onMounted(() => {
  // console.log(questionId);
  loadData();
  loadSavedCode(); // 加载保存的代码
});

onBeforeUnmount(() => {
  // 在组件销毁之前执行的逻辑
  clearTimer();
});

const changeCode = (value: string) => {
  form.value.code = value;
  // 保存代码到本地存储
  localStorage.setItem(`code_${questionId}`, value);
};

const handleLanguageChange = (value: string) => {
  form.value.language = value;
  // 保存语言选择到本地存储
  localStorage.setItem(`language_${questionId}`, value);
};

const getResultStatus = (status: number) => {
  switch (status) {
    case 2:
      return "success";
    case 3:
      return "error";
    default:
      return "warning";
  }
};

const getResultTitle = (status: number) => {
  switch (status) {
    case 2:
      return "ACCEPTED";
    case 3:
      return "WRONG ANSWER";
    default:
      return "COMPILATION ERROR";
  }
};

const aiLoading = ref<boolean[]>([]);
const aiSuggestions = ref<string[]>([]);

// 新增的响应式变量
const activeTabKey = ref("1");
const activeCollapseKeys = ref([]);

const getAiSuggestion = async (index: number) => {
  if (!lastSubmitId.value || submitStatus.value.status !== 3) {
    message.error("只有在答案错误时才能获取AI建议");
    return;
  }

  // 立即切换到AI建议标签页
  activeTabKey.value = "3";

  // 展开对应的折叠面板
  if (!activeCollapseKeys.value.includes(index)) {
    activeCollapseKeys.value.push(index);
  }

  aiLoading.value[index] = true;
  try {
    const res = await AiControllerService.analyzeErrorUsingPost(
      index,
      lastSubmitId.value
    );
    if (String(res.code) === "200" && res.data) {
      aiSuggestions.value[index] = res.data;
    } else {
      message.error("获取AI建议失败: " + res.message);
    }
  } catch (error) {
    message.error("获取AI建议时发生误");
    console.error(error);
  } finally {
    aiLoading.value[index] = false;
  }
};
</script>

<style>
#viewQuestionView {
  height: calc(100vh - 48px);
  padding: 24px;
  box-sizing: border-box;
}

.result-title {
  font-size: 28px;
  font-weight: bold;
  text-transform: uppercase;
}

.result-subtitle {
  font-size: 18px;
  color: var(--color-text-2);
}

.arco-result {
  padding: 16px;
  background-color: var(--color-bg-2);
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.arco-result-icon {
  font-size: 48px !important;
}

.arco-result-title {
  margin-top: 16px;
}

.arco-result-subtitle {
  margin-top: 8px;
}

#viewQuestionView pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.arco-collapse-item-header {
  font-weight: bold;
}

.arco-descriptions-item-label {
  font-weight: bold;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.arco-tabs-content {
  height: calc(100% - 40px);
  overflow: auto;
}

.arco-alert pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 可以添加一些新的样式来美化AI建议的展示 */
.ai-suggestion-tab {
  padding: 16px;
}

.ai-suggestion-tab .arco-collapse {
  margin-top: 16px;
}

.ai-suggestion-tab .arco-alert {
  margin-top: 16px;
}

/* 可以添加一些新的样式来美化AI建议的Markdown展示 */
.ai-suggestion-tab .arco-collapse-content {
  padding: 16px;
}

.ai-suggestion-tab .md-viewer {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
}

.arco-spin {
  display: block;
  min-height: 200px;
}

.arco-spin-dot {
  width: 40px;
  height: 40px;
}

.arco-spin-tip {
  font-size: 16px;
  color: var(--color-text-2);
}
</style>

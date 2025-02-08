/* prettier-ignore */
<template>
  <div id="viewQuestionView">
    <a-split v-model:size="horizontalSplitSize" style="height: 100vh">
      <!-- 左侧题目区域 -->
      <template #first>
        <a-card
          v-if="question"
          :bodyStyle="{
            height: 'calc(100vh - 48px)',
            overflow: 'auto',
          }"
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
              <div class="solving-header">
                <a-button
                  type="primary"
                  @click="showSolvingEditor = true"
                  v-if="!showSolvingEditor"
                >
                  <template #icon>
                    <icon-edit />
                  </template>
                  写题解
                </a-button>
                <a-button @click="showSolvingEditor = false" v-else>
                  <template #icon>
                    <icon-left />
                  </template>
                  返回题解列表
                </a-button>
              </div>

              <div v-if="showSolvingEditor">
                <EditQuestionSolvingView
                  :questionId="questionId"
                  @submit-success="onSolvingSubmitted"
                />
              </div>
              <div v-else>
                <ViewQuestionSolvingView :questionId="questionId" />
              </div>
            </a-tab-pane>
            <!-- 新增AI建议标签页 -->
            <a-tab-pane key="3" title="AI建议">
              <a-spin v-if="!isSubmited || !submitStatus?.judgeInfo?.inputList">
                请先提交代码
              </a-spin>
              <template v-else>
                <a-collapse v-model:activeKey="activeCollapseKeys">
                  <a-collapse-item
                    v-for="(input, index) in submitStatus?.judgeInfo?.inputList"
                    :key="index"
                    :header="`测试用例 ${index + 1}`"
                  >
                    <template #extra>
                      <a-button
                        type="text"
                        size="small"
                        :loading="aiLoading[index]"
                        @click.stop="getAiSuggestion(index)"
                      >
                        获取AI建议
                      </a-button>
                    </template>

                    <!-- 使用 StreamingMarkdown 组件 -->
                    <StreamingMarkdown
                      v-if="aiLoading[index] || aiSuggestions[index]"
                      :requestId="currentRequestIds[index]"
                      :initialContent="aiSuggestions[index]"
                      :loading="aiLoading[index]"
                      show-header
                      show-robot-icon
                      title="AI 分析建议"
                      @update="(content) => updateAiSuggestion(index, content)"
                      @complete="() => onAiSuggestionComplete(index)"
                      @error="(error) => handleAiSuggestionError(error, index)"
                    />
                  </a-collapse-item>
                </a-collapse>
              </template>
            </a-tab-pane>
            <!-- 新增提交记录标签页 -->
            <a-tab-pane key="4" title="提交记录">
              <a-table
                :columns="submitRecordColumns"
                :data="submitRecords"
                :pagination="{
                  total: submitRecordTotal,
                  current: submitRecordCurrent,
                  pageSize: submitRecordPageSize,
                  showTotal: true,
                }"
                @page-change="onSubmitRecordPageChange"
                :loading="submitRecordLoading"
                @row-click="onRecordClick"
              >
                <template #status="{ record }">
                  <a-tag
                    :color="getStatusColor(record.status, record.judgeInfo)"
                  >
                    {{ getStatusText(record.status, record.judgeInfo) }}
                  </a-tag>
                </template>
                <template #language="{ record }">
                  <a-tag>{{ record.language }}</a-tag>
                </template>
                <template #judgeInfo="{ record }">
                  <span>{{
                    `耗时:${record.judgeInfo?.time}ms 内存:${record.judgeInfo?.memory}KB`
                  }}</span>
                </template>
                <template #createTime="{ record }">
                  {{ record.createTime?.replace("T", " ").split(".")[0] }}
                </template>
              </a-table>
            </a-tab-pane>
            <!-- 动态添加的提交详情标签页 -->
            <a-tab-pane
              v-if="recordDetail"
              :key="'submit-' + recordDetail.id"
              title="提交详情"
              :closable="true"
              @close="closeSubmitDetail"
            >
              <div class="submit-detail-container">
                <a-result :status="getResultStatus(recordDetail.status)">
                  <template #icon>
                    <icon-check-circle-fill
                      v-if="recordDetail.status === 2"
                      style="color: #00b42a; font-size: 48px"
                    />
                    <icon-close-circle-fill
                      v-else-if="recordDetail.status === 3"
                      style="color: #f53f3f; font-size: 48px"
                    />
                    <icon-exclamation-circle-fill
                      v-else
                      style="color: #ff7d00; font-size: 48px"
                    />
                  </template>
                  <template #title>
                    <span class="result-title">{{
                      getResultTitle(recordDetail.status)
                    }}</span>
                  </template>
                  <template #subtitle>
                    <span class="result-subtitle">{{
                      recordDetail.judgeInfo?.message
                    }}</span>
                  </template>
                </a-result>

                <a-descriptions
                  :column="2"
                  bordered
                  size="small"
                  class="submit-info"
                >
                  <a-descriptions-item label="提交时间">
                    {{
                      recordDetail.createTime?.replace("T", " ").split(".")[0]
                    }}
                  </a-descriptions-item>
                  <a-descriptions-item label="编程语言">
                    <a-tag>{{ recordDetail.language }}</a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item label="执行用时">
                    {{ recordDetail.judgeInfo?.time }} ms
                  </a-descriptions-item>
                  <a-descriptions-item label="内存消耗">
                    {{ recordDetail.judgeInfo?.memory }} KB
                  </a-descriptions-item>
                </a-descriptions>

                <!-- 测试用例结果 -->
                <div
                  v-if="recordDetail.judgeInfo?.inputList?.length"
                  class="test-cases"
                >
                  <div class="section-title">测试用例</div>
                  <a-collapse>
                    <a-collapse-item
                      v-for="(input, index) in recordDetail.judgeInfo.inputList"
                      :key="index"
                      :header="`测试用例 ${index + 1}`"
                    >
                      <a-descriptions :column="1" bordered size="small">
                        <a-descriptions-item label="输入">
                          <pre>{{ input }}</pre>
                        </a-descriptions-item>
                        <a-descriptions-item label="输出">
                          <pre>{{
                            recordDetail.judgeInfo.runOutput?.[index]
                          }}</pre>
                        </a-descriptions-item>
                        <a-descriptions-item label="预期结果">
                          <pre>{{
                            recordDetail.judgeInfo.answers?.[index]
                          }}</pre>
                        </a-descriptions-item>
                      </a-descriptions>
                    </a-collapse-item>
                  </a-collapse>
                </div>

                <!-- 代码展示 -->
                <div class="code-section">
                  <div class="section-title">提交的代码</div>
                  <CodeEditor
                    :value="recordDetail.code || ''"
                    :language="recordDetail.language?.toLowerCase()"
                    :readonly="true"
                    style="height: 400px; margin-top: 8px"
                  />
                </div>
              </div>
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
      </template>

      <!-- 右侧答题区域 -->
      <template #second>
        <a-card
          :bodyStyle="{
            height: 'calc(100vh - 48px)',
            padding: 0,
          }"
        >
          <!-- 根据是否有结果切换布局 -->
          <template v-if="hasInteracted">
            <a-split
              v-model:size="splitSize"
              direction="vertical"
              min="200px"
              max="800px"
              style="height: 100%"
            >
              <!-- 上半部分代码编辑区域 -->
              <template #first>
                <div
                  style="
                    height: 100%;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                  "
                >
                  <div class="code-header">
                    <a-form :model="form" layout="inline">
                      <a-form-item
                        field="language"
                        label="编程语言"
                        style="margin-bottom: 0"
                      >
                        <a-select
                          v-model="form.language"
                          :style="{ width: '200px' }"
                          placeholder="选择编程语言"
                          @change="handleLanguageChange"
                        >
                          <a-option>java</a-option>
                          <a-option>cpp</a-option>
                          <a-option>go</a-option>
                        </a-select>
                      </a-form-item>
                    </a-form>
                    <div class="code-actions">
                      <a-button
                        :loading="debugLoading"
                        @click="() => handleDebugCode(true)"
                        style="margin-right: 8px"
                      >
                        调试代码
                      </a-button>
                      <a-button
                        type="primary"
                        @click="doSubmit"
                        :loading="submitLoading"
                      >
                        提交答案
                      </a-button>
                    </div>
                  </div>
                  <CodeEditor
                    :value="form.code as string"
                    :language="form.language"
                    :handle-change="changeCode"
                    style="flex: 1; overflow: auto; margin: 16px 0"
                  />
                </div>
              </template>

              <!-- 下半部分结果展示区域 -->
              <template #second>
                <div style="height: 100%; overflow: auto; padding: 16px">
                  <!-- 提交结果显示 -->
                  <div v-if="isSubmited">
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
                        <a-space
                          direction="vertical"
                          size="medium"
                          style="width: 100%"
                        >
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
                            <div class="test-cases-container">
                              <div class="test-cases-header">
                                <div class="test-cases-buttons">
                                  <a-button-group>
                                    <a-button
                                      v-for="(input, index) in submitStatus
                                        .judgeInfo.inputList"
                                      :key="index"
                                      :type="
                                        selectedCase === index
                                          ? 'primary'
                                          : 'outline'
                                      "
                                      :status="getCaseStatus(index)"
                                      @click="selectTestCase(index)"
                                    >
                                      测试用例 {{ index + 1 }}
                                    </a-button>
                                  </a-button-group>
                                </div>
                              </div>

                              <div class="test-case-details">
                                <template v-if="selectedCase !== null">
                                  <a-descriptions
                                    :column="1"
                                    size="small"
                                    bordered
                                  >
                                    <a-descriptions-item label="输入">
                                      <pre>{{
                                        submitStatus.judgeInfo.inputList[
                                          selectedCase
                                        ]
                                      }}</pre>
                                    </a-descriptions-item>
                                    <a-descriptions-item label="输出">
                                      <pre>{{
                                        submitStatus.judgeInfo.runOutput?.[
                                          selectedCase
                                        ]
                                      }}</pre>
                                    </a-descriptions-item>
                                    <a-descriptions-item label="预期结果">
                                      <pre>{{
                                        submitStatus.judgeInfo.answers?.[
                                          selectedCase
                                        ]
                                      }}</pre>
                                    </a-descriptions-item>
                                  </a-descriptions>
                                  <a-button
                                    v-if="submitStatus.status === 3"
                                    @click="getAiSuggestion(selectedCase)"
                                    :loading="aiLoading[selectedCase]"
                                    style="margin-top: 16px"
                                  >
                                    获取AI建议
                                  </a-button>
                                </template>
                                <a-empty v-else description="请选择测试用例" />
                              </div>
                            </div>

                            <a-alert
                              v-if="submitStatus.judgeInfo.runErrorOutput"
                              type="error"
                              title="运行错"
                              style="margin-top: 16px"
                            >
                              <pre style="max-height: 100px; overflow: auto">{{
                                submitStatus.judgeInfo.runErrorOutput
                              }}</pre>
                            </a-alert>

                            <a-descriptions
                              :column="2"
                              size="small"
                              bordered
                              style="margin-top: 16px"
                            >
                              <a-descriptions-item label="内存占用"
                                >{{ submitStatus.judgeInfo.memory }}
                                KB
                              </a-descriptions-item>
                              <a-descriptions-item label="运行时间"
                                >{{ submitStatus.judgeInfo.time }}
                                ms
                              </a-descriptions-item>
                            </a-descriptions>
                          </template>
                        </a-space>
                      </template>
                    </a-result>
                    <a-result v-else status="info" class="judging-result">
                      <template #icon>
                        <div class="judging-animation">
                          <a-spin :size="48" dot>
                            <template #icon>
                              <icon-loading
                                style="
                                  font-size: 48px;
                                  color: rgb(var(--primary-6));
                                "
                              />
                            </template>
                          </a-spin>
                        </div>
                      </template>
                      <template #title>
                        <span class="judging-title">判题中</span>
                      </template>
                      <template #subtitle>
                        <span class="judging-subtitle"
                          >正在评测您的代码，请稍候...</span
                        >
                      </template>
                    </a-result>
                  </div>
                  <!-- 调试结果显示 -->
                  <div v-else>
                    <!-- 添加调试加载状态 -->
                    <a-result
                      v-if="debugLoading"
                      status="info"
                      class="judging-result"
                    >
                      <template #icon>
                        <div class="judging-animation">
                          <a-spin :size="48" dot>
                            <template #icon>
                              <icon-loading
                                style="
                                  font-size: 48px;
                                  color: rgb(var(--primary-6));
                                "
                              />
                            </template>
                          </a-spin>
                        </div>
                      </template>
                      <template #title>
                        <span class="judging-title">调试中</span>
                      </template>
                      <template #subtitle>
                        <span class="judging-subtitle"
                          >正在调试您的代码，请稍候...</span
                        >
                      </template>
                    </a-result>
                    <!-- 试结果内容 -->
                    <div v-else-if="debugResult">
                      <a-result status="info" style="padding: 16px">
                        <template #icon>
                          <icon-code style="color: #165dff; font-size: 48px" />
                        </template>
                        <template #title>
                          <span class="result-title">调试结果</span>
                        </template>
                        <template #subtitle>
                          <span
                            v-if="debugResult.compileErrorOutput"
                            class="result-subtitle"
                            >编译错误</span
                          >
                          <span v-else class="result-subtitle">执行完成</span>
                        </template>
                        <template #extra>
                          <a-space
                            direction="vertical"
                            size="medium"
                            style="width: 100%"
                          >
                            <!-- 编译错误信息 -->
                            <a-alert
                              v-if="debugResult.compileErrorOutput"
                              type="error"
                              title="编译错误"
                            >
                              <pre
                                style="
                                  max-height: 100px;
                                  overflow: auto;
                                  text-align: left;
                                "
                                >{{ debugResult.compileErrorOutput }}</pre
                              >
                            </a-alert>
                            <!-- 运行结果 -->
                            <div class="debug-cases-container">
                              <div class="debug-cases-content">
                                <a-descriptions
                                  :column="1"
                                  bordered
                                  size="small"
                                >
                                  <a-descriptions-item label="输入">
                                    <a-textarea
                                      v-model="debugTestCase"
                                      :auto-size="{ minRows: 2, maxRows: 6 }"
                                      placeholder="在这里输入测试用例，点击上方调试按钮运行"
                                      allow-clear
                                      class="debug-input"
                                    >
                                      <template #suffix>
                                        <a-tooltip
                                          content="修改输入后需点击调按钮重新运行"
                                        >
                                          <icon-info-circle
                                            style="color: var(--color-text-3)"
                                          />
                                        </a-tooltip>
                                      </template>
                                    </a-textarea>
                                  </a-descriptions-item>
                                  <a-descriptions-item label="输出">
                                    <pre class="debug-output">{{
                                      debugResult.runOutput?.[0]
                                    }}</pre>
                                  </a-descriptions-item>
                                  <a-descriptions-item
                                    v-if="debugResult.runErrorOutput?.[0]"
                                    label="错误输出"
                                  >
                                    <pre class="debug-error">{{
                                      debugResult.runErrorOutput[0]
                                    }}</pre>
                                  </a-descriptions-item>
                                </a-descriptions>
                                <a-descriptions
                                  :column="2"
                                  bordered
                                  size="small"
                                  style="margin-top: 16px"
                                >
                                  <a-descriptions-item label="执行用时">
                                    {{ debugResult.time?.[0] }} ms
                                  </a-descriptions-item>
                                  <a-descriptions-item label="内存消耗">
                                    {{ debugResult.memory?.[0] ?? 0 }} KB
                                  </a-descriptions-item>
                                </a-descriptions>
                              </div>
                            </div>
                          </a-space>
                        </template>
                      </a-result>
                    </div>
                  </div>
                </div>
              </template>
            </a-split>
          </template>

          <!-- 初始状态只显示编辑器 -->
          <template v-else>
            <div
              style="
                height: 100%;
                padding: 16px;
                display: flex;
                flex-direction: column;
              "
            >
              <div class="code-header">
                <a-form :model="form" layout="inline">
                  <a-form-item
                    field="language"
                    label="编程语言"
                    style="margin-bottom: 0"
                  >
                    <a-select
                      v-model="form.language"
                      :style="{ width: '200px' }"
                      placeholder="选择编程语言"
                      @change="handleLanguageChange"
                    >
                      <a-option>java</a-option>
                      <a-option>cpp</a-option>
                      <a-option>go</a-option>
                    </a-select>
                  </a-form-item>
                </a-form>
                <div class="code-actions">
                  <a-button
                    :loading="debugLoading"
                    @click="() => handleDebugCode(true)"
                    style="margin-right: 8px"
                  >
                    调试代码
                  </a-button>
                  <a-button
                    type="primary"
                    @click="doSubmit"
                    :loading="submitLoading"
                  >
                    提交答案
                  </a-button>
                </div>
              </div>
              <CodeEditor
                :value="form.code as string"
                :language="form.language"
                :handle-change="changeCode"
                style="flex: 1; overflow: auto; margin: 16px 0"
              />
            </div>
          </template>
        </a-card>
      </template>
    </a-split>
  </div>
</template>

<script setup lang="ts">
import {
  defineAsyncComponent,
  ref,
  onMounted,
  watch,
  defineProps,
  onBeforeUnmount,
  provide,
  withDefaults,
} from "vue";
import MdViewer from "@/components/MdViewer.vue";
import ViewQuestionSolvingView from "@/views/questionSolving/ViewQuestionSolvingView.vue";
import EditQuestionSolvingView from "@/views/questionSolving/EditQuestionSolvingView.vue";
import {
  IconCheckCircleFill,
  IconCloseCircleFill,
  IconEdit,
  IconExclamationCircleFill,
  IconLeft,
} from "@arco-design/web-vue/es/icon";
import message from "@arco-design/web-vue/es/message";
import { useRoute } from "vue-router";
import {
  AiControllerService,
  QuestionControllerService,
  QuestionSubmitAddRequest,
  QuestionSubmitControllerService,
  QuestionVO,
} from "../../../generated";
import { eventStreamService } from "@/services/EventStreamService";
import { ChatControllerService } from "../../../generated/services/ChatControllerService";
import StreamingMarkdown from "@/components/StreamingMarkdown.vue";

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

let submitStatus = ref<any>({
  status: 0,
  judgeInfo: {
    message: "",
    memory: 0,
    time: 0,
    inputList: [],
    runOutput: [],
    answers: [],
  },
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

// 添加一个新的响应式变量来存储最后一次提交的完整信息
const lastSubmitInfo = ref<{
  requestId: string;
  questionSubmitId: number;
} | null>(null);

/**
 * 提交代码
 */
const doSubmit = async () => {
  // 设置已交互状态
  hasInteracted.value = true;
  // 清除调试结果显示
  debugResult.value = null;
  debugTestCase.value = "";
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
  try {
    const res = await QuestionSubmitControllerService.doQuestionSubmit({
      ...form.value,
      questionId: question.value.id,
    });

    if (String(res.code) === "200" && res.data) {
      // 保存完整的提交信息
      lastSubmitInfo.value = {
        requestId: res.data.requestId,
        questionSubmitId: res.data.questionSubmitId,
      };

      // 等待SSE返回结果
      const judgeResult = await eventStreamService.waitForResult(
        res.data.requestId
      );

      // 更新提交状态
      submitStatus.value = {
        status: getSubmitStatus(judgeResult.message),
        judgeInfo: {
          message: judgeResult.message,
          memory: judgeResult.memory,
          time: judgeResult.time,
          inputList: judgeResult.inputList,
          runOutput: judgeResult.runOutput,
          answers: judgeResult.answers,
          compileErrorOutput: judgeResult.compileErrorOutput,
          runErrorOutput: judgeResult.runErrorOutput,
        },
      };
    } else {
      message.error("提交失败：" + res.message);
    }
  } catch (error) {
    if (error instanceof Error) {
      message.error("提交失败：" + error.message);
    } else {
      message.error("提交失败，请重试");
    }
    console.error(error);
  } finally {
    submitLoading.value = false;
  }
};

// 添加一个新的辅助函数来根据 message 判断状态
const getSubmitStatus = (message: string): number => {
  switch (message) {
    case "Accepted":
      return 2; // 通过
    case "编译错误":
      return 3; // 失败
    case "Wrong Answer":
      return 3; // 失败
    default:
      return 3; // 其他情况都视为失败
  }
};

/**
 * 页面加载时，请求数据
 */
onMounted(() => {
  // console.log(questionId);
  loadData();
  loadSavedCode(); // 加载保存的代码
  // 默认选中第一个测试用例
  selectedCase.value = 0;
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
  // 保存语言选择框的值到本地存储
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
    case 0:
      return "等待判题";
    case 1:
      return "判题中";
    case 2:
      return "通过";
    case 3:
      return submitStatus.value.judgeInfo.message || "失败";
    default:
      return "未知状态";
  }
};

const aiLoading = ref<boolean[]>([]);
const aiSuggestions = ref<string[]>([]);

// 新增响应式变量
const activeTabKey = ref("1");
const activeCollapseKeys = ref<number[]>([]);

// 添加一个方法来生成唯一的 ID
const getAiSuggestionId = (index: number) => `ai-suggestion-${index}`;

// 修改 getAiSuggestion 方法
const getAiSuggestion = async (index: number) => {
  if (submitStatus.value.judgeInfo.message == "Accepted") {
    message.error("只有在答案错误时才能获取AI建议");
    return;
  }

  if (!lastSubmitInfo.value?.questionSubmitId) {
    message.error("请先提交代码");
    return;
  }

  // 立即切换到AI建议签页
  activeTabKey.value = "3";

  // 展开对应的折叠面板
  if (!activeCollapseKeys.value.includes(index)) {
    activeCollapseKeys.value.push(index);
  }

  aiLoading.value[index] = true;
  aiSuggestions.value[index] = ""; // 清空之前的建议

  try {
    const res = await ChatControllerService.analysisUserCode({
      index,
      questionSubmitId: lastSubmitInfo.value.questionSubmitId,
    });

    if (String(res.code) === "200" && res.data) {
      currentRequestIds.value[index] = res.data; // 只设置对应索引的 requestId
    } else {
      message.error("获取AI建议失败: " + res.message);
      aiLoading.value[index] = false;
    }
  } catch (error) {
    handleAiSuggestionError(error, index);
  }
};

// 添加新的响应式变量
const selectedCase = ref<number | null>(null);

// 添加新的法
const selectTestCase = (index: number) => {
  selectedCase.value = index;
};

const getCaseStatus = (index: number): "success" | "danger" | "normal" => {
  if (submitStatus.value.status !== 3) {
    return "success";
  }
  const output = submitStatus.value.judgeInfo.runOutput?.[index];
  const expected = submitStatus.value.judgeInfo.answers?.[index];
  return output === expected ? "success" : "danger";
};

// 提交记录相关的响应式变量
const submitRecords = ref<any[]>([]);
const submitRecordTotal = ref(0);
const submitRecordCurrent = ref(1);
const submitRecordPageSize = ref(10);
const submitRecordLoading = ref(false);

// 提交记录表格列定义
const submitRecordColumns = [
  {
    title: "状态",
    slotName: "status",
    width: 120,
    align: "center",
  },
  {
    title: "语言",
    slotName: "language",
    width: 120,
    align: "center",
  },
  {
    title: "执行信息",
    slotName: "judgeInfo",
    width: 240,
    align: "center",
  },
  {
    title: "提交时间",
    slotName: "createTime",
    width: 200,
    align: "center",
  },
];

// 加载提交记录数
const loadSubmitRecords = async () => {
  submitRecordLoading.value = true;
  try {
    const res = await QuestionSubmitControllerService.listQuestionSubmitRecord(
      String(questionId),
      submitRecordCurrent.value,
      submitRecordPageSize.value
    );
    if (String(res.code) === "200" && res.data?.records) {
      submitRecords.value = res.data.records;
      submitRecordTotal.value = Number(res.data.total || 0);
    } else {
      message.error("加载提交记录失败：" + res.message);
    }
  } catch (error) {
    message.error("加载提交记录失败");
    console.error(error);
  } finally {
    submitRecordLoading.value = false;
  }
};

// 交记分页改变处理
const onSubmitRecordPageChange = (page: number) => {
  submitRecordCurrent.value = page;
  loadSubmitRecords();
};

// 获取状态对应的颜色
const getStatusColor = (status: number, judgeInfo?: any) => {
  // 据 message 判断状态颜色
  if (judgeInfo?.message) {
    switch (judgeInfo.message) {
      case "Accepted":
        return "green";
      case "Wrong Answer":
        return "red";
      case "编译错误":
        return "orange";
      default:
        return "red";
    }
  }

  // 默认的状态颜色映射
  switch (status) {
    case 0:
      return "blue";
    case 1:
      return "blue";
    case 2:
      return "green";
    case 3:
    case 4:
      return "red";
    default:
      return "grey";
  }
};

// 修改状态文本获取函数
const getStatusText = (status: number, judgeInfo?: any) => {
  // 如果有 judgeInfo 且包含 message，优先使用 message 的映射
  if (judgeInfo?.message) {
    switch (judgeInfo.message) {
      case "Accepted":
        return "通过";
      case "Wrong Answer":
        return "答案错误";
      case "编译错误":
        return "编译错误";
      case "Runtime Error":
        return "运行错误";
      case "Time Limit Exceeded":
        return "超时";
      case "Memory Limit Exceeded":
        return "内存超限";
      default:
        return judgeInfo.message;
    }
  }

  // 否则使用默认的状态映射
  switch (status) {
    case 0:
      return "等待判题";
    case 1:
      return "判题中";
    case 2:
      return "通过";
    case 3:
      return "失败";
    case 4:
      return "编译错误";
    default:
      return "未知状态";
  }
};

// 监听标签页切换
watch(activeTabKey, (newKey) => {
  if (newKey === "4") {
    loadSubmitRecords();
  }
});

const recordDetailVisible = ref(false);
const recordDetailLoading = ref(false);
const recordDetail = ref<any>(null);

// 点击记录行的处理函数
const onRecordClick = async (record: any) => {
  try {
    const res = await QuestionSubmitControllerService.getQuestionSubmitInfo(
      record.id
    );
    if (String(res.code) === "200") {
      recordDetail.value = res.data;
      if (typeof recordDetail.value.judgeInfo === "string") {
        recordDetail.value.judgeInfo = JSON.parse(recordDetail.value.judgeInfo);
      }
      // 切换到新的标签页
      activeTabKey.value = "submit-" + record.id;
    } else {
      message.error("获取提交详情失败：" + res.message);
    }
  } catch (error) {
    message.error("获取提交详情失败");
    console.error(error);
  }
};

// 关闭提交详情标签页
const closeSubmitDetail = () => {
  recordDetail.value = null;
  // 切换回提交记录标签页
  activeTabKey.value = "4";
};

// 在 script 部分添加新的响应式变量
const code = ref(""); // 用户编写的代码
const language = ref("java"); // 编程语言
const debugVisible = ref(false);
const debugLoading = ref(false);
const debugTestCase = ref(""); // 用户输入的测试用例
const debugResult = ref<any>({});

// 添加新的响应式变量
const hasInteracted = ref(false);

// 修改调试代码的方法
const handleDebugCode = async (useCurrentTestCase = false) => {
  // 设置已交互状态
  hasInteracted.value = true;
  // 清除提交结果显示
  isSubmited.value = false;
  // 设置加载状态
  debugLoading.value = true;
  // 清空调试结果但保持对象结构
  debugResult.value = {};

  try {
    // 发送调试请求获取请求ID
    const res = await QuestionSubmitControllerService.debugCode({
      code: form.value.code,
      language: form.value.language,
      questionId: String(questionId),
      testCase: useCurrentTestCase ? debugTestCase.value : undefined,
    });

    if (String(res.code) === "200" && res.data) {
      const requestId = res.data;

      // 等待SSE返回结果
      const judgeResult = await eventStreamService.waitForResult(requestId);

      // 更新调试结果
      debugResult.value = judgeResult;
      if (judgeResult.testCase) {
        debugTestCase.value = judgeResult.testCase;
      }
    } else {
      message.error("调试失败" + res.message);
    }
  } catch (error) {
    if (error instanceof Error) {
      message.error("调试失败：" + error.message);
    } else {
      message.error("调试失败，请重试");
    }
    console.error(error);
  } finally {
    debugLoading.value = false;
  }
};

// 添加分割比例的响应式变量
const splitSize = ref(0.6); // 默认上半部分占60%

// 添加水平分割比例的响应式变量
const horizontalSplitSize = ref(0.5); // 默认左右各占50%

// 添加 ref 控制编辑器的显示状态
const showSolvingEditor = ref(false);

// 修改 onSolvingSubmitted 函数
const onSolvingSubmitted = () => {
  // 移除自动返回的逻辑
  // showSolvingEditor.value = false;
};

const currentRequestIds = ref<string[]>([]);

const updateAiSuggestion = (index: number, content: string) => {
  aiSuggestions.value[index] = content;
};

const onAiSuggestionComplete = (index: number) => {
  aiLoading.value[index] = false;
  currentRequestIds.value[index] = "";
};

const handleAiSuggestionError = (error: any, index: number) => {
  message.error("获取AI建议失败");
  console.error(error);
  aiLoading.value[index] = false;
};

// 异步加载CodeEditor组件
const CodeEditor = defineAsyncComponent(
  () => import("@/components/CodeEditor.vue")
);
</script>

<style>
#viewQuestionView {
  height: 100vh;
  padding: 24px;
  padding-bottom: 0;
  box-sizing: border-box;
  background-color: var(--color-bg-1);
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

/* 可以加一些新的样式来美化AI建议的展示 */
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

.test-cases-container {
  background-color: var(--color-bg-2);
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.test-cases-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.test-cases-buttons {
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 8px;
}

.test-cases-buttons .arco-btn {
  margin-right: 8px;
}

.test-case-details {
  padding: 16px;
}

.test-case-details pre {
  margin: 0;
  padding: 8px;
  background-color: var(--color-fill-2);
  border-radius: 4px;
}

.judging-animation {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  position: relative;
}

.judging-animation .arco-spin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-height: unset;
}

.judging-animation .arco-spin-icon {
  display: flex;
  justify-content: center;
  align-items: center;
}

.judging-title {
  font-size: 24px;
  font-weight: 500;
  color: var(--color-text-1);
  margin: 16px 0 8px;
}

.judging-subtitle {
  font-size: 16px;
  color: var(--color-text-3);
}

/* 修改结果展示容器的样式 */
.arco-result {
  background-color: var(--color-bg-2);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

/* 调整提交后结果展示区域的器 */
.submit-result-container {
  margin-top: 16px;
  border-radius: 8px;
  background-color: var(--color-bg-2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* 优化加载动画 */
.arco-spin {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}

.arco-spin-icon {
  color: rgb(var(--primary-6));
}

/* 调整结果图标大小和颜色 */
.result-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.result-icon-success {
  color: var(--color-success-6);
}

.result-icon-error {
  color: var(--color-danger-6);
}

.result-icon-warning {
  color: var(--color-warning-6);
}

.judging-result {
  padding: 24px;
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-bg-2);
}

.code-header .arco-form {
  margin: 0;
}

.code-header .arco-btn {
  min-width: 80px;
}

/* 调整表单项的间距 */
.code-header .arco-form-item {
  margin-right: 16px;
}

/* 调整选择器的样式 */
.code-header .arco-select {
  width: 200px;
}

.code-actions {
  display: flex;
  align-items: center;
}

/* 提交记录表格样式 */
.arco-table-cell {
  text-align: center;
}

.arco-tag {
  min-width: 30px;
  text-align: center;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 0 8px;
}

/* 保表格单元格内容中 */
.arco-table-cell {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 确保表格头部文字居中 */
.arco-table-th {
  text-align: center;
}

/* 复表格元格内容的布局 */
.arco-table-td .arco-table-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40px;
}

.code-preview {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.code-preview-header {
  padding: 12px 16px;
  background-color: var(--color-fill-2);
  border-bottom: 1px solid var(--color-border);
}

.code-preview-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

/* 整弹窗内容的样式 */
.arco-modal-content {
  padding: 24px;
  max-height: 80vh;
  overflow-y: auto;
}

.arco-descriptions {
  background: var(--color-bg-2);
}

.arco-descriptions-item-label {
  background: var(--color-fill-2);
  font-weight: 500;
}

.arco-descriptions-item-value {
  background: var(--color-bg-2);
}

.submit-detail-container {
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-1);
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.submit-info {
  margin-top: 24px;
  background: var(--color-bg-2);
  border-radius: 4px;
  overflow: hidden;
}

.test-cases {
  margin-top: 24px;
}

.test-cases .arco-collapse {
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.test-cases pre {
  margin: 0;
  padding: 8px;
  background: var(--color-fill-2);
  border-radius: 4px;
  font-family: monospace;
}

.code-section {
  margin-top: 24px;
}

.arco-tabs-nav-add {
  display: none;
}

.arco-result {
  padding: 24px;
  background: var(--color-bg-2);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.result-title {
  font-size: 24px;
  font-weight: 500;
}

.result-subtitle {
  font-size: 16px;
  color: var(--color-text-2);
}

.debug-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.debug-section {
  background: var(--color-bg-2);
  border-radius: 4px;
  overflow: hidden;
}

.debug-output,
.debug-error {
  margin: 0;
  padding: 8px;
  background: var(--color-fill-2);
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.debug-error {
  color: var(--color-danger-light-4);
  background: var(--color-danger-light-1);
}

.arco-drawer-body {
  padding: 16px;
}

.arco-descriptions-item-label {
  width: 100px;
}

.test-cases-container {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.test-cases-header {
  padding: 12px 16px;
  background: var(--color-fill-2);
  border-bottom: 1px solid var(--color-border);
}

.test-cases-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.debug-output,
.debug-error {
  margin: 0;
  padding: 8px;
  background: var(--color-fill-2);
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.debug-error {
  color: var(--color-danger-light-4);
  background: var(--color-danger-light-1);
}

/* 调试结果容器样式 */
.debug-cases-container {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;
  background: var(--color-bg-2);
}

.debug-cases-content {
  padding: 16px;
}

/* 调试输入框样式 */
.debug-input {
  width: 100%;
  font-family: monospace;
  background: var(--color-fill-1);
  border-radius: 4px;
  transition: all 0.2s;
}

.debug-input:hover {
  background: var(--color-fill-2);
}

.debug-input:focus {
  background: var(--color-bg-2);
}

/* 调试输出和错误输出样式 */
.debug-output,
.debug-error {
  margin: 0;
  padding: 12px;
  background: var(--color-fill-1);
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
  text-align: left;
  line-height: 1.5;
}

.debug-error {
  color: var(--color-danger-light-4);
  background: var(--color-danger-light-1);
}

/* 描述列表样式调整 */
.arco-descriptions-item-label {
  background: var(--color-fill-2);
  font-weight: 500;
  min-width: 100px;
}

.arco-descriptions-item-value {
  background: var(--color-bg-2);
  text-align: left;
}

/* 添加分割线样式 */
:deep(.arco-split-trigger) {
  background-color: var(--color-neutral-2);
  transition: all 0.2s ease;
}

/* 垂直分割线（上下分割）样式 */
:deep(.arco-split-trigger-vertical) {
  height: 1px; /* 减小高度 */
  width: 100%;
  cursor: row-resize;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 50%;
    top: -2px;
    transform: translateX(-50%);
    width: 40px; /* 中间小条的宽度 */
    height: 4px; /* 中间小横条的高度 */
    background-color: var(--color-neutral-3);
    border-radius: 2px;
    opacity: 0.6;
  }

  &:hover {
    background-color: var(--color-neutral-3);

    &::after {
      opacity: 1;
      background-color: var(--color-neutral-4);
    }
  }
}

/* 水平分割线（左右分割）样式 */
:deep(.arco-split-trigger-horizontal) {
  width: 1px; /* 减小宽度 */
  background-color: var(--color-neutral-2);
  cursor: col-resize;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: -2px;
    transform: translateY(-50%);
    height: 40px; /* 中间小竖条的高度 */
    width: 4px; /* 中间小竖条的宽度 */
    background-color: var(--color-neutral-3);
    border-radius: 2px;
    opacity: 0.6;
  }

  &:hover {
    background-color: var(--color-neutral-3);

    &::after {
      opacity: 1;
      background-color: var(--color-neutral-4);
    }
  }
}

/* 移除原有的行间距 */
#viewQuestionView :deep(.arco-row) {
  margin: 0 !important;
}

.solving-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

.ai-suggestion-container {
  margin-top: 16px;
  padding: 16px;
  background-color: var(--color-neutral-1);
  border-radius: 4px;
}

.ai-suggestion-text {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  line-height: 1.5;
}

.ai-suggestion-container {
  margin-top: 16px;
  border-radius: 8px;
  background: var(--color-bg-2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.ai-suggestion-header {
  padding: 12px 16px;
  background: var(--color-fill-2);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-1);
}

.ai-suggestion-header :deep(.icon-robot) {
  font-size: 18px;
  color: var(--color-primary);
}

.ai-suggestion-content {
  padding: 16px;
}

.ai-suggestion-text-wrapper {
  background: var(--color-bg-1);
  border-radius: 4px;
  padding: 16px;
}

/* 自定义 Markdown 样式 */
.ai-suggestion-text-wrapper :deep(.md-viewer) {
  background: transparent;
  padding: 0;
}

.ai-suggestion-text-wrapper :deep(.md-viewer pre) {
  background: var(--color-fill-1);
  border-radius: 4px;
  padding: 12px;
  margin: 12px 0;
}

.ai-suggestion-text-wrapper :deep(.md-viewer code) {
  font-family: var(--font-family-mono);
  background: var(--color-fill-1);
  padding: 2px 6px;
  border-radius: 4px;
}

/* 添加打字机光标样式 */
:deep(.ti-cursor) {
  color: var(--color-primary);
  font-weight: bold;
}
</style>

<template>
  <div id="addQuestionView">
    <div class="page-header">
      <h2 v-if="updatePage">更新题目</h2>
      <h2 v-else>创建题目</h2>
      <p class="page-description">
        {{ updatePage ? "修改已有题目信息" : "创建一个新的编程题目" }}
      </p>
    </div>

    <a-card class="question-form-card">
      <a-spin :loading="loading" tip="This may take a while...">
        <a-form :model="form" label-align="left">
          <div class="form-section">
            <div class="section-title">基本信息</div>
            <a-form-item field="title" label="标题" validate-trigger="blur">
              <a-input
                v-model="form.title"
                placeholder="请输入题目标题"
                allow-clear
              />
            </a-form-item>
            <a-form-item field="tags" label="标签">
              <a-input-tag
                v-model="form.tags"
                placeholder="请输入标签，按回车确认"
                allow-clear
              />
            </a-form-item>
          </div>

          <div class="form-section">
            <div class="section-title">题目详情</div>
            <a-form-item field="content" label="题目内容">
              <MdEditor
                :value="form.content"
                :handle-change="onContentChange"
              />
            </a-form-item>
            <a-form-item field="answer" label="答案">
              <a-textarea
                v-model="form.answer"
                :auto-size="{ minRows: 4, maxRows: 8 }"
                placeholder="请输入答案（可通过所有测试用例的标准答案）"
                allow-clear
              />
            </a-form-item>
          </div>

          <div class="form-section">
            <div class="section-title">判题配置</div>
            <a-space direction="horizontal" size="large" wrap>
              <a-form-item field="judgeConfig.timeLimit" label="时间限制">
                <a-input-number
                  v-model="form.judgeConfig.timeLimit"
                  placeholder="请输入时间限制"
                  mode="button"
                  min="0"
                  size="large"
                  suffix="ms"
                />
              </a-form-item>
              <a-form-item field="judgeConfig.memoryLimit" label="内存限制">
                <a-input-number
                  v-model="form.judgeConfig.memoryLimit"
                  placeholder="请输入内存限制"
                  mode="button"
                  min="0"
                  size="large"
                  suffix="KB"
                />
              </a-form-item>
              <a-form-item field="judgeConfig.stackLimit" label="堆栈限制">
                <a-input-number
                  v-model="form.judgeConfig.stackLimit"
                  placeholder="请输入堆栈限制"
                  mode="button"
                  min="0"
                  size="large"
                  suffix="KB"
                />
              </a-form-item>
            </a-space>
          </div>

          <div class="form-section">
            <div class="section-header">
              <div class="section-title">测试用例配置</div>
              <a-button @click="handleAdd" type="outline" status="success">
                <template #icon>
                  <icon-plus />
                </template>
                新增测试用例
              </a-button>
            </div>

            <div class="test-cases">
              <a-collapse>
                <a-collapse-item
                  v-for="(judgeCaseItem, index) of form.judgeCase"
                  :key="index"
                  :header="`测试用例 ${index + 1}`"
                >
                  <template #extra>
                    <a-button
                      status="danger"
                      size="mini"
                      @click.stop="handleDelete(index)"
                    >
                      删除
                    </a-button>
                  </template>
                  <a-space direction="vertical" style="width: 100%">
                    <a-form-item
                      :field="`form.judgeCase[${index}].input`"
                      label="输入"
                    >
                      <a-textarea
                        v-model="judgeCaseItem.input"
                        placeholder="请输入测试输入用例"
                      />
                    </a-form-item>
                    <a-form-item
                      :field="`form.judgeCase[${index}].output`"
                      label="输出"
                    >
                      <a-space direction="vertical" style="width: 100%">
                        <a-textarea
                          v-model="judgeCaseItem.output"
                          placeholder="请输入测试输出用例"
                        />
                        <a-button
                          type="outline"
                          status="success"
                          size="small"
                          :loading="judgeCaseItem.calculating"
                          @click="handleCalculateOutput(index)"
                        >
                          试算答案输出
                        </a-button>
                      </a-space>
                    </a-form-item>
                  </a-space>
                </a-collapse-item>
              </a-collapse>
            </div>
          </div>

          <div class="form-footer">
            <a-space>
              <a-button type="secondary" size="large">取消</a-button>
              <a-button type="primary" size="large" @click="doSubmit">
                {{ updatePage ? "更新" : "创建" }}
              </a-button>
            </a-space>
          </div>
        </a-form>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import MdEditor from "@/components/MdEditor.vue";
import {
  QuestionControllerService,
  QuestionSubmitControllerService,
} from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import { useRoute } from "vue-router";
import { IconPlus } from "@arco-design/web-vue/es/icon";

let loading = ref(false);
const route = useRoute();
// 如果页面地址包含 update，视为更新页面
const updatePage = route.path.includes("update");

let form = ref({
  title: "",
  tags: [],
  answer: "",
  content: "",
  judgeConfig: {
    memoryLimit: 1000,
    stackLimit: 1000,
    timeLimit: 1000,
  },
  judgeCase: [
    {
      input: "",
      output: "",
      calculating: false,
    },
  ],
});

/**
 * 根据题目 id 获取老的数据
 */
const loadData = async () => {
  const id = route.query.id;
  if (!id) {
    return;
  }
  loading.value = true;
  const res = await QuestionControllerService.getQuestionByIdUsingGet(
    id as any
  );
  loading.value = false;
  if (String(res.code) === "200") {
    form.value = res.data as any;
    // json 转 js 对象
    if (!form.value.judgeCase) {
      form.value.judgeCase = [
        {
          input: "",
          output: "",
          calculating: false,
        },
      ];
    } else {
      form.value.judgeCase = JSON.parse(form.value.judgeCase as any);
    }
    if (!form.value.judgeConfig) {
      form.value.judgeConfig = {
        memoryLimit: 1000,
        stackLimit: 1000,
        timeLimit: 1000,
      };
    } else {
      form.value.judgeConfig = JSON.parse(form.value.judgeConfig as any);
    }
    if (!form.value.tags) {
      form.value.tags = [];
    } else {
      form.value.tags = JSON.parse(form.value.tags as any);
    }
  } else {
    message.error("加载失败，" + res.message);
  }
};

onMounted(() => {
  loadData();
});

const doSubmit = async () => {
  console.log(form.value);
  // 区分更新还是创建
  if (updatePage) {
    const res = await QuestionControllerService.updateQuestionUsingPost(
      form.value
    );
    if (String(res.code) === "200") {
      message.success("更新成功");
    } else {
      message.error("更新失败，" + res.message);
    }
  } else {
    const res = await QuestionControllerService.addQuestionUsingPost(
      form.value
    );
    if (String(res.code) === "200") {
      message.success("创建成功");
    } else {
      message.error("创建失败，" + res.message);
    }
  }
};

/**
 * 新增判题用例
 */
const handleAdd = () => {
  form.value.judgeCase.push({
    input: "",
    output: "",
    calculating: false,
  });
};

/**
 * 删除判题用例
 */
const handleDelete = (index: number) => {
  form.value.judgeCase.splice(index, 1);
};

const onContentChange = (value: string) => {
  form.value.content = value;
};

/**
 * 试算答案输出
 */
const handleCalculateOutput = async (index: number) => {
  // 如果没有答案，提示错误
  if (!form.value.answer) {
    message.error("请先填写答案");
    return;
  }

  // 设置加载状态
  form.value.judgeCase[index].calculating = true;

  try {
    const res = await QuestionSubmitControllerService.debugCode({
      code: form.value.answer,
      language: "java", // 默认使用 Java，您可以根据需要修改或添加语言选择
      questionId: route.query.id as string,
      testCase: form.value.judgeCase[index].input,
    });

    if (String(res.code) === "200" && res.data) {
      if (res.data.compileErrorOutput) {
        message.error("答案编译错误：" + res.data.compileErrorOutput);
      } else if (res.data.runOutput && res.data.runOutput.length > 0) {
        // 更新输出 - 处理数组形式的输出
        form.value.judgeCase[index].output = res.data.runOutput[0].trim();
        message.success("试算成功");
      } else if (res.data.runErrorOutput && res.data.runErrorOutput[0]) {
        // 处理运行时错误
        message.error("运行错误：" + res.data.runErrorOutput[0]);
      } else {
        message.warning("未获取到输出结果");
      }
    } else {
      message.error("试算失败：" + res.message);
    }
  } catch (error) {
    message.error("试算失败，请重试");
    console.error(error);
  } finally {
    form.value.judgeCase[index].calculating = false;
  }
};
</script>

<style scoped>
#addQuestionView {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 500;
  color: var(--color-text-1);
}

.page-description {
  margin: 8px 0 0;
  color: var(--color-text-3);
}

.question-form-card {
  background: var(--color-bg-2);
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 32px;
  padding: 24px;
  background: var(--color-bg-1);
  border-radius: 4px;
}

.section-title {
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 500;
  color: var(--color-text-1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.test-cases {
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.form-footer {
  margin-top: 40px;
  padding: 24px;
  text-align: center;
  border-top: 1px solid var(--color-border);
}

:deep(.arco-form-item-label-col) {
  font-weight: 500;
}

:deep(.arco-input-number) {
  min-width: 160px;
}

:deep(.arco-textarea) {
  min-height: 100px;
}

:deep(.arco-collapse-item) {
  border-bottom: 1px solid var(--color-border);
}

:deep(.arco-collapse-item:last-child) {
  border-bottom: none;
}
</style>

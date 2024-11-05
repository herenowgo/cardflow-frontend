<template>
  <div>
    <div v-if="showDetail">
      <div class="header">
        <a-button @click="showDetail = false">
          <template #icon>
            <icon-left />
          </template>
          返回题解列表
        </a-button>
      </div>
      <QuestionSolvingInformationView :questionSolvingId="currentSolvingId" />
    </div>
    <div v-else>
      <a-list :data="dataSource" :bordered="false">
        <template #item="{ item }">
          <a-list-item class="list-demo-item" @click="viewSolving(item)">
            <div style="width: 100%">
              <div style="display: flex; justify-content: space-between">
                <span style="font-weight: bold; font-size: 16px">{{
                  item.title
                }}</span>
                <span style="color: #666">
                  {{ moment(item.createTime).format("YYYY-MM-DD HH:mm:ss") }}
                </span>
              </div>
              <div style="margin-top: 8px">
                <span style="margin-right: 16px">
                  <icon-thumb-up /> {{ item.supportNumber }}
                </span>
                <span> <icon-message /> {{ item.commentNumber }} </span>
              </div>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from "vue";
import { QuestionSolvingControllerService } from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import moment from "moment/moment";
import {
  IconLeft,
  IconThumbUp,
  IconMessage,
} from "@arco-design/web-vue/es/icon";
import QuestionSolvingInformationView from "./QuestionSolvingInformationView.vue";

const questionId = inject("questionId") as number;
const dataSource = ref([]);
let loading = false;
const showDetail = ref(false);
const currentSolvingId = ref<number>();

const loadData = async () => {
  loading = true;
  const res =
    await QuestionSolvingControllerService.listQuestionSolvingPageVoByPageUsingPost(
      {
        pageSize: 100,
        current: 1,
        sortField: "supportNumber",
        sortOrder: "DESC",
        questionId: questionId,
      }
    );
  loading = false;
  if (String(res.code) === "200") {
    dataSource.value = res.data.records;
  } else {
    message.error("加载失败，" + res.message);
  }
};

const viewSolving = (item: any) => {
  currentSolvingId.value = item.id;
  showDetail.value = true;
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.list-demo-item {
  padding: 20px 0;
  border-bottom: 1px solid var(--color-fill-3);
  cursor: pointer;
  transition: background-color 0.2s;
}

.list-demo-item:hover {
  background-color: var(--color-fill-2);
}

.header {
  margin-bottom: 16px;
}
</style>

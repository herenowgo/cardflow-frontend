<template>
  <a-list
    :bordered="false"
    :data="dataSource"
    :pagination-props="{ defaultPageSize: 3, total: dataSource.length }"
    class="list-demo-action-layout"
    :loading="loading"
  >
    <template #item="{ item }">
      <a-list-item class="list-demo-item" action-layout="vertical">
        <!--        <template #actions>-->
        <!--          <span>83</span>-->
        <!--          <span>{{ item.index }}</span>-->
        <!--          <span>Reply</span>-->
        <!--        </template>-->
        <template #meta>
          <a-link
            @click="() => router.push({ path: `/questionSolving/${item.id}` })"
          >
            <h1>{{ item.title }}</h1>
          </a-link>
        </template>
        <template #extra>
          <h3>{{ item.supportNumber }} 支持</h3>
          <h3>{{ item.pageView }} 浏览</h3>
          <!--          <div className="image-area">-->
          <!--            <img alt="arco-design" :src="item.imageSrc" />-->
          <!--          </div>-->
        </template>
        <a-list-item-meta>
          <!--          <template #avatar>-->
          <!--            <a-avatar shape="square">-->
          <!--              <img alt="avatar" :src="item.avatar" />-->
          <!--            </a-avatar>-->
          <!--          </template>-->
          <template #title>
            <h4>
              <a-link>{{ item.userVO.userName }}</a-link>
              创建于
              {{ moment(item.createTime).format("YYYY-MM-DD HH:mm:ss") }}
            </h4>
          </template>
        </a-list-item-meta>
      </a-list-item>
    </template>
  </a-list>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from "vue";
import { QuestionSolvingControllerService } from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import moment from "moment/moment";
import { useRoute, useRouter } from "vue-router";

const questionId = inject("questionId") as number;
const router = useRouter();
const dataSource = ref([]);
let loading = false;
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
  if (res.code === 0) {
    dataSource.value = res.data.records;
  } else {
    message.error("加载失败，" + res.message);
  }
};
/**
 * 页面加载时，请求数据
 */
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.list-demo-action-layout .image-area {
  width: 183px;
  height: 119px;
  border-radius: 2px;
  overflow: hidden;
}

.list-demo-action-layout .list-demo-item {
  padding: 20px 0;
  border-bottom: 1px solid var(--color-fill-3);
}

.list-demo-action-layout .image-area img {
  width: 100%;
}

.list-demo-action-layout .arco-list-item-action .arco-icon {
  margin: 0 4px;
}
</style>

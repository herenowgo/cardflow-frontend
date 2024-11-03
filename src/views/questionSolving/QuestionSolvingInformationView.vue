<template>
  <a-card
    :style="{ width: '1000px', position: 'relative' }"
    id="questionSolvingCard"
  >
    <template #actions>
      <span class="action" key="heart" @click="onQuestionSolvingLikeChange()">
        <span v-if="questionSolving.supported">
          <IconThumbUp size="32" :style="{ color: '#f53f3f' }" />
        </span>
        <span v-else> <IconThumbUp size="32" /> </span>
      </span>
      <!--      <span class="icon-hover"> <IconThumbUp size="32" /> </span>-->
      <span class="icon-hover"> <IconShareInternal size="32" /> </span>
      <span class="icon-hover"> <IconMore size="32" /> </span>
    </template>
    <MdViewer :value="questionSolvingText" />
    <template #cover>
      <div
        :style="{
          height: '150px',
          overflow: 'hidden',
        }"
      >
        <h1 style="padding-left: 18px">{{ questionSolvingTitle }}</h1>
        <!--        <img-->
        <!--          :style="{ width: '100%', transform: 'translateY(-20px)' }"-->
        <!--          alt="dessert"-->
        <!--          src="https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/a20012a2d4d5b9db43dfc6a01fe508c0.png~tplv-uwbnlip3yd-webp.webp"-->
        <!--        />-->
        <a-card-meta>
          <template #avatar>
            <div
              :style="{
                display: 'flex',
                alignItems: 'center',
                color: '#1D2129',
              }"
            >
              <a-avatar :size="24" :style="{ marginRight: '8px' }"> A</a-avatar>
              <a-typography-text>
                <!--                {{ questionSolvingUserName }}-->
              </a-typography-text>
            </div>
          </template>
          <template #title></template>
          <template #description></template>
        </a-card-meta>
        <a-divider></a-divider>
      </div>
    </template>
  </a-card>

  <a-card
    :style="{ width: '1000px' }"
    id="questionSolvingCard"
    style="margin-top: 30px"
  >
    <template #cover>
      <h1>评论</h1>
    </template>
    <a-textarea
      placeholder="在这里写评论..."
      :auto-size="{ minRows: 2, maxRows: 5 }"
      style="margin-top: 20px"
      v-model="yourComment.content"
    />
    <a-button
      type="primary"
      style="
        float: right;
        min-width: 200px;
        margin-top: 10px;
        margin-bottom: 20px;
      "
      @click="doSubmit"
      >发表评论
    </a-button>
    <a-divider style="margin-top: 30px"></a-divider>

    <div v-for="item in comments" :key="item">
      <a-comment>
        <template #datetime>
          {{ moment(item.createTime).format("YYYY-MM-DD HH:mm:ss") }}
        </template>
        <template #author>
          {{ item.userVO.userName }}
        </template>
        <template #content>
          {{ item.content }}
        </template>
        <template #actions>
          <span class="action" key="heart" @click="onLikeChange(item)">
            <span v-if="item.liked">
              <IconHeartFill :style="{ color: '#f53f3f' }" />
            </span>
            <span v-else>
              <IconHeart />
            </span>

            {{ item.thumbNum }}
          </span>
          <span class="action" key="reply"> <IconMessage /> Reply </span>
        </template>
        <template #avatar>
          <a-avatar>
            <img
              alt="avatar"
              src="https://p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/3ee5f13fb09879ecb5185e440cef6eb9.png~tplv-uwbnlip3yd-webp.webp"
            />
          </a-avatar>
        </template>
      </a-comment>
      <a-divider></a-divider>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { defineProps, onMounted, ref, withDefaults } from "vue";
import message from "@arco-design/web-vue/es/message";
import MdViewer from "@/components/MdViewer.vue";
import {
  CommentControllerService,
  CommentVO,
  QuestionSolving,
  QuestionSolvingControllerService,
} from "../../../generated";
import { useRoute } from "vue-router";
import {
  IconHeart,
  IconMessage,
  IconStar,
  IconStarFill,
  IconHeartFill,
} from "@arco-design/web-vue/es/icon";
import MdEditor from "@/components/MdEditor.vue";
import moment from "moment";

interface Props {
  id: string;
}

const yourComment = ref({
  content: "",
});

const doSubmit = async () => {
  const res = await CommentControllerService.addCommentUsingPost({
    content: yourComment.value.content,
    questionSolvingId: questionSolvingId as unknown as number,
  });
  if (String(res.code) === "200") {
    message.success("评论成功");
    yourComment.value.content = "";
  } else {
    message.error("评论失败，" + res.message);
  }
  loadData();
};
const comments = ref([
  {
    userVO: {
      userName: "Socrates",
      userAvatar: "",
    },
    content: "Comment body content.",
    createTime: "",
    thumbNum: 0,
    favourNum: 0,
    liked: false,
  } as CommentVO,
]);

let form = ref({
  content: "",
  questionSolvingId: "",
  supported: false,
});
const route = useRoute();
const props = withDefaults(defineProps<Props>(), {
  id: () => "",
});

const questionSolvingId = route.params.id;
const questionSolvingText = ref();
const questionSolving = ref<QuestionSolving>({
  supported: false,
});
const questionSolvingTitle = ref();
const questionSolvingUserName = ref();
const supported = ref();
const loadData = async () => {
  const res =
    await QuestionSolvingControllerService.getQuestionSolvingUsingPost({
      id: questionSolvingId as unknown as number,
      sortField: "",
    });

  if (String(res.code) === "200") {
    console.log(res.data.title);
    if (res.data == null) {
      message.error("题解不存在");
      return;
    }
    questionSolvingText.value = res.data.text;
    questionSolving.value = res.data;
    questionSolvingTitle.value = res.data.title;
  } else {
    message.error("加载失败，" + res.message);
  }

  const commentsRes =
    await CommentControllerService.listCommentPageVoByPageUsingPost({
      questionSolvingId: questionSolvingId as unknown as number,
      sortField: "thumbNum",
      sortOrder: "DESC",
    });

  if (String(commentsRes.code) === "200") {
    comments.value = commentsRes.data.records;
  } else {
    message.error("加载失败，" + commentsRes.message);
  }
};

/**
 * 页面加载时，请求数据
 */
onMounted(() => {
  // console.log("欢迎欢迎");
  loadData();
});

const onLikeChange = (item: any) => {
  item.liked = !item.liked;
  if (item.liked) {
    item.thumbNum += 1;
  } else {
    item.thumbNum -= 1;
  }
  CommentControllerService.likeCommentUsingPut(item.id);
};

const onQuestionSolvingLikeChange = () => {
  questionSolving.value.supported = !questionSolving.value?.supported;
  // CommentControllerService.likeCommentUsingPut(form.value.id);
  QuestionSolvingControllerService.supportQuestionSolvingUsingPut(
    questionSolvingId as number
  );
};
</script>

<style scoped>
#questionSolvingCard {
  margin: 0 auto;
  padding-left: 30px;
  padding-right: 30px;
}

.action {
  display: inline-block;
  padding: 0 4px;
  color: var(--color-text-1);
  line-height: 24px;
  background: transparent;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.1s ease;
}

.action:hover {
  background: var(--color-fill-3);
}
</style>

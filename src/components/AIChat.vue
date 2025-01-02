<template>
  <t-dialog
    v-model:visible="visible"
    :footer="false"
    :header="title"
    mode="modeless"
    :close-btn="true"
    @close="handleClose"
    @confirm="handleClose"
  >
    <template #body>
      <t-chat
        :style="{ height }"
        :clear-history="chatList.length > 0 && !isStreamLoad && showClear"
        @on-action="operation"
        @clear="handleClear"
      >
        <template v-for="(item, index) in chatList" :key="index">
          <t-chat-item
            :avatar="item.avatar"
            :name="item.name"
            :role="item.role"
            :datetime="item.datetime"
            :content="item.content"
            :text-loading="index === 0 && loading"
          >
          </t-chat-item>
        </template>
        <template #footer>
          <t-chat-input
            :stop-disabled="isStreamLoad"
            @send="handleSend"
            @stop="handleStop"
          >
          </t-chat-input>
        </template>
      </t-chat>
    </template>
  </t-dialog>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  defineProps,
  defineEmits,
  watch,
  defineExpose,
  withDefaults,
} from "vue";
import { eventStreamService } from "@/services/EventStreamService";
import { ChatControllerService } from "../../generated/services/ChatControllerService";
import { AIChatRequest } from "../../generated/models/AIChatRequest";
import type { ChatMessage, ChatProps, ChatEvents } from "@/types/chat";

const props = withDefaults(defineProps<ChatProps>(), {
  userAvatar: "https://tdesign.gtimg.com/site/avatar.jpg",
  aiAvatar: "https://tdesign.gtimg.com/site/chat-avatar.png",
  userName: "自己",
  aiName: "AI助手",
  title: "AI助手",
  height: "600px",
  draggable: true,
  showClear: true,
});

const emit = defineEmits<ChatEvents>();

// 状态变量
const visible = ref(false);
const loading = ref(false);
const isStreamLoad = ref(false);
const currentSessionId = ref<string>("");
const currentRequestId = ref<string>("");

// 聊天消息列表
const chatList = ref<ChatMessage[]>(
  props.initialMessages || [
    {
      avatar: props.aiAvatar,
      name: props.aiName,
      datetime: new Date().toLocaleString(),
      content: "你好！我是AI助手，有什么我可以帮你的吗？",
      role: "assistant",
    },
  ]
);

// 生成UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 处理操作
const operation = (type: string, options: any) => {
  console.log(type, options);
};

// 处理清空历史
const handleClear = () => {
  chatList.value = [];
  currentSessionId.value = generateUUID();
  emit("clear");
};

// 处理停止生成
const handleStop = () => {
  if (isStreamLoad.value && currentRequestId.value) {
    eventStreamService.cancelRequest(currentRequestId.value);
    loading.value = false;
    isStreamLoad.value = false;
    emit("stop");
  }
};

// 处理关闭对话框
const handleClose = () => {
  visible.value = false;
  emit("close");
};

// 处理发送消息
const handleSend = async (inputValue: string) => {
  if (isStreamLoad.value || !inputValue) return;

  // 如果没有会话ID，生成一个新的
  if (!currentSessionId.value) {
    currentSessionId.value = generateUUID();
  }

  // 添加用户消息
  const userMessage: ChatMessage = {
    avatar: props.userAvatar,
    name: props.userName,
    datetime: new Date().toLocaleString(),
    content: inputValue,
    role: "user",
  };
  chatList.value.unshift(userMessage);

  // 添加AI消息占位
  const aiMessage: ChatMessage = {
    avatar: props.aiAvatar,
    name: props.aiName,
    datetime: new Date().toLocaleString(),
    content: "",
    role: "assistant",
  };
  chatList.value.unshift(aiMessage);

  try {
    loading.value = true;
    isStreamLoad.value = true;
    const lastItem = chatList.value[0];

    // 发送聊天请求
    const res = await ChatControllerService.chat({
      model: AIChatRequest.model.BASIC,
      content: inputValue,
      sessionId: currentSessionId.value,
    });

    if (res.code == 200 && res.data) {
      currentRequestId.value = res.data;
      emit("send", inputValue);

      // 使用流式响应
      let accumulatedContent = "";
      await eventStreamService.waitForStreamingResult(
        currentRequestId.value,
        (newContent: string) => {
          loading.value = false;

          // 找出新增的内容
          const addedContent = newContent.slice(accumulatedContent.length);
          accumulatedContent = newContent;

          // 更新显示内容
          if (lastItem && lastItem.role === "assistant") {
            lastItem.content = newContent;
          }
        }
      );
    }
  } catch (error) {
    console.error("Chat error:", error);
    if (chatList.value[0] && chatList.value[0].role === "assistant") {
      chatList.value[0].content = "抱歉，发生了错误，请稍后重试";
    }
  } finally {
    loading.value = false;
    isStreamLoad.value = false;
  }
};

// 添加 sendMessage 方法
const sendMessage = async (message: string) => {
  if (isStreamLoad.value) return;
  await handleSend(message);
};

// 暴露方法给父组件
defineExpose({
  show: () => (visible.value = true),
  hide: () => (visible.value = false),
  clear: handleClear,
  sendMessage,
});
</script>

<style scoped>
.t-chat {
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-medium);
}
</style>

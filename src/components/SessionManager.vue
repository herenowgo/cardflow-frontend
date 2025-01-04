<!-- 会话管理组件 -->
<template>
  <t-drawer
    :visible="props.visible"
    size="medium"
    placement="right"
    :mask="true"
    :close-btn="true"
    :footer="false"
    :destroy-on-close="false"
    @update:visible="(val: boolean) => emit('update:visible', val)"
    @close="emit('update:visible', false)"
  >
    <template #header>
      <div class="drawer-header">
        <div class="drawer-title">会话列表</div>
        <div class="drawer-actions">
          <t-button theme="primary" size="small" @click="createNewSession">
            <template #icon><t-icon name="add" /></template>
            新建会话
          </t-button>
        </div>
      </div>
    </template>
    <div class="sessions-list">
      <div v-if="sessions.length === 0" class="empty-state">暂无会话</div>
      <div v-else class="session-items">
        <div
          v-for="(session, index) in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: index === currentSessionIndex }"
          @click="switchSession(index)"
        >
          <div class="session-info">
            <div class="session-name">
              <template
                v-if="editingSessionName && index === currentSessionIndex"
              >
                <t-input
                  v-model="editingSessionName"
                  size="small"
                  @blur="renameSession(index)"
                  @keyup.enter="renameSession(index)"
                  @keyup.esc="editingSessionName = ''"
                />
              </template>
              <template v-else>
                {{ session.name }}
              </template>
            </div>
            <div class="session-meta">
              {{ session.lastUpdated }}
            </div>
          </div>
          <div class="session-actions">
            <t-button
              v-if="index === currentSessionIndex && index !== 0"
              theme="default"
              variant="text"
              size="small"
              @click.stop="editingSessionName = session.name"
            >
              <template #icon><t-icon name="edit" /></template>
            </t-button>
            <t-button
              v-if="index !== 0"
              theme="danger"
              variant="text"
              size="small"
              @click.stop="deleteSession(index)"
            >
              <template #icon><t-icon name="delete" /></template>
            </t-button>
          </div>
        </div>
      </div>
    </div>
  </t-drawer>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch, onMounted } from "vue";
import { Message } from "@arco-design/web-vue";
import type { ChatMessage } from "@/types/chat";
import { AIChatRequest } from "../../generated/models/AIChatRequest";
import {
  Drawer as TDrawer,
  Button as TButton,
  Input as TInput,
  Icon as TIcon,
} from "tdesign-vue-next";

// 添加 HistoryResponse 接口定义
interface HistoryResponse {
  content: string;
  datetime: string;
}

interface ChatSession {
  id: string; // 会话的唯一标识
  sessionId: string; // 用于与后端通信的 sessionId
  name: string;
  messages: (ChatMessage & { history?: HistoryResponse[] })[];
  model: AIChatRequest.model;
  promptId: string;
  lastUpdated: string;
}

interface Props {
  visible: boolean;
  currentModel: AIChatRequest.model;
  currentPromptId: string;
  messages: (ChatMessage & { history?: HistoryResponse[] })[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "session-switch", session: ChatSession): void;
  (e: "session-create", session: ChatSession): void;
}>();

// 常量
const SESSIONS_STORAGE_KEY = "ai_chat_sessions";
const CURRENT_SESSION_KEY = "ai_chat_current_session";
const CURRENT_PROMPT_KEY = "ai_chat_current_prompt";

// 状态
const sessions = ref<ChatSession[]>([]);
const currentSessionIndex = ref<number>(-1);
const editingSessionName = ref("");

// 从 localStorage 加载会话
const loadSessions = () => {
  const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (savedSessions) {
    sessions.value = JSON.parse(savedSessions);
    // 确保第一个会话名称为"主会话"并使用保存的 promptId
    if (sessions.value.length > 0) {
      sessions.value[0].name = "主会话";
      sessions.value[0].promptId =
        localStorage.getItem(CURRENT_PROMPT_KEY) || "";
    }
    // 只为没有 sessionId 的新会话生成 sessionId
    sessions.value = sessions.value.map(
      (session: ChatSession, index: number) => {
        if (!session.sessionId) {
          console.warn(
            "Found session without sessionId, generating new one:",
            session
          );
          return {
            ...session,
            sessionId: generateUUID(),
          };
        }
        return session;
      }
    );
  }

  const currentSessionId = localStorage.getItem(CURRENT_SESSION_KEY);
  if (currentSessionId) {
    const index = sessions.value.findIndex((s) => s.id === currentSessionId);
    if (index !== -1) {
      currentSessionIndex.value = index;
      emit("session-switch", sessions.value[index]);
    }
  }

  // 如果没有会话，创建一个新会话
  if (sessions.value.length === 0) {
    createNewSession();
  }
};

// 保存会话到 localStorage
const saveSessions = () => {
  // 只为没有 sessionId 的新会话生成 sessionId
  const sessionsToSave = sessions.value.map((session) => {
    if (!session.sessionId) {
      console.warn(
        "Found session without sessionId, generating new one:",
        session
      );
      return {
        ...session,
        sessionId: generateUUID(),
      };
    }
    return session;
  });
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessionsToSave));
  if (currentSessionIndex.value >= 0) {
    localStorage.setItem(
      CURRENT_SESSION_KEY,
      sessions.value[currentSessionIndex.value].id
    );
  }
};

// 生成UUID
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 创建新会话
const createNewSession = () => {
  const sessionId = generateUUID();
  console.log("Creating new session with sessionId:", sessionId);
  const newSession: ChatSession = {
    id: generateUUID(),
    sessionId: sessionId,
    name:
      sessions.value.length === 0 ? "主会话" : `会话 ${sessions.value.length}`,
    messages: [
      {
        avatar: "",
        name: "AI助手",
        datetime: new Date().toLocaleString(),
        content: "你好！我是AI助手，有什么我可以帮你的吗？",
        role: "assistant",
      },
    ],
    model: props.currentModel,
    promptId:
      sessions.value.length === 0
        ? localStorage.getItem(CURRENT_PROMPT_KEY) || ""
        : props.currentPromptId,
    lastUpdated: new Date().toLocaleString(),
  };

  sessions.value.push(newSession);
  currentSessionIndex.value = sessions.value.length - 1;
  saveSessions();
  emit("session-create", newSession);
};

// 切换到指定会话
const switchSession = (index: number) => {
  if (index === currentSessionIndex.value) return;

  currentSessionIndex.value = index;
  const session = sessions.value[index];

  // 如果是切换到第一个会话，从 localStorage 获取最新的 sessionId
  if (index === 0) {
    const savedSessions = JSON.parse(
      localStorage.getItem(SESSIONS_STORAGE_KEY) || "[]"
    );
    if (savedSessions.length > 0 && savedSessions[0].sessionId) {
      session.sessionId = savedSessions[0].sessionId;
      console.log(
        "Updated first session's sessionId from storage:",
        session.sessionId
      );
    }
  }

  console.log("Switching to session with sessionId:", session.sessionId);
  emit("session-switch", session);
  emit("update:visible", false);
  Message.success(`已切换到${session.name}`);
};

// 重命名会话
const renameSession = (index: number) => {
  // 不允许重命名主会话（第一个会话）
  if (index === 0) {
    Message.warning("主会话不能重命名");
    editingSessionName.value = "";
    return;
  }

  if (!editingSessionName.value.trim()) {
    Message.warning("会话名称不能为空");
    return;
  }

  sessions.value[index].name = editingSessionName.value.trim();
  editingSessionName.value = "";
  saveSessions();
  Message.success("重命名成功");
};

// 删除会话
const deleteSession = (index: number) => {
  // 不允许删除主会话（第一个会话）
  if (index === 0) {
    Message.warning("主会话不能删除");
    return;
  }

  if (sessions.value.length === 1) {
    Message.warning("至少保留一个会话");
    return;
  }

  sessions.value.splice(index, 1);
  if (index === currentSessionIndex.value) {
    currentSessionIndex.value = 0;
    emit("session-switch", sessions.value[0]);
  } else if (index < currentSessionIndex.value) {
    currentSessionIndex.value--;
  }
  saveSessions();
  Message.success("删除成功");
};

// 更新当前会话
const updateCurrentSession = () => {
  if (currentSessionIndex.value < 0) return;

  const currentSession = sessions.value[currentSessionIndex.value];

  // 如果是第一个会话，从 localStorage 获取最新的 sessionId
  if (currentSessionIndex.value === 0) {
    const savedSessions = JSON.parse(
      localStorage.getItem(SESSIONS_STORAGE_KEY) || "[]"
    );
    if (savedSessions.length > 0 && savedSessions[0].sessionId) {
      currentSession.sessionId = savedSessions[0].sessionId;
      console.log(
        "Updated first session's sessionId from storage:",
        currentSession.sessionId
      );
    }
    // 如果是主会话，保存当前的 promptId
    localStorage.setItem(CURRENT_PROMPT_KEY, props.currentPromptId);
  }

  currentSession.messages = props.messages;
  currentSession.model = props.currentModel;
  currentSession.promptId =
    currentSessionIndex.value === 0
      ? localStorage.getItem(CURRENT_PROMPT_KEY) || ""
      : props.currentPromptId;
  currentSession.lastUpdated = new Date().toLocaleString();
  saveSessions();
};

// 监听消息变化自动保存会话
watch(
  () => props.messages,
  () => {
    updateCurrentSession();
  },
  { deep: true }
);

watch([() => props.currentModel, () => props.currentPromptId], () => {
  updateCurrentSession();
});

// 在组件挂载时加载会话
onMounted(() => {
  loadSessions();
});
</script>

<style scoped>
.sessions-list {
  height: calc(100vh - 55px);
  overflow-y: auto;
  padding: 16px;
}

.session-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  background: var(--color-bg-2);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--color-fill-2);
    transform: translateX(4px);
  }

  &.active {
    background: var(--color-primary-light-1);
    border-left: 3px solid var(--color-primary-6);
  }
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-meta {
  font-size: 12px;
  color: var(--color-text-3);
}

.session-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.session-item:hover .session-actions {
  opacity: 1;
}

.session-item.active .session-actions {
  opacity: 1;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.drawer-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-1);
}

.drawer-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  color: var(--color-text-3);
  padding: 32px 16px;
}
</style>

<template>
  <template v-if="!props.embedded">
    <t-dialog
      v-model:visible="visible"
      :footer="false"
      :header="title"
      mode="modeless"
      :close-btn="true"
      @close="handleClose"
      @confirm="handleClose"
    >
      <template #header>
        <div class="chat-header">
          <div class="chat-title">{{ title }}</div>
          <div class="header-actions">
            <div class="default-tags-wrapper">
              <t-tooltip content="设置默认标签">
                <a-input-tag
                  v-model="defaultTags"
                  size="small"
                  class="default-tags-input"
                  placeholder="设置默认标签"
                  allow-clear
                  @change="handleDefaultTagsChange"
                />
              </t-tooltip>
            </div>
            <t-tooltip content="会话列表 (Alt + S)">
              <t-button
                theme="default"
                variant="text"
                shape="square"
                @click="isSessionsDrawerVisible = true"
              >
                <template #icon>
                  <t-icon name="chat" />
                </template>
              </t-button>
            </t-tooltip>
            <t-tooltip content="设置系统提示词">
              <t-button
                theme="default"
                variant="text"
                shape="square"
                @click="showSettings"
              >
                <template #icon>
                  <t-icon name="setting" />
                </template>
              </t-button>
            </t-tooltip>
            <t-tooltip content="查看已生成卡片 (Alt + C)">
              <t-button
                theme="default"
                variant="text"
                shape="square"
                @click="handleShowCardsDrawer"
              >
                <template #icon>
                  <t-icon name="card" />
                </template>
              </t-button>
            </t-tooltip>
            <div class="model-selector-wrapper">
              <t-tooltip content="选择 AI 模型">
                <t-select
                  v-model="currentModel"
                  :options="modelOptions"
                  size="small"
                  class="model-selector"
                  :popup-props="{
                    overlayClassName: 'model-selector-popup',
                    overlayInnerStyle: { padding: '4px' },
                  }"
                >
                  <template #prefixIcon>
                    <t-icon
                      name="control-platform"
                      style="color: var(--td-brand-color)"
                    />
                  </template>
                </t-select>
              </t-tooltip>
            </div>
          </div>
        </div>
      </template>
      <template #body>
        <div class="chat-body">
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
                <template
                  #actions
                  v-if="
                    item.role === 'assistant' &&
                    !(index === 0 && (loading || isStreamLoad))
                  "
                >
                  <t-space>
                    <t-dropdown
                      trigger="click"
                      :min-column-width="100"
                      :options="[
                        {
                          content: '复制 Markdown',
                          value: 'markdown',
                          onClick: () => copyContent(item.content, 'markdown'),
                        },
                        {
                          content: '复制 HTML',
                          value: 'html',
                          onClick: () => copyContent(item.content, 'html'),
                        },
                      ]"
                    >
                      <t-button theme="default" variant="text" size="small">
                        <template #icon><t-icon name="file-copy" /></template>
                        复制
                        <t-icon
                          name="chevron-down"
                          size="small"
                          style="margin-left: 4px"
                        />
                      </t-button>
                    </t-dropdown>
                    <t-button
                      theme="default"
                      variant="text"
                      size="small"
                      :loading="cardsGeneratingMap.get(index)"
                      @click="generateCards(item, index)"
                    >
                      <template #icon><t-icon name="layers" /></template>
                      生成卡片
                    </t-button>
                    <t-dropdown
                      trigger="click"
                      :min-column-width="100"
                      :options="modelOptions.map((opt: ModelOption) => ({
                        content: opt.label,
                        value: opt.value,
                        onClick: () => regenerateWithModel(opt.value),
                      }))"
                    >
                      <t-button theme="default" variant="text" size="small">
                        <template #icon><t-icon name="refresh" /></template>
                        重新生成
                        <t-icon
                          name="chevron-down"
                          size="small"
                          style="margin-left: 4px"
                        />
                      </t-button>
                    </t-dropdown>
                    <t-button
                      v-if="item.history?.length"
                      theme="default"
                      variant="text"
                      size="small"
                      @click="switchHistory(item)"
                    >
                      <template #icon><t-icon name="swap" /></template>
                      切换历史回复({{ item.history.length }})
                    </t-button>
                  </t-space>
                </template>
              </t-chat-item>
            </template>
            <template #footer>
              <t-chat-input
                :stop-disabled="isStreamLoad"
                @send="handleSend"
                @stop="handleStop"
              />
            </template>
          </t-chat>
        </div>
      </template>
    </t-dialog>
  </template>
  <template v-else>
    <div class="embedded-chat">
      <div class="chat-header">
        <div class="chat-title">{{ title }}</div>
        <div class="header-actions">
          <div class="default-tags-wrapper">
            <t-tooltip content="设置默认标签">
              <a-input-tag
                v-model="defaultTags"
                size="small"
                class="default-tags-input"
                placeholder="设置默认标签"
                allow-clear
                @change="handleDefaultTagsChange"
              />
            </t-tooltip>
          </div>
          <t-tooltip content="会话列表 (Alt + S)">
            <t-button
              theme="default"
              variant="text"
              shape="square"
              @click="isSessionsDrawerVisible = true"
            >
              <template #icon>
                <t-icon name="chat" />
              </template>
            </t-button>
          </t-tooltip>
          <t-tooltip content="设置系统提示词">
            <t-button
              theme="default"
              variant="text"
              shape="square"
              @click="showSettings"
            >
              <template #icon>
                <t-icon name="setting" />
              </template>
            </t-button>
          </t-tooltip>
          <t-tooltip content="查看已生成卡片 (Alt + C)">
            <t-button
              theme="default"
              variant="text"
              shape="square"
              @click="handleShowCardsDrawer"
            >
              <template #icon>
                <t-icon name="card" />
              </template>
            </t-button>
          </t-tooltip>
          <div class="model-selector-wrapper">
            <t-tooltip content="选择 AI 模型">
              <t-select
                v-model="currentModel"
                :options="modelOptions"
                size="small"
                class="model-selector"
                :popup-props="{
                  overlayClassName: 'model-selector-popup',
                  overlayInnerStyle: { padding: '4px' },
                }"
              >
                <template #prefixIcon>
                  <t-icon
                    name="control-platform"
                    style="color: var(--td-brand-color)"
                  />
                </template>
              </t-select>
            </t-tooltip>
          </div>
        </div>
      </div>
      <div class="chat-body">
        <t-chat
          :style="{ height: 'calc(100% - 48px)' }"
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
              <template
                #actions
                v-if="
                  item.role === 'assistant' &&
                  !(index === 0 && (loading || isStreamLoad))
                "
              >
                <t-space>
                  <t-dropdown
                    trigger="click"
                    :min-column-width="100"
                    :options="[
                      {
                        content: '复制 Markdown',
                        value: 'markdown',
                        onClick: () => copyContent(item.content, 'markdown'),
                      },
                      {
                        content: '复制 HTML',
                        value: 'html',
                        onClick: () => copyContent(item.content, 'html'),
                      },
                    ]"
                  >
                    <t-button theme="default" variant="text" size="small">
                      <template #icon><t-icon name="file-copy" /></template>
                      复制
                      <t-icon
                        name="chevron-down"
                        size="small"
                        style="margin-left: 4px"
                      />
                    </t-button>
                  </t-dropdown>
                  <t-button
                    theme="default"
                    variant="text"
                    size="small"
                    :loading="cardsGeneratingMap.get(index)"
                    @click="generateCards(item, index)"
                  >
                    <template #icon><t-icon name="layers" /></template>
                    生成卡片
                  </t-button>
                  <t-dropdown
                    trigger="click"
                    :min-column-width="100"
                    :options="modelOptions.map((opt: ModelOption) => ({
                      content: opt.label,
                      value: opt.value,
                      onClick: () => regenerateWithModel(opt.value),
                    }))"
                  >
                    <t-button theme="default" variant="text" size="small">
                      <template #icon><t-icon name="refresh" /></template>
                      重新生成
                      <t-icon
                        name="chevron-down"
                        size="small"
                        style="margin-left: 4px"
                      />
                    </t-button>
                  </t-dropdown>
                  <t-button
                    v-if="item.history?.length"
                    theme="default"
                    variant="text"
                    size="small"
                    @click="switchHistory(item)"
                  >
                    <template #icon><t-icon name="swap" /></template>
                    切换历史回复({{ item.history.length }})
                  </t-button>
                </t-space>
              </template>
            </t-chat-item>
          </template>
          <template #footer>
            <t-chat-input
              :stop-disabled="isStreamLoad"
              @send="handleSend"
              @stop="handleStop"
            />
          </template>
        </t-chat>
      </div>
    </div>
  </template>

  <Drawer
    v-model:visible="showCardsDrawer"
    :width="600"
    :mask="true"
    :closable="true"
    :footer="false"
    :unmount-on-close="false"
    @cancel="showCardsDrawer = false"
  >
    <template #title>
      <div class="drawer-header">
        <div class="drawer-title">
          已生成的卡片 ({{ currentCards.length }}张)
        </div>
        <div class="drawer-actions">
          <a-button
            type="text"
            status="danger"
            size="small"
            @click="clearAllCards"
            v-if="currentCards.length > 0"
          >
            <template #icon><icon-delete /></template>
            清空
          </a-button>
        </div>
      </div>
    </template>
    <div class="cards-preview">
      <div v-if="currentCards.length === 0" class="empty-state">
        还没有生成任何卡片
      </div>
      <div v-else class="cards-list">
        <div
          v-for="(card, index) in currentCards"
          :key="index"
          class="card-item"
          :class="{ 'card-checked': index === lastCheckedCardIndex }"
        >
          <div class="card-content">
            <div class="card-question">
              <strong>问题: </strong>
              <div class="md-wrapper" v-if="!card.isEditing">
                <MdViewer :value="card.question" />
                <a-button
                  type="text"
                  size="small"
                  class="edit-button"
                  @click="card.isEditing = true"
                >
                  <template #icon><icon-edit /></template>
                  编辑
                </a-button>
              </div>
              <div v-else class="md-editor-wrapper">
                <MdEditor
                  :value="card.question"
                  :handle-change="(value: string) => (card.question = value)"
                />
                <div class="editor-actions">
                  <a-button
                    type="text"
                    status="success"
                    size="small"
                    @click="handleCardEdit(card)"
                  >
                    <template #icon><icon-check /></template>
                    完成
                  </a-button>
                </div>
              </div>
            </div>
            <div class="card-answer">
              <strong>答案: </strong>
              <div class="md-wrapper" v-if="!card.isEditingAnswer">
                <MdViewer :value="card.answer" />
                <a-button
                  type="text"
                  size="small"
                  class="edit-button"
                  @click="card.isEditingAnswer = true"
                >
                  <template #icon><icon-edit /></template>
                  编辑
                </a-button>
              </div>
              <div v-else class="md-editor-wrapper">
                <MdEditor
                  :value="card.answer"
                  :handle-change="(value: string) => (card.answer = value)"
                />
                <div class="editor-actions">
                  <a-button
                    type="text"
                    status="success"
                    size="small"
                    @click="handleAnswerEdit(card)"
                  >
                    <template #icon><icon-check /></template>
                    完成
                  </a-button>
                </div>
              </div>
            </div>
            <div class="card-tags">
              <strong>标签: </strong>
              <a-input-tag
                v-model="card.tags"
                :default-value="card.tags"
                allow-clear
                placeholder="请输入标签"
                @change="handleTagsChange"
              />
            </div>
            <div class="card-actions">
              <t-button
                theme="default"
                variant="text"
                size="small"
                @click.stop="checkCard(card, index)"
              >
                <template #icon><t-icon name="check-circle" /></template>
                智能检查
              </t-button>
              <t-dropdown
                trigger="click"
                :min-column-width="120"
                :options="[
                  {
                    content: '更新问题',
                    value: 'question',
                    onClick: () => updateCurrentCard(card, 'question'),
                  },
                  {
                    content: '更新答案',
                    value: 'answer',
                    onClick: () => updateCurrentCard(card, 'answer'),
                  },
                  {
                    content: '更新标签',
                    value: 'tags',
                    onClick: () => updateCurrentCard(card, 'tags'),
                  },
                  {
                    content: '更新全部',
                    value: 'all',
                    onClick: () => updateCurrentCard(card, 'all'),
                  },
                ]"
              >
                <t-button theme="primary" variant="text" size="small">
                  <template #icon><t-icon name="upload" /></template>
                  更新到当前卡片
                  <t-icon
                    name="chevron-down"
                    size="small"
                    style="margin-left: 4px"
                  />
                </t-button>
              </t-dropdown>
              <t-button
                theme="primary"
                variant="text"
                size="small"
                @click.stop="saveToCardLibrary(card, index)"
              >
                <template #icon><t-icon name="save" /></template>
                收入卡片库
              </t-button>
              <t-button
                theme="danger"
                variant="text"
                size="small"
                @click.stop="deleteCard(index)"
              >
                <template #icon><t-icon name="delete" /></template>
                删除卡片
              </t-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Drawer>

  <SessionManager
    v-model:visible="isSessionsDrawerVisible"
    :current-model="currentModel"
    :current-prompt-id="currentPromptId"
    :messages="chatList"
    @session-switch="handleSessionSwitch"
    @session-create="handleSessionCreate"
  />

  <t-dialog
    v-model:visible="isSettingVisible"
    header="系统提示词管理"
    :footer="false"
    width="540"
  >
    <div class="prompts-manager">
      <div class="prompts-list">
        <div class="prompts-header">
          <span class="section-title">提示词列表</span>
          <t-button theme="primary" size="small" @click="addNewPrompt">
            <template #icon>
              <t-icon name="add" />
            </template>
            新建提示词
          </t-button>
        </div>
        <t-list>
          <t-list-item
            v-for="prompt in prompts"
            :key="prompt.id"
            :class="{
              'active-prompt': currentPromptId === prompt.id,
              'system-preset': prompt.id === 'system-preset',
            }"
          >
            <div class="prompt-item">
              <div class="prompt-info" @click="selectPrompt(prompt.id)">
                <span class="prompt-name">{{ prompt.name }}</span>
              </div>
              <div class="prompt-actions" v-if="prompt.id !== 'system-preset'">
                <t-button
                  theme="default"
                  variant="text"
                  size="small"
                  @click="editPrompt(prompt)"
                >
                  <template #icon><t-icon name="edit" /></template>
                </t-button>
                <t-button
                  theme="danger"
                  variant="text"
                  size="small"
                  @click="deletePrompt(prompt.id)"
                >
                  <template #icon><t-icon name="delete" /></template>
                </t-button>
              </div>
            </div>
          </t-list-item>
        </t-list>
      </div>
      <div class="prompt-editor">
        <span class="section-title">{{
          isNewPrompt ? "新建提示词" : "编辑提示词"
        }}</span>
        <t-input
          v-model="editingPrompt.name"
          class="prompt-name-input"
          placeholder="请输入提示词名称"
        />
        <t-textarea
          v-model="editingPrompt.content"
          class="prompt-content-input"
          placeholder="请输入提示词内容..."
          :autosize="{ minRows: 10, maxRows: 15 }"
        />
        <div class="editor-actions">
          <t-button
            theme="default"
            @click="editingPrompt = { id: '', name: '', content: '' }"
          >
            清空
          </t-button>
          <t-button theme="primary" @click="savePrompt"> 保存 </t-button>
        </div>
      </div>
    </div>
  </t-dialog>

  <a-modal
    v-model:visible="isConfirmClearVisible"
    @ok="confirmClearAllCards"
    @cancel="isConfirmClearVisible = false"
    :closable="true"
    :mask-closable="false"
    :ok-text="'确认'"
    :cancel-text="'取消'"
    :ok-button-props="{ status: 'danger' }"
  >
    <template #title>确认清空</template>
    确定要清空所有已生成的卡片吗？此操作不可恢复。
  </a-modal>

  <a-modal
    v-model:visible="isUpdateConfirmVisible"
    @ok="confirmUpdate"
    @cancel="cancelUpdate"
    :closable="true"
    :mask-closable="false"
    :ok-text="'确认'"
    :cancel-text="'取消'"
  >
    <template #title>确认更新</template>
    确定要用所选内容更新当前正在复习的卡片吗？此操作不可撤销。
  </a-modal>
  <!-- 在其他 modal 组件后添加 -->
  <a-modal
    v-model:visible="isTagsSelectModalVisible"
    title="选择要保留的标签"
    @ok="confirmTagsSelect"
    @cancel="cancelTagsSelect"
    :mask-closable="false"
    :closable="true"
    :ok-text="'确认'"
    :cancel-text="'取消'"
  >
    <div class="tags-selection">
      <div class="tags-section">
        <div class="section-title">当前复习卡片的标签</div>
        <a-space wrap>
          <a-checkbox-group v-model="selectedExistingTags">
            <template v-for="tag in existingTags" :key="tag">
              <a-checkbox :value="tag">{{ tag }}</a-checkbox>
            </template>
          </a-checkbox-group>
        </a-space>
      </div>
      <div class="tags-section" v-if="newTags.length > 0">
        <div class="section-title">生成卡片的标签</div>
        <a-space wrap>
          <a-checkbox-group v-model="selectedNewTags">
            <template v-for="tag in newTags" :key="tag">
              <a-checkbox :value="tag">{{ tag }}</a-checkbox>
            </template>
          </a-checkbox-group>
        </a-space>
      </div>
    </div>
  </a-modal>
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
  computed,
  h,
  onUnmounted,
  PropType,
} from "vue";
import { eventStreamService } from "@/services/EventStreamService";
import { ChatControllerService } from "../../generated/services/ChatControllerService";
import { AIChatRequest } from "../../generated/models/AIChatRequest";
import type { ChatMessage, ChatProps, ChatEvents } from "@/types/chat";
import { Message, Drawer } from "@arco-design/web-vue";
import { IconClose } from "@arco-design/web-vue/es/icon";
import SessionManager from "./SessionManager.vue";
import MdViewer from "./MdViewer.vue";
import MdEditor from "./MdEditor.vue";
import { CardControllerService } from "../../generated/services/CardControllerService";
import { CardAddRequest } from "../../generated/models/CardAddRequest";
import { marked } from "marked";

interface HistoryResponse {
  content: string;
  datetime: string;
}

interface ChatSession {
  id: string;
  sessionId: string;
  name: string;
  messages: (ChatMessage & { history?: HistoryResponse[] })[];
  model: AIChatRequest.model;
  promptId: string;
  lastUpdated: string;
}

interface Card {
  id?: string;
  question: string;
  answer: string;
  tags: string[];
  isEditing?: boolean;
  isEditingAnswer?: boolean;
}

interface ModelOption {
  value: AIChatRequest.model;
  label: string;
}

interface Props {
  userAvatar?: string;
  aiAvatar?: string;
  userName?: string;
  aiName?: string;
  title?: string;
  height?: string;
  draggable?: boolean;
  showClear?: boolean;
  embedded?: boolean;
  initialDefaultTags?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  userAvatar: "https://tdesign.gtimg.com/site/avatar.jpg",
  aiAvatar: "https://tdesign.gtimg.com/site/chat-avatar.png",
  userName: "自己",
  aiName: "AI助手",
  title: "AI助手",
  height: "600px",
  draggable: true,
  showClear: true,
  embedded: false,
  initialDefaultTags: () => [],
});

const emit = defineEmits<{
  (e: "send", value: string): void;
  (e: "stop"): void;
  (e: "clear"): void;
  (e: "close"): void;
  (e: "session-create", session: ChatSession): void;
  (
    e: "update-current-card",
    data: {
      type: "question" | "answer" | "tags" | "all";
      data: {
        question: string;
        answer: string;
        tags: string[];
      };
    }
  ): void;
  (e: "cards-drawer-change", value: boolean): void;
  (e: "tags-change", tags: string[]): void;
}>();

const STORAGE_KEY = "ai_chat_model";
const CARDS_STORAGE_KEY = "ai_generated_cards";
const SESSIONS_STORAGE_KEY = "ai_chat_sessions";
const CURRENT_SESSION_KEY = "ai_chat_current_session";

const getSavedModel = (): AIChatRequest.model => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? (saved as AIChatRequest.model) : AIChatRequest.model.BASIC;
};

const saveModelSelection = (model: AIChatRequest.model) => {
  localStorage.setItem(STORAGE_KEY, model);
};

const loadSavedCards = () => {
  try {
    const saved = localStorage.getItem(CARDS_STORAGE_KEY);
    if (!saved) {
      return [];
    }
    const cards = JSON.parse(saved);
    return cards.map((card: Card) => ({
      ...card,
      isEditing: false,
      isEditingAnswer: false,
    }));
  } catch (error) {
    console.error("Failed to load cards:", error);
    return [];
  }
};

const saveCards = (cards: Card[]) => {
  try {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch (error) {
    console.error("Failed to save cards to localStorage:", error);
  }
};

const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const visible = ref(false);
const loading = ref(false);
const isStreamLoad = ref(false);
const currentSessionId = ref<string>("");
const currentRequestId = ref<string>("");
const showCardsDrawer = ref(false);
const currentCards = ref<Card[]>(loadSavedCards());
const cardsGeneratingMap = ref<Map<number, boolean>>(new Map());
const currentModel = ref<AIChatRequest.model>(getSavedModel());
const isFirstShow = ref(true);
const defaultTags = ref<string[]>([]);

const TAGS_STORAGE_KEY = "ai_chat_default_tags";

const loadSavedTags = () => {
  try {
    const saved = localStorage.getItem(TAGS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to load default tags:", error);
    return [];
  }
};

const saveDefaultTags = (tags: string[]) => {
  try {
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
  } catch (error) {
    console.error("Failed to save default tags:", error);
  }
};

const handleDefaultTagsChange = (value: any[], ev: Event) => {
  defaultTags.value = value.map((tag) => {
    if (typeof tag === "object" && tag.value !== undefined) {
      return String(tag.value);
    }
    return String(tag);
  });
  saveDefaultTags(defaultTags.value);
  // 触发标签变化事件
  emit("tags-change", defaultTags.value);
};

interface TagData {
  value: string | number;
  label?: string;
  closable?: boolean;
  [key: string]: any;
}

const chatList = ref<(ChatMessage & { history?: HistoryResponse[] })[]>([
  {
    avatar: props.aiAvatar,
    name: props.aiName,
    datetime: new Date().toLocaleString(),
    content: "你好！我是AI助手，有什么我可以帮你的吗？",
    role: "assistant",
  },
]);
const isSessionsDrawerVisible = ref(false);

const lastCheckedCardIndex = ref<number | null>(null);

const isConfirmClearVisible = ref(false);

const isUpdateConfirmVisible = ref(false);
const updateType = ref<"question" | "answer" | "tags" | "all">("all");
const updateCard = ref<Card | null>(null);

const createNewCardSession = () => {
  console.log("Creating new card session");
  if (!currentSessionId.value) {
    currentSessionId.value = generateUUID();
    console.log("Generated new sessionId:", currentSessionId.value);
  }
  chatList.value = [
    {
      avatar: props.aiAvatar,
      name: props.aiName,
      datetime: new Date().toLocaleString(),
      content: "你好！我是AI助手，有什么我可以帮你的吗？",
      role: "assistant",
    },
  ];

  const sessions = JSON.parse(
    localStorage.getItem(SESSIONS_STORAGE_KEY) || "[]"
  );
  if (sessions.length > 0) {
    sessions[0].sessionId = currentSessionId.value;
    sessions[0].messages = chatList.value;
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    console.log("Updated sessionId in storage:", currentSessionId.value);
  }
};

const handleSessionSwitch = (session: ChatSession) => {
  console.log("Switching to session:", session);
  chatList.value = session.messages;
  currentModel.value = session.model;
  currentPromptId.value = session.promptId;
  currentSessionId.value = session.sessionId;
  console.log("Current sessionId set to:", currentSessionId.value);
};

const handleSessionCreate = (session: ChatSession) => {
  console.log("Creating new session:", session);
  chatList.value = session.messages;
  currentModel.value = session.model;
  currentPromptId.value = session.promptId;
  currentSessionId.value = session.sessionId;

  localStorage.setItem(CURRENT_SESSION_KEY, session.id);

  console.log("Switched to new session with sessionId:", session.sessionId);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.altKey && e.key.toLowerCase() === "c") {
    e.preventDefault();
    showCardsDrawer.value = true;
  }
  if (e.altKey && e.key.toLowerCase() === "s") {
    e.preventDefault();
    isSessionsDrawerVisible.value = true;
  }
};

onMounted(() => {
  currentCards.value = loadSavedCards();
  defaultTags.value = loadSavedTags();

  document.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeyDown);
});

const handleSend = async (inputValue: string) => {
  if (isStreamLoad.value || !inputValue) return;

  console.log("Sending message with sessionId:", currentSessionId.value);
  const userMessage: ChatMessage = {
    avatar: props.userAvatar,
    name: props.userName,
    datetime: new Date().toLocaleString(),
    content: inputValue,
    role: "user",
  };
  chatList.value.unshift(userMessage);

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

    const res = await ChatControllerService.chat({
      model: currentModel.value,
      content: inputValue,
      sessionId: currentSessionId.value,
      prompt: systemPrompt.value || undefined,
    });

    if (res.code == 200 && res.data) {
      currentRequestId.value = res.data;
      emit("send", inputValue);

      let accumulatedContent = "";
      await eventStreamService.waitForStreamingResult(
        currentRequestId.value,
        (newContent: string) => {
          loading.value = false;
          const addedContent = newContent.slice(accumulatedContent.length);
          accumulatedContent = newContent;
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

const handleClear = () => {
  currentSessionId.value = "";
  createNewCardSession();
  emit("clear");
};

const handleClose = () => {
  visible.value = false;
  emit("close");
};

const modelOptions: ModelOption[] = [
  { value: AIChatRequest.model.BASIC, label: "基础模型" },
  { value: AIChatRequest.model.A1, label: "A1 模型" },
  { value: AIChatRequest.model.A2, label: "A2 模型" },
  { value: AIChatRequest.model.PLUS, label: "Plus 模型" },
  { value: AIChatRequest.model.GEMINI_1_5_PRO_EXP, label: "Gemini 1.5 Pro" },
  { value: AIChatRequest.model.GEMINI_2_0_FLASH_EXP, label: "Gemini 2.0" },
];

watch(currentModel, (newModel) => {
  saveModelSelection(newModel);
});

interface PromptItem {
  id: string;
  name: string;
  content: string;
}

const PROMPTS_STORAGE_KEY = "ai_chat_prompts";
const CURRENT_PROMPT_KEY = "ai_chat_current_prompt";

const SYSTEM_PRESET_PROMPT: PromptItem = {
  id: "system-preset",
  name: "系统预设",
  content: `你是一个专业的教育辅导助手，负责审查和优化用户创建的闪卡内容。你的主要任务包括：

1. 验证内容准确性：检查问题和答案中的事实、概念和解释是否准确。
2. 评估完整性：确保答案完整地回答了问题，包含了必要的细节和解释。
3. 检查语言流畅性：确保问题和答案表述清晰、简洁、易懂。
4. 提供优化建议：针对内容、结构和表达方式提供改进建议，使其更适合 Anki 复习。

请以专业、友好的语气提供反馈，并给出具体的修改建议。`,
};

const getSavedPrompts = (): PromptItem[] => {
  const saved = localStorage.getItem(PROMPTS_STORAGE_KEY);
  const userPrompts = saved ? JSON.parse(saved) : [];
  return [SYSTEM_PRESET_PROMPT, ...userPrompts];
};

const getCurrentPromptId = (): string => {
  return localStorage.getItem(CURRENT_PROMPT_KEY) || "";
};

const savePrompts = (prompts: PromptItem[]) => {
  const userPrompts = prompts.filter((p) => p.id !== SYSTEM_PRESET_PROMPT.id);
  localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(userPrompts));
};

const saveCurrentPromptId = (id: string) => {
  localStorage.setItem(CURRENT_PROMPT_KEY, id);
};

const prompts = ref<PromptItem[]>(getSavedPrompts());
const currentPromptId = ref<string>(getCurrentPromptId());
const isSettingVisible = ref(false);
const editingPrompt = ref<PromptItem>({
  id: "",
  name: "",
  content: "",
});
const isNewPrompt = ref(false);

// 在其他 ref 声明后添加
const isTagsSelectModalVisible = ref(false);
const existingTags = ref<string[]>([]);
const newTags = ref<string[]>([]);
const selectedExistingTags = ref<string[]>([]);
const selectedNewTags = ref<string[]>([]);
const pendingUpdateCard = ref<Card | null>(null);
const pendingUpdateType = ref<"tags" | "all" | null>(null);

const systemPrompt = computed(() => {
  if (currentPromptId.value === SYSTEM_PRESET_PROMPT.id) {
    return "";
  }
  const current = prompts.value.find((p) => p.id === currentPromptId.value);
  return current?.content || "";
});

const showSettings = () => {
  isSettingVisible.value = true;
};

const addNewPrompt = () => {
  isNewPrompt.value = true;
  editingPrompt.value = {
    id: generateUUID(),
    name: "",
    content: "",
  };
};

const editPrompt = (prompt: PromptItem) => {
  isNewPrompt.value = false;
  editingPrompt.value = { ...prompt };
};

const deletePrompt = (id: string) => {
  if (id === SYSTEM_PRESET_PROMPT.id) return;
  prompts.value = prompts.value.filter((p) => p.id !== id);
  if (currentPromptId.value === id) {
    currentPromptId.value = "";
  }
  savePrompts(prompts.value);
  saveCurrentPromptId(currentPromptId.value);
  Message.success("删除提示词成功");
};

const savePrompt = () => {
  if (!editingPrompt.value.name.trim() || !editingPrompt.value.content.trim()) {
    Message.warning("请填写提示词名称和内容");
    return;
  }

  if (isNewPrompt.value) {
    prompts.value.push({ ...editingPrompt.value });
    Message.success("新建提示词成功");
  } else {
    const index = prompts.value.findIndex(
      (p) => p.id === editingPrompt.value.id
    );
    if (index !== -1) {
      prompts.value[index] = { ...editingPrompt.value };
      Message.success("更新提示词成功");
    }
  }

  savePrompts(prompts.value);
  editingPrompt.value = { id: "", name: "", content: "" };
};

const selectPrompt = (id: string) => {
  currentPromptId.value = id;
  saveCurrentPromptId(id);

  const selectedPrompt = prompts.value.find((p) => p.id === id);
  if (selectedPrompt) {
    Message.success(`已切换到${selectedPrompt.name}提示词`);
    chatList.value.unshift({
      avatar: props.aiAvatar,
      name: props.aiName,
      datetime: new Date().toLocaleString(),
      content: `已切换到${selectedPrompt.name}提示词`,
      role: "model-change",
    });
  }
};

const generateCards = async (item: ChatMessage, index: number) => {
  try {
    console.log("Starting card generation...");
    cardsGeneratingMap.value.set(index, true);

    const currentIndex = chatList.value.findIndex((msg) => msg === item);
    const userQuestion = chatList.value[currentIndex + 1];

    if (!userQuestion || userQuestion.role !== "user") {
      Message.warning("未找到对应的问题");
      return;
    }

    const combinedContent = `问题：${userQuestion.content}\n\n回答：${item.content}`;

    const res = await ChatControllerService.getCards({
      model: currentModel.value,
      content: combinedContent,
    });

    console.log("API response:", res);

    if (res.code == 200 && res.data) {
      const requestId = res.data;
      console.log("Got requestId:", requestId);

      try {
        const result = await eventStreamService.waitForResult(requestId);
        console.log("Cards result:", result);

        if (result && result.cards && result.cards.length > 0) {
          const newCards = result.cards.map((card: Card) => ({
            ...card,
            tags: [...(card.tags || []), ...defaultTags.value],
            isEditing: false,
            isEditingAnswer: false,
          }));

          currentCards.value = [...newCards, ...currentCards.value];

          showCardsDrawer.value = true;
          Message.success(`成功生成 ${result.cards.length} 张卡片`);
        } else {
          console.warn("No cards in result:", result);
          Message.warning("未生成任何卡片");
        }
      } catch (waitError) {
        console.error("Error waiting for result:", waitError);
        throw waitError;
      }
    }
  } catch (error) {
    console.error("Generate cards error:", error);
    Message.error("生成卡片失败");
  } finally {
    cardsGeneratingMap.value.delete(index);
  }
};

const deleteCard = (index: number) => {
  currentCards.value.splice(index, 1);
  Message.success("删除成功");
};

const clearAllCards = () => {
  isConfirmClearVisible.value = true;
};

const confirmClearAllCards = () => {
  currentCards.value = [];
  showCardsDrawer.value = false;
  isConfirmClearVisible.value = false;
  Message.success("已清空所有卡片");
};

watch(showCardsDrawer, (newVal) => {
  console.log(
    "showCardsDrawer changed:",
    newVal,
    "currentCards:",
    currentCards.value
  );
});

watch(
  currentCards,
  (newCards) => {
    try {
      saveCards(newCards);
    } catch (error) {
      console.error("Failed to auto-save cards:", error);
    }
  },
  { deep: true }
);

const operation = (type: string, options: any) => {
  console.log(type, options);
};

const handleStop = () => {
  if (isStreamLoad.value && currentRequestId.value) {
    eventStreamService.cancelRequest(currentRequestId.value);
    loading.value = false;
    isStreamLoad.value = false;
    emit("stop");
  }
};

const copyContent = async (content: string, format: "markdown" | "html") => {
  try {
    let textToCopy = content;

    if (format === "html") {
      textToCopy = await Promise.resolve(marked(content));
    }

    await navigator.clipboard.writeText(textToCopy);
    Message.success(
      `已复制为 ${format === "markdown" ? "Markdown" : "HTML"} 格式`
    );
  } catch (err) {
    console.error("Copy failed:", err);
    Message.error("复制失败");
  }
};

const regenerateWithModel = async (model: AIChatRequest.model) => {
  if (isStreamLoad.value || chatList.value.length < 2) return;

  const lastAiMessage = chatList.value.find((msg) => msg.role === "assistant");
  const lastUserMessage = chatList.value.find((msg) => msg.role === "user");
  if (!lastAiMessage || !lastUserMessage) return;

  currentModel.value = model;
  loading.value = true;
  isStreamLoad.value = true;

  try {
    const res = await ChatControllerService.chat({
      model: currentModel.value,
      content: lastUserMessage.content,
      sessionId: currentSessionId.value,
      prompt: systemPrompt.value || undefined,
    });

    if (res.code == 200 && res.data) {
      currentRequestId.value = res.data;

      if (!lastAiMessage.history) {
        lastAiMessage.history = [];
      }
      lastAiMessage.history.push({
        content: lastAiMessage.content,
        datetime: lastAiMessage.datetime,
      });

      lastAiMessage.datetime = new Date().toLocaleString();

      lastAiMessage.content = "";

      let accumulatedContent = "";
      await eventStreamService.waitForStreamingResult(
        currentRequestId.value,
        (newContent: string) => {
          loading.value = false;
          const addedContent = newContent.slice(accumulatedContent.length);
          accumulatedContent = newContent;
          lastAiMessage.content = newContent;
        }
      );
    }
  } catch (error) {
    console.error("Regenerate error:", error);
    lastAiMessage.content = "抱歉，发生了错误，请稍后重试";
  } finally {
    loading.value = false;
    isStreamLoad.value = false;
  }
};

const switchHistory = (item: ChatMessage & { history?: HistoryResponse[] }) => {
  if (!item.history?.length) return;

  const currentContent = item.content;
  const currentDatetime = item.datetime;

  item.history.push({
    content: currentContent,
    datetime: currentDatetime,
  });

  const lastHistory = item.history.shift()!;
  item.content = lastHistory.content;
  item.datetime = lastHistory.datetime;
};

const checkCard = async (card: any, index: number) => {
  showCardsDrawer.value = false;

  currentCards.value.splice(index, 1);
  currentCards.value.unshift(card);
  saveCards(currentCards.value);
  lastCheckedCardIndex.value = 0;

  const sessionId = generateUUID();
  const newSession: ChatSession = {
    id: generateUUID(),
    sessionId: sessionId,
    name:
      card.question.length > 30
        ? card.question.slice(0, 30) + "..."
        : card.question,
    messages: [
      {
        avatar: props.aiAvatar,
        name: props.aiName,
        datetime: new Date().toLocaleString(),
        content: "你好！我是AI助手，有什么我可以帮你的吗？",
        role: "assistant",
      },
    ],
    model: currentModel.value,
    promptId: currentPromptId.value,
    lastUpdated: new Date().toLocaleString(),
  };

  const allSessions = JSON.parse(
    localStorage.getItem(SESSIONS_STORAGE_KEY) || "[]"
  );
  allSessions.push(newSession);
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(allSessions));

  console.log("Creating new session for card check:", newSession);
  emit("session-create", newSession);

  await new Promise((resolve) => setTimeout(resolve, 100));

  const checkContent = `请帮我检查这张卡片的内容：\n\n问题：${
    card.question
  }\n\n答案：${card.answer}\n\n标签：${card.tags.join(", ")}`;

  visible.value = true;
  await handleSend(checkContent);
};

const saveToCardLibrary = async (card: Card, index: number) => {
  try {
    const cardAddRequest: CardAddRequest = {
      question: card.question,
      answer: card.answer,
      tags: card.tags,
      group: "all",
    };

    const response = await CardControllerService.createCard(cardAddRequest);

    if (response.code === 200 && response.data) {
      currentCards.value.splice(index, 1);
      Message.success("已成功添加到卡片库");
    } else {
      Message.error("添加到卡片库失败");
    }
  } catch (error) {
    console.error("Save to card library error:", error);
    Message.error("添加到卡片库失败");
  }
};

const sendMessage = async (message: string) => {
  await handleSend(message);
};

const generateCardsFromText = async (text: string) => {
  try {
    console.log("Starting direct card generation...");
    const res = await ChatControllerService.getCards({
      model: currentModel.value,
      content: text,
    });

    console.log("API response:", res);

    if (res.code == 200 && res.data) {
      const requestId = res.data;
      console.log("Got requestId:", requestId);

      try {
        const result = await eventStreamService.waitForResult(requestId);
        console.log("Cards result:", result);

        if (result && result.cards && result.cards.length > 0) {
          const newCards = result.cards.map((card: Card) => ({
            ...card,
            isEditing: false,
            isEditingAnswer: false,
          }));

          currentCards.value = [...newCards, ...currentCards.value];

          showCardsDrawer.value = true;
          Message.success(`成功生成 ${result.cards.length} 张卡片`);
        } else {
          console.warn("No cards in result:", result);
          Message.warning("未生成任何卡片");
        }
      } catch (waitError) {
        console.error("Error waiting for result:", waitError);
        throw waitError;
      }
    }
  } catch (error) {
    console.error("Generate cards error:", error);
    Message.error("生成卡片失败");
  }
};

// 添加设置默认标签的方法
const setDefaultTags = (tags: string[]) => {
  defaultTags.value = tags;
  handleDefaultTagsChange(tags);
};

// 对外暴露方法
defineExpose({
  show: () => {
    visible.value = true;
  },
  hide: () => {
    visible.value = false;
  },
  clear: handleClear,
  sendMessage,
  showCardsDrawer: () => {
    showCardsDrawer.value = true;
  },
  generateCardsFromText,
  getCurrentModel: () => currentModel.value,
  setDefaultTags,
});

watch(visible, (newVal) => {
  if (!newVal) {
    emit("close");
  }
});

const handleCardEdit = (card: Card) => {
  card.isEditing = false;
  saveCards(currentCards.value);
  Message.success("保存成功");
};

const handleAnswerEdit = (card: Card) => {
  card.isEditingAnswer = false;
  saveCards(currentCards.value);
  Message.success("保存成功");
};

const handleTagsChange = () => {
  saveCards(currentCards.value);
  Message.success("标签已保存");
};

const handleQuestionChange = (value: string) => {
  if (currentCards.value.length > 0) {
    currentCards.value[0].question = value;
  }
};

const handleAnswerChange = (value: string) => {
  if (currentCards.value.length > 0) {
    currentCards.value[0].answer = value;
  }
};

const updateCurrentCard = async (
  card: Card,
  type: "question" | "answer" | "tags" | "all"
) => {
  if (type === "tags" || type === "all") {
    pendingUpdateCard.value = card;
    pendingUpdateType.value = type;

    // 通过 emit 获取当前复习的卡片
    const reviewCard = await new Promise((resolve) => {
      emit("get-current-review-card", (card: Card) => {
        resolve(card);
      });
    });

    // 设置现有标签（当前复习的抽认卡的标签）
    existingTags.value = (reviewCard as Card)?.tags || [];
    selectedExistingTags.value = [...existingTags.value];

    // 设置新标签（当前生成卡片的标签）
    newTags.value = card.tags || [];
    selectedNewTags.value = [...newTags.value];

    // 打印调试信息
    console.log("Current review card tags:", existingTags.value);
    console.log("Generated card tags:", newTags.value);

    isTagsSelectModalVisible.value = true;
  } else {
    updateCard.value = card;
    updateType.value = type;
    isUpdateConfirmVisible.value = true;
  }
};

const confirmTagsSelect = async () => {
  if (!pendingUpdateCard.value || !pendingUpdateType.value) return;

  try {
    const finalTags = [...selectedExistingTags.value, ...selectedNewTags.value];

    const emitData = {
      type: pendingUpdateType.value,
      data: {
        question: pendingUpdateCard.value.question,
        answer: pendingUpdateCard.value.answer,
        tags: finalTags,
      },
    };

    emit("update-current-card", emitData);
    emit("cards-drawer-change", true);

    // 从当前卡片列表中找到并删除这张卡片
    const index = currentCards.value.findIndex(
      (card) => card.id === pendingUpdateCard.value?.id
    );
    if (index !== -1) {
      currentCards.value.splice(index, 1);
    }

    Message.success("更新成功");
    isTagsSelectModalVisible.value = false;
  } catch (error) {
    console.error("Update card error:", error);
    Message.error("更新失败");
  }
};

const cancelTagsSelect = () => {
  isTagsSelectModalVisible.value = false;
  pendingUpdateCard.value = null;
  pendingUpdateType.value = null;
};

const confirmUpdate = async () => {
  if (!updateCard.value) return;

  try {
    const emitData = {
      type: updateType.value,
      data: {
        question: updateCard.value.question,
        answer: updateCard.value.answer,
        tags: updateCard.value.tags,
      },
    };

    emit("update-current-card", emitData);
    // 通知父组件抽屉状态变化
    emit("cards-drawer-change", true);

    // 从当前卡片列表中找到并删除这张卡片
    const index = currentCards.value.findIndex(
      (card) => card.id === updateCard.value?.id
    );
    if (index !== -1) {
      currentCards.value.splice(index, 1);
    }

    Message.success("更新成功");
    isUpdateConfirmVisible.value = false;
  } catch (error) {
    console.error("Update card error:", error);
    Message.error("更新失败");
  }
};

const cancelUpdate = () => {
  isUpdateConfirmVisible.value = false;
  updateCard.value = null;
};

const handleShowCardsDrawer = () => {
  showCardsDrawer.value = true;
  emit("cards-drawer-change", true);
};

watch(showCardsDrawer, (newValue) => {
  if (!newValue) {
    emit("cards-drawer-change", false);
  }
});
</script>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 0;
}

.chat-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.model-selector-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 32px;
}

.model-selector {
  width: 140px;
  transition: all 0.3s ease;
  height: 100%;
}

.model-selector :deep(.t-select-input) {
  background: transparent;
  border: none;
  border-radius: 8px;
  height: 100%;
  padding: 0 8px;
  padding-right: 4px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.model-selector :deep(.t-input__wrap) {
  border: none !important;
  background: transparent !important;
  height: 100%;
  display: flex;
  align-items: center;
}

.model-selector :deep(.t-input) {
  border: none !important;
  background: transparent !important;
  height: 100%;
  display: flex;
  align-items: center;
}

.model-selector :deep(.t-select-input:hover) {
  background: var(--td-bg-color-container-hover);
}

.model-selector :deep(.t-select-input--active) {
  background: var(--td-bg-color-container-hover);
}

.model-selector :deep(.t-select-input__prefix-icon) {
  color: var(--td-brand-color);
  font-size: 18px;
  margin-right: 8px;
}

.model-selector :deep(.t-select-input__suffix-icon) {
  display: none;
}

.model-selector :deep(.t-select-input--active .t-select-input__suffix-icon) {
  display: none;
}

:deep(.model-selector-popup) {
  min-width: 140px !important;

  .t-select-option {
    margin: 2px 4px;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      background: var(--td-bg-color-container-hover);
      transform: translateX(4px);
    }

    &.t-is-selected {
      color: var(--td-brand-color);
      background: var(--td-brand-color-light);
      font-weight: 500;
    }
  }
}

:deep(.t-dialog__close) {
  right: 16px;
  top: 16px;
}

.t-chat {
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-medium);
}

:deep(.t-dialog__header) {
  border-bottom: none;
  padding: 16px 20px;
  margin: 0;
}

:deep(.t-dialog__header-content) {
  padding: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
}

.header-actions :deep(.t-button) {
  color: var(--td-text-color-secondary);

  &:hover {
    color: var(--td-brand-color);
    background: var(--td-bg-color-container-hover);
  }
}

.prompts-manager {
  display: flex;
  gap: 20px;
  height: 410px;
}

.prompts-list {
  width: 200px;
  border-right: 1px solid var(--td-component-border);
  padding-right: 20px;
  display: flex;
  flex-direction: column;
}

.prompts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.prompt-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.prompt-info {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  cursor: pointer;
}

.prompt-name {
  font-size: 14px;
  color: var(--td-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prompt-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
  padding-right: 8px;
}

.prompt-item:hover {
  background: var(--td-bg-color-container-hover);
}

.prompt-item:hover .prompt-actions {
  opacity: 1;
}

.active-prompt {
  background: var(--td-brand-color-light);
}

.system-preset {
  background: var(--td-bg-color-container-select);
  border-left: 3px solid var(--td-brand-color);
  margin-bottom: 8px;
}

.system-preset .prompt-info {
  padding-left: 9px;
}

.system-preset:hover {
  background: var(--td-bg-color-container-select);
}

.prompt-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prompt-name-input {
  margin-bottom: 8px;
}

.prompt-content-input {
  flex: 1;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.drawer-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-1);
}

.cards-preview {
  padding: 16px;
  height: calc(100vh - 55px);
  overflow-y: auto;
}

.card-item {
  background: var(--color-bg-2);
  border: 1px solid var(--color-neutral-3);
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.card-checked {
    background: var(--td-brand-color-light);
    border-color: var(--td-brand-color);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.card-question,
.card-answer {
  margin-bottom: 12px;
  line-height: 1.6;
  width: 100%;

  strong {
    color: var(--color-text-3);
    margin-right: 8px;
    display: block;
    margin-bottom: 4px;
  }
}

.card-tags {
  color: var(--color-text-3);
  font-size: 13px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--color-neutral-3);
  width: 100%;

  strong {
    margin-right: 8px;
  }
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
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

.card-item {
  display: flex;
  gap: 8px;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--color-neutral-3);
  width: 100%;
  flex-wrap: wrap;
  justify-content: space-between;
}

.card-item:hover .card-actions {
  opacity: 1;
}

.card-actions :deep(.t-button) {
  padding: 4px 8px;
  margin-bottom: 4px;
}

.card-actions :deep(.t-button:hover) {
  background: var(--td-bg-color-container-hover);
}

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

.card-question,
.card-answer,
.card-tags {
  margin-bottom: 12px;
  line-height: 1.6;
  width: 100%;

  strong {
    color: var(--color-text-3);
    margin-right: 8px;
    display: block;
    margin-bottom: 4px;
  }
}

.card-content {
  flex: 1;
  padding: 8px;

  :deep(.arco-input-wrapper) {
    width: 100%;
  }

  :deep(.arco-textarea-wrapper) {
    width: 100%;
  }

  :deep(.arco-input-tag) {
    width: 100%;
    min-height: 32px;
  }
}

.card-item {
  background: var(--color-bg-2);
  border: 1px solid var(--color-neutral-3);
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  overflow-x: auto;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.card-checked {
    background: var(--td-brand-color-light);
    border-color: var(--td-brand-color);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
}

.md-wrapper {
  position: relative;
  border: 1px solid var(--color-neutral-3);
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
  background: var(--color-bg-1);
  overflow-x: auto;

  .edit-button {
    position: absolute;
    top: 8px;
    right: 8px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover .edit-button {
    opacity: 1;
  }
}

.md-editor-wrapper {
  margin-top: 8px;
  border: 1px solid var(--color-neutral-3);
  border-radius: 4px;
  overflow: hidden;

  .editor-actions {
    display: flex;
    justify-content: flex-end;
    padding: 8px;
    background: var(--color-bg-2);
    border-top: 1px solid var(--color-neutral-3);
  }
}

:deep(.bytemd) {
  height: auto !important;
  min-height: 200px;
}

:deep(.bytemd-toolbar) {
  border-top: none;
  border-left: none;
  border-right: none;
}

:deep(.markdown-body) {
  padding: 16px;
  background: transparent;
}

.embedded-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-medium);
  overflow: hidden;
}

.embedded-chat .chat-header {
  padding: 8px 16px;
  border-bottom: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  flex-shrink: 0;
}

.embedded-chat .chat-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.embedded-chat :deep(.t-chat) {
  height: 100% !important;
  border-radius: 0;
}

.embedded-chat :deep(.t-chat__main) {
  padding: 16px;
}

.embedded-chat :deep(.t-chat__footer) {
  border-top: 1px solid var(--td-component-border);
  padding: 16px;
}

.default-tags-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 32px;
  min-width: 200px;
}

.default-tags-input {
  width: 100%;
  transition: all 0.3s ease;
  height: 100%;
}

.default-tags-input :deep(.arco-input-tag) {
  background: transparent;
  border: none;
  border-radius: 8px;
  height: 100%;
  padding: 0 8px;
  transition: all 0.3s ease;

  &:hover {
    background: var(--td-bg-color-container-hover);
  }
}

.default-tags-input :deep(.arco-tag) {
  margin: 2px;
  background: var(--td-brand-color-light);
  border-color: var(--td-brand-color-light);
  color: var(--td-brand-color);
}

.tags-selection {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tags-section {
  .section-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--td-text-color-primary);
    margin-bottom: 8px;
  }
}

.tags-section :deep(.arco-checkbox) {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>

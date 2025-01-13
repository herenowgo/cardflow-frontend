<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Message, Modal, Upload } from "@arco-design/web-vue";
import { StudyResourceControllerService } from "../../../api/services/StudyResourceControllerService";
import type { FileListVO } from "../../../api/models/FileListVO";
import { StudyResourceRequest } from "../../../api/models/StudyResourceRequest";
import {
  IconFile,
  IconFolder,
  IconPlus,
  IconUpload,
  IconHome,
  IconUp,
  IconLink,
  IconEdit,
  IconBook,
  IconDragDotVertical,
} from "@arco-design/web-vue/es/icon";

interface CustomRequestOption {
  file: File;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

const currentPath = ref("/");
const files = ref<FileListVO[]>([]);
const loading = ref(false);
const createVisible = ref(false);
const uploadModalVisible = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// 创建资源的表单数据
const resourceForm = ref<StudyResourceRequest>({
  name: "",
  resourceType: StudyResourceRequest.resourceType.ARTICLE,
  parentPath: "/",
  content: "",
  resourceUrl: "",
});

// 获取文件列表
const fetchFiles = async (path = "/") => {
  try {
    loading.value = true;
    const response = await StudyResourceControllerService.listFiles(path);
    if (response.data) {
      files.value = response.data;
    }
  } catch (error) {
    Message.error("获取文件列表失败");
  } finally {
    loading.value = false;
  }
};

// 创建文件夹
const createFolder = async (name: string) => {
  try {
    await StudyResourceControllerService.createFolder(name, currentPath.value);
    Message.success("创建文件夹成功");
    fetchFiles(currentPath.value);
  } catch (error) {
    Message.error("创建文件夹失败");
  }
};

// 创建资源
const createResource = async () => {
  try {
    await StudyResourceControllerService.createResource(resourceForm.value);
    Message.success("创建资源成功");
    createVisible.value = false;
    fetchFiles(currentPath.value);
  } catch (error) {
    Message.error("创建资源失败");
  }
};

// 上传文件
const handleFileUpload = (file: File) => {
  StudyResourceControllerService.uploadFile({ file })
    .then(() => {
      Message.success("上传文件成功");
      createVisible.value = false;
      fetchFiles(currentPath.value);
    })
    .catch((error: Error) => {
      Message.error("上传文件失败");
    });
};

// 处理文件选择
const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    resourceForm.value.name = file.name.replace(/\.pdf$/i, "");
    handleFileUpload(file);
  }
};

// 进入文件夹
const enterFolder = (file: FileListVO) => {
  if (file.isFolder) {
    currentPath.value =
      currentPath.value === "/"
        ? `/${file.name}`
        : `${currentPath.value}/${file.name}`;
    fetchFiles(currentPath.value);
  }
};

// 返回上级目录
const goBack = () => {
  if (currentPath.value === "/") return;
  const parentPath = currentPath.value.substring(
    0,
    currentPath.value.lastIndexOf("/")
  );
  currentPath.value = parentPath || "/";
  fetchFiles(currentPath.value);
};

const getResourceTypeText = (type: string | undefined) => {
  switch (type) {
    case "PDF":
      return "PDF文档";
    case "ARTICLE":
      return "文章";
    case "NOTE":
      return "笔记";
    case "URL":
      return "在线网页";
    default:
      return "文件";
  }
};

// 处理文件选择按钮点击
const handleUploadClick = () => {
  fileInput.value?.click();
};

onMounted(() => {
  fetchFiles();
});
</script>

<template>
  <div class="resource-manager">
    <a-card class="resource-card" :bordered="false">
      <!-- 顶部操作栏 -->
      <div class="operation-bar">
        <div class="left-operations">
          <a-breadcrumb>
            <a-breadcrumb-item> <icon-home />根目录 </a-breadcrumb-item>
            <template v-if="currentPath !== '/'">
              <a-breadcrumb-item
                v-for="(path, index) in currentPath.split('/').filter(Boolean)"
                :key="index"
              >
                {{ path }}
              </a-breadcrumb-item>
            </template>
          </a-breadcrumb>
          <a-button
            type="text"
            size="small"
            @click="goBack"
            :disabled="currentPath === '/'"
          >
            <template #icon><icon-up /></template>
            返回上级
          </a-button>
        </div>
        <div class="right-operations">
          <a-button type="primary" @click="createVisible = true">
            <template #icon><icon-plus /></template>
            新建资源
          </a-button>
        </div>
      </div>

      <!-- 文件列表 -->
      <a-spin :loading="loading" class="full-height">
        <div class="resource-grid">
          <div
            v-for="item in files"
            :key="item.name"
            class="resource-item"
            @click="enterFolder(item)"
          >
            <div
              class="resource-icon"
              :class="[
                { 'is-folder': item.isFolder },
                item.resourceType?.toLowerCase(),
              ]"
            >
              <icon-folder v-if="item.isFolder" :style="{ fontSize: '48px' }" />
              <template v-else>
                <icon-book
                  v-if="item.resourceType === 'PDF'"
                  :style="{ fontSize: '48px' }"
                />
                <icon-edit
                  v-else-if="item.resourceType === 'ARTICLE'"
                  :style="{ fontSize: '48px' }"
                />
                <icon-drag-dot-vertical
                  v-else-if="item.resourceType === 'NOTE'"
                  :style="{ fontSize: '48px' }"
                />
                <icon-link
                  v-else-if="item.resourceType === 'URL'"
                  :style="{ fontSize: '48px' }"
                />
                <icon-file v-else :style="{ fontSize: '48px' }" />
              </template>
            </div>
            <div class="resource-info">
              <div class="resource-name" :title="item.name">
                {{ item.name }}
              </div>
              <div class="resource-type">
                {{
                  item.isFolder
                    ? "文件夹"
                    : getResourceTypeText(item.resourceType)
                }}
              </div>
            </div>
          </div>
        </div>
      </a-spin>
    </a-card>

    <!-- 创建资源对话框 -->
    <a-modal
      v-model:visible="createVisible"
      title="创建资源"
      @ok="createResource"
      @cancel="createVisible = false"
      :ok-button-props="{ type: 'primary' }"
    >
      <a-form :model="resourceForm" layout="vertical">
        <a-form-item field="resourceType" label="资源类型">
          <a-radio-group v-model="resourceForm.resourceType" type="button">
            <a-radio value="PDF">PDF</a-radio>
            <a-radio value="ARTICLE">文章</a-radio>
            <a-radio value="NOTE">笔记</a-radio>
            <a-radio value="URL">在线网页</a-radio>
          </a-radio-group>
        </a-form-item>

        <template v-if="resourceForm.resourceType === 'PDF'">
          <a-form-item field="file" label="上传PDF文件" required>
            <div class="upload-option">
              <input
                type="file"
                accept=".pdf"
                style="display: none"
                @change="handleFileSelect"
                ref="fileInput"
              />
              <a-button type="primary" long @click="handleUploadClick">
                <template #icon><icon-upload /></template>
                选择PDF文件上传
              </a-button>
              <div v-if="resourceForm.name" class="selected-file">
                已选择：{{ resourceForm.name }}.pdf
              </div>
            </div>
          </a-form-item>
        </template>

        <template v-else>
          <a-form-item field="name" label="名称" required>
            <a-input
              v-model="resourceForm.name"
              placeholder="请输入资源名称"
              allow-clear
            />
          </a-form-item>
        </template>

        <template v-if="resourceForm.resourceType === 'ARTICLE'">
          <a-form-item field="content" label="文章内容" required>
            <a-textarea
              v-model="resourceForm.content"
              placeholder="请输入文章内容"
              :auto-size="{ minRows: 4, maxRows: 8 }"
            />
          </a-form-item>
        </template>
        <template v-if="resourceForm.resourceType === 'URL'">
          <a-form-item field="resourceUrl" label="网页地址" required>
            <a-input
              v-model="resourceForm.resourceUrl"
              placeholder="请输入网页地址"
              allow-clear
            >
              <template #prefix>
                <icon-link />
              </template>
            </a-input>
          </a-form-item>
        </template>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.resource-manager {
  padding: 24px;
  background-color: var(--color-fill-2);
  min-height: 100vh;
}

.resource-card {
  min-height: calc(100vh - 48px);
  background-color: var(--color-bg-2);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.left-operations {
  display: flex;
  align-items: center;
  gap: 16px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 24px;
  padding: 16px;
}

@media screen and (max-width: 1600px) {
  .resource-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media screen and (max-width: 1200px) {
  .resource-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media screen and (max-width: 900px) {
  .resource-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 600px) {
  .resource-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.resource-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  border-radius: 8px;
  background-color: var(--color-bg-2);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 0;
}

.resource-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary-light-3);
}

.resource-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 96px;
  height: 96px;
  border-radius: 12px;
  margin-bottom: 16px;
  color: var(--color-text-2);
  background-color: var(--color-fill-2);
}

.resource-icon.is-folder {
  color: #ffd666;
  background-color: #fff7e6;
}

.resource-icon.pdf {
  color: #ff4d4f;
  background-color: #fff1f0;
}

.resource-icon.article {
  color: #36cfc9;
  background-color: #e6fffb;
}

.resource-icon.note {
  color: #9254de;
  background-color: #f9f0ff;
}

.resource-icon.url {
  color: #40a9ff;
  background-color: #e6f7ff;
}

.resource-info {
  width: 100%;
  text-align: center;
}

.resource-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-1);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-type {
  font-size: 14px;
  color: var(--color-text-3);
}

.full-height {
  height: 100%;
}

:deep(.arco-upload-list) {
  margin-top: 16px;
}

:deep(.arco-form-item-label) {
  font-weight: 500;
}

.upload-option {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.selected-file {
  color: var(--color-text-2);
  font-size: 14px;
  margin-top: 8px;
}
</style>

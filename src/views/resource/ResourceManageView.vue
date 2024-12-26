<template>
  <div class="resource-manage">
    <!-- 顶部操作栏 -->
    <div class="operation-bar">
      <a-space>
        <a-button v-if="currentPath !== '/'" @click="navigateUp">
          <template #icon>
            <icon-up />
          </template>
          返回根目录
        </a-button>
        <a-upload :custom-request="customRequest" />
        <!-- 只在根目录显示创建文件夹按钮 -->
        <a-button v-if="currentPath === '/'" @click="showCreateFolderModal">
          <template #icon>
            <icon-folder-add />
          </template>
          新建文件夹
        </a-button>
      </a-space>

      <a-input-search
        v-model="searchKeyword"
        placeholder="搜索文件..."
        style="width: 300px; margin-left: auto"
        @search="handleSearch"
      />
    </div>

    <!-- 文件列表 -->
    <div class="resource-grid">
      <a-spin :loading="loading">
        <div class="grid-container">
          <!-- 返回上级目录项 -->
          <div
            v-if="currentPath !== '/'"
            class="grid-item folder"
            @click="navigateUp"
          >
            <div class="item-content">
              <icon-up :style="{ fontSize: '40px', color: '#C99A4B' }" />
              <div class="item-name">
                <span>返回</span>
              </div>
            </div>
          </div>

          <!-- 文件夹 -->
          <div
            v-for="folder in filteredFolders"
            :key="folder.path"
            class="grid-item folder"
            @click="openFolder(folder.path)"
          >
            <div class="item-content">
              <icon-folder :style="{ fontSize: '40px', color: '#C99A4B' }" />
              <div class="item-name">
                <span>{{ folder.name }}</span>
              </div>
            </div>
            <div class="item-actions">
              <a-dropdown @click.stop>
                <icon-more @click.stop />
                <template #content>
                  <a-doption @click.stop="showRenameModal(folder)"
                    >重命名
                  </a-doption>
                  <a-doption @click.stop="handleDelete(folder.path, true)"
                    >删除
                  </a-doption>
                </template>
              </a-dropdown>
            </div>
          </div>

          <!-- 文件 -->
          <div
            v-for="file in filteredFiles"
            :key="file.path"
            class="grid-item file"
          >
            <div class="item-content">
              <div class="file-cover" @click="navigateToPreview(file)">
                <img v-if="file.coverUrl" :src="file.coverUrl" alt="cover" />
                <icon-file
                  v-else
                  :style="{ fontSize: '40px', color: '#165DFF' }"
                />
              </div>
              <div class="item-name">
                <span>{{ file.name }}</span>
              </div>
            </div>
            <div class="item-actions">
              <a-dropdown @click.stop>
                <icon-more @click.stop />
                <template #content>
                  <a-doption @click.stop="showRenameModal(file)"
                    >重命名
                  </a-doption>
                  <a-doption @click.stop="handlePreview(file)">预览</a-doption>
                  <a-doption @click.stop="showMoveModal(file)">移动</a-doption>
                  <a-doption @click.stop="handleDelete(file.path, false)"
                    >删除
                  </a-doption>
                </template>
              </a-dropdown>
            </div>
          </div>
        </div>
      </a-spin>
    </div>

    <!-- 上传文件模态框 -->
    <a-modal
      v-model:visible="uploadModalVisible"
      title="上传文件"
      @ok="handleUpload"
      @cancel="resetUploadForm"
      :ok-button-props="{
        disabled: !uploadForm.fileList.length,
      }"
    >
      <a-form :model="uploadForm" layout="vertical">
        <a-form-item label="文件">
          <a-upload
            v-model:file-list="uploadForm.fileList"
            :custom-request="customUploadRequest"
            :limit="1"
            :multiple="false"
            @change="handleUploadChange"
          >
            <template #upload-button>
              <a-button>选择文件</a-button>
            </template>
          </a-upload>
        </a-form-item>
        <a-form-item label="封面">
          <a-upload
            v-model:file-list="uploadForm.coverList"
            :limit="1"
            :multiple="false"
            list-type="picture-card"
            accept="image/*"
            @change="handleCoverChange"
          >
            <template #upload-button>
              <div class="upload-picture-button">
                <icon-plus />
                <div class="upload-text">上传封面</div>
              </div>
            </template>
          </a-upload>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 新建文件夹模态框 -->
    <a-modal
      v-model:visible="createFolderModalVisible"
      title="新建文件夹"
      @ok="handleCreateFolder"
      @cancel="createFolderModalVisible = false"
    >
      <a-input v-model="newFolderName" placeholder="请输入文件夹名称" />
    </a-modal>

    <!-- 移动文件模态框 -->
    <a-modal
      v-model:visible="moveModalVisible"
      title="移动到"
      @ok="handleMove"
      @cancel="moveModalVisible = false"
      :mask-closable="false"
    >
      <a-spin :loading="loading">
        <a-tree
          v-model:selected-keys="selectedFolderKeys"
          :data="folderTree"
          @select="handleFolderSelect"
          :default-expanded-keys="['/']"
        />
      </a-spin>
    </a-modal>

    <!-- PDF预览模态框 -->
    <a-modal
      v-model:visible="pdfPreviewVisible"
      title="PDF预览"
      fullscreen
      @cancel="pdfPreviewVisible = false"
    >
      <PdfPreview v-if="pdfPreviewVisible" :source="pdfPreviewUrl" />
    </a-modal>

    <!-- 添加重命名模态框 -->
    <a-modal
      v-model:visible="renameModalVisible"
      title="重命名"
      @ok="handleRenameConfirm"
      @cancel="renameModalVisible = false"
    >
      <a-input v-model="newName" placeholder="请输入新名称" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Message } from "@arco-design/web-vue";
import { UserFileControllerService } from "../../../generated";
import {
  IconFile,
  IconFolder,
  IconFolderAdd,
  IconMore,
  IconPlus,
  IconUp,
} from "@arco-design/web-vue/es/icon";
import PdfPreview from "@/components/PdfPreview.vue";
import { useRouter } from "vue-router";
import { UserFile } from "../../../generated/models/UserFile";

const router = useRouter();

// 状态变量
const loading = ref(false);
const currentPath = ref("/");
const searchKeyword = ref("");
const files = ref<any[]>([]);
const folders = ref<any[]>([]);

// 模态框状态
const uploadModalVisible = ref(false);
const createFolderModalVisible = ref(false);
const moveModalVisible = ref(false);
const pdfPreviewVisible = ref(false);
const pdfPreviewUrl = ref("");

// 表单数据
const uploadForm = ref({
  fileList: [] as any[],
  coverList: [] as any[],
});
const newFolderName = ref("");
const selectedFolderKeys = ref<string[]>([]);
const folderTree = ref<any[]>([]);
const fileToMove = ref<any>(null);

// 重命名相关的状态
const renameModalVisible = ref(false);
const newName = ref("");
const itemToRename = ref<any>(null);

// 计算属性：过滤后的文件和文件夹列表
const filteredFiles = computed(() => {
  let result;
  if (!searchKeyword.value) {
    result = files.value.filter((item) => !item.isFolder);
  } else {
    result = files.value.filter(
      (item) =>
        !item.isFolder &&
        item.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }
  // 按名称排序
  return result.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
});

const filteredFolders = computed(() => {
  let result;
  if (!searchKeyword.value) {
    result = folders.value.filter((item) => item.isFolder);
  } else {
    result = folders.value.filter(
      (item) =>
        item.isFolder &&
        item.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }
  // 按名称排序
  return result.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
});

// 加载文件列表
const loadFiles = async () => {
  loading.value = true;
  try {
    const res = await UserFileControllerService.listFiles(currentPath.value);
    if (res.code === 200 && res.data) {
      // 分离文件和文件夹
      files.value = res.data.filter((item) => !item.isFolder);
      folders.value = res.data.filter((item) => item.isFolder);
    }
  } catch (error) {
    Message.error("加载文件列表失败");
  } finally {
    loading.value = false;
  }
};

// 自定义上传请求
const customUploadRequest = async (options: any) => {
  const { file, onProgress, onSuccess, onError } = options;

  console.log("file:" + file);
  try {
    // 创建 FormData 对象
    const formData = new FormData();
    // 获取实际的文件对象
    const actualFile = file.file || file;
    formData.append("file", actualFile);

    // 调用上传接口
    const res = await UserFileControllerService.uploadFile({
      file: file,
    });

    if (res.code === 200) {
      onProgress({ percent: 100 });
      onSuccess(res.data);
      // 上传成功后重新加载文件列表
      await loadFiles();
    } else {
      onError(new Error(res.message || "上传失败"));
    }
  } catch (error) {
    onError(error);
  }
};

// 处理文件上传
const handleUpload = async () => {
  if (!uploadForm.value.fileList.length) {
    Message.warning("请选择要上传的文件");
    return;
  }

  try {
    loading.value = true;
    // 文件已经在 customUploadRequest 中上传，这里只需要处理封面
    if (uploadForm.value.coverList.length > 0) {
      const coverFile = uploadForm.value.coverList[0];
      if (coverFile.status !== "done") {
        Message.warning("请等待封面上传完成");
        return;
      }
      // 如果需要上传封面，这里添加上传封面的逻辑
    }

    Message.success("上传成功");
    uploadModalVisible.value = false;
    resetUploadForm();
  } catch (error) {
    Message.error("上传失败");
  } finally {
    loading.value = false;
  }
};

// 文件预览
const handlePreview = async (file: UserFile) => {
  try {
    // 如果是PDF文件，获取预览URL并打开预览模态框
    if (file.name.toLowerCase().endsWith(".pdf")) {
      const res = await UserFileControllerService.previewFile(file.path);
      if (res.code === 200 && res.data) {
        pdfPreviewUrl.value = res.data.url;
        pdfPreviewVisible.value = true;
      } else {
        // 如果预览失败，尝试直接获取文件URL
        const urlRes = await UserFileControllerService.getFileUrl(file.path);
        if (urlRes.code === 200 && urlRes.data) {
          window.open(urlRes.data, "_blank");
        }
      }
    } else {
      // 非PDF文件直接获取URL并在新标签页打开
      const urlRes = await UserFileControllerService.getFileUrl(file.path);
      if (urlRes.code === 200 && urlRes.data) {
        window.open(urlRes.data, "_blank");
      }
    }
  } catch (error) {
    Message.error("预览失败");
    console.error("Preview error:", error);
  }
};

// 搜索处理
const handleSearch = (value: string) => {
  searchKeyword.value = value;
};

// 修改加载文件夹树的方法
const loadFolderTree = async () => {
  try {
    loading.value = true;
    const res = await UserFileControllerService.listAllFolders();
    if (res.code === 200 && res.data) {
      // 构建文件夹树结构
      const buildTree = (items: any[]): any[] => {
        const result: any[] = [];
        const itemMap = new Map();

        // 首先创建所有节点的映射
        items.forEach((item) => {
          itemMap.set(item.path, {
            title: item.name,
            key: item.path,
            children: [],
          });
        });

        // 构建树结构
        items.forEach((item) => {
          const node = itemMap.get(item.path);
          const parentPath = item.path.substring(0, item.path.lastIndexOf("/"));

          if (parentPath === "") {
            // 根目录下的文件夹
            result.push(node);
          } else {
            // 子文件夹
            const parentNode = itemMap.get(parentPath);
            if (parentNode) {
              parentNode.children.push(node);
            }
          }
        });

        return result;
      };

      // 添加根目录
      folderTree.value = [
        {
          title: "根目录",
          key: "/",
          children: buildTree(res.data),
        },
      ];
    }
  } catch (error) {
    console.error("Load folder tree error:", error);
    Message.error("加载文件夹树失败");
  } finally {
    loading.value = false;
  }
};

// 修改显示移动模态框的方法
const showMoveModal = async (file: any) => {
  fileToMove.value = file;
  moveModalVisible.value = true;
  await loadFolderTree();
  // 默认选中当前文件所在的目录
  const currentDir = file.path.substring(0, file.path.lastIndexOf("/"));
  selectedFolderKeys.value = [currentDir || "/"];
};

// 修改移动文件的处理方法
const handleMove = async () => {
  if (!fileToMove.value || !selectedFolderKeys.value.length) {
    Message.warning("请选择目标文件夹");
    return;
  }

  const targetPath = selectedFolderKeys.value[0];
  const sourcePath = fileToMove.value.path;
  const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf("/"));

  // 检查是否移动到当前所在目录
  if (targetPath === sourceDir) {
    Message.warning("文件已在该目录中");
    return;
  }

  // 检查是否在移动到自身或子文件夹
  if (fileToMove.value.isFolder && targetPath.startsWith(sourcePath)) {
    Message.error("不能将文件夹移动到自身或其子文件夹中");
    return;
  }

  try {
    const res = await UserFileControllerService.move(sourcePath, targetPath);
    if (res.code === 200) {
      Message.success("移动成功");
      loadFiles();
      moveModalVisible.value = false;
    } else {
      Message.error(res.message || "移动失败");
    }
  } catch (error) {
    console.error("Move error:", error);
    Message.error("移动失败");
  }
};

// 修改文件夹选择的处理方法
const handleFolderSelect = (selectedKeys: string[]) => {
  selectedFolderKeys.value = selectedKeys;
};

// 获取存储空间统计
const loadStorageStats = async () => {
  try {
    const res = await UserFileControllerService.getStorageStats();
    if (res.code === 200 && res.data) {
      // 可以添加存储空间使用情况的显示
      console.log("Storage stats:", res.data);
    }
  } catch (error) {
    console.error("Failed to load storage stats:", error);
  }
};

// 创建文件夹
const handleCreateFolder = async () => {
  if (!newFolderName.value) {
    Message.warning("请输入文件夹名称");
    return;
  }

  try {
    await UserFileControllerService.createFolder(
      newFolderName.value,
      currentPath.value
    );
    Message.success("创建成功");
    loadFiles();
    createFolderModalVisible.value = false;
    newFolderName.value = "";
  } catch (error) {
    Message.error("创建失败");
  }
};

// 重命名
const handleRename = async (path: string, newName: string) => {
  try {
    // 检查新名称是否为空
    if (!newName.trim()) {
      Message.error("名称不能为空");
      return false;
    }

    // 检查新名称是否包含非法字符
    if (/[\\/:*?"<>|]/.test(newName)) {
      Message.error('名称不能包含特殊字符: \\ / : * ? " < > |');
      return false;
    }

    // 获取当前目录下的所有文件和文件夹
    const res = await UserFileControllerService.listFiles(currentPath.value);
    if (res.code === 200 && res.data) {
      // 检查新名称是否已存在
      const exists = res.data.some(
        (item) => item.name === newName && item.path !== path
      );
      if (exists) {
        Message.error("该名称已存在");
        return false;
      }

      // 调用重命名API
      const renameRes = await UserFileControllerService.rename(path, newName);
      if (renameRes.code === 200) {
        Message.success("重命名成功");
        loadFiles(); // 重新加载文件列表
        return true;
      } else {
        Message.error(renameRes.message || "重命名失败");
        return false;
      }
    }
    return false;
  } catch (error) {
    Message.error("重命名失败");
    console.error("Rename error:", error);
    return false;
  }
};

// 删除文件/文件夹
const handleDelete = async (path: string, isFolder: boolean) => {
  try {
    const confirmMessage = isFolder
      ? "确定要删除此文件夹及其所有内容吗?"
      : "确定要删除此文件吗?";
    if (!window.confirm(confirmMessage)) {
      return;
    }

    await UserFileControllerService.delete(path);
    Message.success("删除成功");
    loadFiles();
  } catch (error) {
    Message.error("删除失败");
  }
};

// 辅助方法
const resetUploadForm = () => {
  uploadForm.value = {
    fileList: [],
    coverList: [],
  };
};

const showUploadModal = () => {
  uploadModalVisible.value = true;
};

const showCreateFolderModal = () => {
  createFolderModalVisible.value = true;
};

const navigateTo = (path: string) => {
  currentPath.value = path;
  loadFiles();
};

const openFolder = (path: string) => {
  currentPath.value = path;
  loadFiles();
};

const getCurrentPathByIndex = (index: number) => {
  return (
    "/" +
    currentPath.value
      .split("/")
      .filter(Boolean)
      .slice(0, index + 1)
      .join("/")
  );
};

// 生命周期子
onMounted(() => {
  loadFiles();
  loadStorageStats();
});

// 添加文件变化处理函数
const handleUploadChange = (fileList: any) => {
  if (fileList.file && fileList.file.status === "error") {
    Message.error("文件上传失败");
  }
};

const handleCoverChange = (fileList: any) => {
  if (fileList.file && fileList.file.status === "error") {
    Message.error("封面上传失败");
  }
};

const customRequest = (option) => {
  const { onProgress, onError, onSuccess, fileItem, name } = option;

  UserFileControllerService.uploadFile({ file: fileItem.file });
};

// 修改返回上级目录的方法
const navigateUp = () => {
  if (currentPath.value === "/") return;

  // 直接返回根目录
  navigateTo("/");
};

// 显示重命名模态框
const showRenameModal = (item: any) => {
  itemToRename.value = item;
  newName.value = item.name;
  renameModalVisible.value = true;
};

// 处理重命名确认
const handleRenameConfirm = async () => {
  if (!newName.value || !itemToRename.value) return;

  try {
    const res = await UserFileControllerService.rename(
      itemToRename.value.path,
      newName.value
    );
    if (res.code === 200) {
      Message.success("重命名成功");
      loadFiles(); // 重新加载文件列表
      renameModalVisible.value = false;
    } else {
      Message.error(res.message || "重命名失败");
    }
  } catch (error) {
    Message.error("重命名失败");
    console.error("Rename error:", error);
  }
};

// 在 script 分添加跳转方法
const navigateToPreview = (file: any) => {
  router.push({
    name: "resource-preview",
    query: { path: file.path },
  });
};
</script>

<style scoped>
.resource-manage {
  padding: 20px;
}

.operation-bar {
  display: flex;
  margin-bottom: 24px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
  padding: 20px 0;
}

.grid-item {
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 0;
}

.grid-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.item-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.file-cover {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.file-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-name {
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-name span {
  font-size: 14px;
}

.item-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 2;
}

.grid-item:hover .item-actions {
  opacity: 1;
}

.upload-picture-button {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-text {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-3);
}

.file-preview {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.storage-stats {
  margin-top: 20px;
  padding: 16px;
  background-color: var(--color-bg-2);
  border-radius: 4px;
}

.grid-item.folder {
  background-color: var(--color-fill-2);
}

.grid-item.file {
  background-color: var(--color-bg-2);
}

.folder .item-content {
  padding: 12px;
}

.file .item-content {
  padding: 8px;
}

.folder .item-name {
  margin-top: 8px;
  font-weight: 500;
}

.file .file-cover {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.file .file-cover:hover {
  border-color: var(--color-primary-light-3);
  box-shadow: 0 0 8px rgba(var(--primary-6), 0.2);
}

.item-name :deep(.arco-typography) {
  margin-bottom: 0;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-name :deep(.arco-typography-edit-content) {
  text-align: center;
  margin: 0 auto;
}

.item-name :deep(.arco-typography-operation) {
  opacity: 0;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.grid-item:hover .item-name :deep(.arco-typography-operation) {
  opacity: 1;
}

.grid-item.folder.back {
  background-color: var(--color-fill-1);
}

.grid-item.folder.back:hover {
  background-color: var(--color-fill-2);
}

@media screen and (max-width: 1600px) {
  .grid-container {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media screen and (max-width: 1400px) {
  .grid-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media screen and (max-width: 1200px) {
  .grid-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 480px) {
  .grid-container {
    grid-template-columns: 1fr;
  }
}

.arco-tree {
  max-height: 400px;
  overflow-y: auto;
}
</style>

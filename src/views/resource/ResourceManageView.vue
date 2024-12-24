<template>
  <div class="resource-manage">
    <!-- 顶部操作栏 -->
    <div class="operation-bar">
      <a-space>
        <a-upload :custom-request="customRequest" />
        <!--        <a-button type="primary" @click="showUploadModal">-->
        <!--          <template #icon>-->
        <!--            <icon-plus />-->
        <!--          </template>-->
        <!--          上传文件-->
        <!--        </a-button>-->
        <!--        <a-button @click="showCreateFolderModal">-->
        <!--          <template #icon>-->
        <!--            <icon-folder-add />-->
        <!--          </template>-->
        <!--          新建文件夹-->
        <!--        </a-button>-->
      </a-space>

      <a-input-search
        v-model="searchKeyword"
        placeholder="搜索文件..."
        style="width: 300px; margin-left: auto"
        @search="handleSearch"
      />
    </div>

    <!-- 面包屑导航 -->
    <div class="breadcrumb">
      <a-breadcrumb>
        <a-breadcrumb-item @click="navigateTo('/')">根目录</a-breadcrumb-item>
        <a-breadcrumb-item
          v-for="(item, index) in currentPath.split('/').filter(Boolean)"
          :key="index"
          @click="navigateTo(getCurrentPathByIndex(index))"
        >
          {{ item }}
        </a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- 文件列表 -->
    <div class="resource-grid">
      <a-spin :loading="loading">
        <div class="grid-container">
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
                <a-typography-paragraph
                  :editable="{
                    onChange: (str) => handleRename(folder.path, str),
                  }"
                >
                  {{ folder.name }}
                </a-typography-paragraph>
              </div>
            </div>
            <div class="item-actions">
              <a-dropdown>
                <icon-more />
                <template #content>
                  <a-doption @click.stop="handleDelete(folder.path)"
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
              <div class="file-cover">
                <img v-if="file.coverUrl" :src="file.coverUrl" alt="cover" />
                <icon-file
                  v-else
                  :style="{ fontSize: '40px', color: '#165DFF' }"
                />
              </div>
              <div class="item-name">
                <a-typography-paragraph
                  :editable="{
                    onChange: (str) => handleRename(file.path, str),
                  }"
                >
                  {{ file.name }}
                </a-typography-paragraph>
              </div>
            </div>
            <div class="item-actions">
              <a-dropdown>
                <icon-more />
                <template #content>
                  <a-doption @click="handlePreview(file)">预览</a-doption>
                  <a-doption @click="showMoveModal(file)">移动</a-doption>
                  <a-doption @click="handleDelete(file.path)">删除</a-doption>
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
    >
      <a-tree
        v-model:selected-keys="selectedFolderKeys"
        :data="folderTree"
        @select="handleFolderSelect"
      />
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
} from "@arco-design/web-vue/es/icon";

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

// 表单数据
const uploadForm = ref({
  fileList: [] as any[],
  coverList: [] as any[],
});
const newFolderName = ref("");
const selectedFolderKeys = ref<string[]>([]);
const folderTree = ref<any[]>([]);
const fileToMove = ref<any>(null);

// 计算属性：过滤后的文件和文件夹列表
const filteredFiles = computed(() => {
  if (!searchKeyword.value) return files.value;
  return files.value.filter((file) =>
    file.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

const filteredFolders = computed(() => {
  if (!searchKeyword.value) return folders.value;
  return folders.value.filter((folder) =>
    folder.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

// 加载文件列表
const loadFiles = async () => {
  loading.value = true;
  try {
    const res = await UserFileControllerService.listFiles(currentPath.value);
    if (res.code === 200 && res.data) {
      files.value = res.data.filter((item) => !item.isDirectory);
      folders.value = res.data.filter((item) => item.isDirectory);

      // 获取文件的预览URL
      for (const file of files.value) {
        try {
          const previewRes = await UserFileControllerService.previewFile(
            file.path
          );
          if (previewRes.code === 200 && previewRes.data) {
            file.coverUrl = previewRes.data.previewUrl;
          }
        } catch (error) {
          console.error("Failed to get preview for file:", file.path);
        }
      }
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
const handlePreview = async (file: any) => {
  try {
    const res = await UserFileControllerService.previewFile(file.path);
    if (res.code === 200 && res.data) {
      // 根据文件类型处理预览
      if (res.data.type === "IMAGE") {
        window.open(res.data.previewUrl, "_blank");
      } else if (res.data.type === "PDF") {
        window.open(res.data.previewUrl, "_blank");
      } else {
        // 其他类型文件处理
        const urlRes = await UserFileControllerService.getFileUrl(file.path);
        if (urlRes.code === 200 && urlRes.data) {
          window.open(urlRes.data, "_blank");
        }
      }
    }
  } catch (error) {
    Message.error("预览失败");
  }
};

// 搜索处理
const handleSearch = (value: string) => {
  searchKeyword.value = value;
};

// 获取文件夹树结构
const loadFolderTree = async () => {
  try {
    const res = await UserFileControllerService.listFiles("/");
    if (res.code === 200 && res.data) {
      const buildTree = (items: any[], parentPath = "/") => {
        return items
          .filter(
            (item) => item.isDirectory && item.path.startsWith(parentPath)
          )
          .map((item) => ({
            title: item.name,
            key: item.path,
            children: buildTree(items, item.path + "/"),
          }));
      };

      folderTree.value = [
        {
          title: "根目录",
          key: "/",
          children: buildTree(res.data),
        },
      ];
    }
  } catch (error) {
    Message.error("加载文件夹结构失败");
  }
};

// 显示移动文件模态框时加载文件夹树
const showMoveModal = async (file: any) => {
  fileToMove.value = file;
  moveModalVisible.value = true;
  await loadFolderTree();
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
    await UserFileControllerService.rename(path, newName);
    Message.success("重命名成功");
    loadFiles();
  } catch (error) {
    Message.error("重命名失败");
  }
};

// 删除
const handleDelete = async (path: string) => {
  try {
    await UserFileControllerService.delete(path);
    Message.success("删除成功");
    loadFiles();
  } catch (error) {
    Message.error("删除失败");
  }
};

// 移动文件
const handleMove = async () => {
  if (!fileToMove.value || !selectedFolderKeys.value.length) {
    Message.warning("请选择目标文件夹");
    return;
  }

  try {
    await UserFileControllerService.move(
      fileToMove.value.path,
      selectedFolderKeys.value[0]
    );
    Message.success("移动成功");
    loadFiles();
    moveModalVisible.value = false;
  } catch (error) {
    Message.error("移动失败");
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

// 生命周期钩子
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
</script>

<style scoped>
.resource-manage {
  padding: 20px;
}

.operation-bar {
  display: flex;
  margin-bottom: 20px;
}

.breadcrumb {
  margin-bottom: 20px;
}

.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
}

.grid-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
}

.item-content {
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
}

.item-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s;
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
</style>

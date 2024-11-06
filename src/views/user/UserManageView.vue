<template>
  <div id="userManageView">
    <a-card class="general-card">
      <template #title>用户管理</template>
      <!-- 搜索表单 -->
      <a-form :model="searchParams" layout="inline">
        <a-form-item field="userAccount" label="账号">
          <a-input
            v-model="searchParams.userAccount"
            placeholder="请输入账号"
          />
        </a-form-item>
        <a-form-item field="userName" label="用户名">
          <a-input v-model="searchParams.userName" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="doSubmit">搜索</a-button>
        </a-form-item>
      </a-form>

      <!-- 用户列表 -->
      <a-table
        :loading="loading"
        :data="dataList"
        :pagination="{
          showTotal: true,
          pageSize: searchParams.pageSize,
          current: searchParams.current,
          total,
        }"
        @page-change="onPageChange"
      >
        <template #columns>
          <a-table-column title="用户ID" data-index="id" />
          <a-table-column title="账号" data-index="userAccount" />
          <a-table-column title="用户名" data-index="userName" />
          <a-table-column title="用户角色" data-index="userRole" />
          <a-table-column title="创建时间" data-index="createTime">
            <template #cell="{ record }">
              {{ moment(record.createTime).format("YYYY-MM-DD HH:mm:ss") }}
            </template>
          </a-table-column>
          <a-table-column title="操作">
            <template #cell="{ record }">
              <a-space>
                <a-button type="primary" @click="handleEdit(record)"
                  >编辑</a-button
                >
                <a-button status="danger" @click="handleDelete(record)"
                  >删除</a-button
                >
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </a-card>

    <!-- 编辑用户对话框 -->
    <a-modal
      v-model:visible="editModalVisible"
      title="编辑用户"
      @ok="handleEditSubmit"
      @cancel="editModalVisible = false"
    >
      <a-form :model="editForm" ref="editFormRef">
        <a-form-item field="userName" label="用户名">
          <a-input v-model="editForm.userName" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item field="userRole" label="用户角色">
          <a-select v-model="editForm.userRole">
            <a-option value="user">普通用户</a-option>
            <a-option value="admin">管理员</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 删除确认对话框 -->
    <a-modal
      v-model:visible="deleteModalVisible"
      @ok="handleDeleteSubmit"
      @cancel="deleteModalVisible = false"
      simple
      :okButtonProps="{ status: 'danger' }"
      okText="确认删除"
      cancelText="取消"
    >
      <template #title>确认删除</template>
      确定要删除用户 "{{ userToDelete?.userName }}" 吗？此操作不可恢复。
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect } from "vue";
import { UserControllerService } from "../../../generated";
import message from "@arco-design/web-vue/es/message";
import moment from "moment";

const loading = ref(false);
const dataList = ref([]);
const total = ref(0);
const editModalVisible = ref(false);
const deleteModalVisible = ref(false);
const userToDelete = ref(null);

const searchParams = reactive({
  userAccount: "",
  userName: "",
  pageSize: 10,
  current: 1,
});

const editForm = reactive({
  id: null,
  userName: "",
  userRole: "",
});

// 加载用户列表数据
const loadData = async () => {
  loading.value = true;
  try {
    const res = await UserControllerService.listUserVoByPageUsingPost(
      searchParams
    );
    if (String(res.code) === "200") {
      dataList.value = res.data.records;
      total.value = res.data.total;
    } else {
      message.error("获取用户列表失败：" + res.message);
    }
  } catch (error) {
    message.error("获取用户列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const doSubmit = () => {
  searchParams.current = 1;
  loadData();
};

// 分页变化
const onPageChange = (page: number) => {
  searchParams.current = page;
};

// 编辑用户
const handleEdit = (record: any) => {
  editForm.id = record.id;
  editForm.userName = record.userName;
  editForm.userRole = record.userRole;
  editModalVisible.value = true;
};

// 提交编辑
const handleEditSubmit = async () => {
  try {
    const res = await UserControllerService.updateUserUsingPost({
      id: editForm.id,
      userName: editForm.userName,
      userRole: editForm.userRole,
    });
    if (String(res.code) === "200") {
      message.success("更新成功");
      editModalVisible.value = false;
      loadData();
    } else {
      message.error("更新失败：" + res.message);
    }
  } catch (error) {
    message.error("更新失败");
  }
};

// 删除用户
const handleDelete = (record: any) => {
  userToDelete.value = record;
  deleteModalVisible.value = true;
};

// 提交删除
const handleDeleteSubmit = async () => {
  if (!userToDelete.value) return;

  try {
    const res = await UserControllerService.deleteUserUsingPost({
      id: userToDelete.value.id,
    });
    if (String(res.code) === "200") {
      message.success("删除成功");
      deleteModalVisible.value = false;
      loadData();
    } else {
      message.error("删除失败：" + res.message);
    }
  } catch (error) {
    message.error("删除失败");
  }
};

// 监听搜索参数变化，自动加载数据
watchEffect(() => {
  loadData();
});
</script>

<style scoped>
#userManageView {
  padding: 20px;
}

.general-card {
  border-radius: 4px;
  background-color: var(--color-bg-2);
  margin: 16px;
}
</style>

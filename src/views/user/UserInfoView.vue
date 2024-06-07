<template>
  <div id="userInfoView">
    <a-form
      ref="formRef"
      :size="large"
      :model="form"
      :style="{ width: '600px' }"
      @submit="handleSubmit"
    >
      <!--      <a-form-item-->
      <!--        field="name"-->
      <!--        label="Username"-->
      <!--        :rules="[-->
      <!--          { required: true, message: 'name is required' },-->
      <!--          { minLength: 5, message: 'must be greater than 5 characters' },-->
      <!--        ]"-->
      <!--        :validate-trigger="['change', 'input']"-->
      <!--      >-->
      <!--        <a-input-->
      <!--          v-model="form.name"-->
      <!--          placeholder="please enter your username..."-->
      <!--        />-->
      <!--      </a-form-item>-->

      <a-form-item label="上传头像">
        <a-upload
          action="/"
          :fileList="file ? [file] : []"
          :show-file-list="false"
          @change="onChange"
          @progress="onProgress"
        >
          <template #upload-button>
            <div
              :class="`arco-upload-list-item${
                file && file.status === 'error'
                  ? ' arco-upload-list-item-error'
                  : ''
              }`"
            >
              <div
                class="arco-upload-list-picture custom-upload-avatar"
                v-if="file && file.url"
              >
                <img :src="file.url" />
                <div class="arco-upload-list-picture-mask">
                  <IconEdit />
                </div>
                <a-progress
                  v-if="file.status === 'uploading' && file.percent < 100"
                  :percent="file.percent"
                  type="circle"
                  size="mini"
                  :style="{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translateX(-50%) translateY(-50%)',
                  }"
                />
              </div>
              <div class="arco-upload-picture-card" v-else>
                <div class="arco-upload-picture-card-text">
                  <IconPlus />
                  <div style="margin-top: 10px; font-weight: 600">Upload</div>
                </div>
              </div>
            </div>
          </template>
        </a-upload>
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="downloadAvater"
          >下载头像</a-button
        ></a-form-item
      >
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { IconEdit, IconPlus } from "@arco-design/web-vue/es/icon";
import axios from "axios";

import message from "@arco-design/web-vue/es/message";
import {
  FileControllerService,
  UserControllerService,
} from "../../../generated";
import store from "@/store";
const handleSubmit = ({ values, errors }) => {
  console.log("values:", values, "\nerrors:", errors);
};

const file = ref();

const onChange = (_, currentFile) => {
  file.value = {
    ...currentFile,
    // url: URL.createObjectURL(currentFile.file),
  };
};

const downloadAvater = async () => {
  try {
    const response = await axios.get(
      "http://localhost:8121/api/user/downloadAvatar",
      {
        withCredentials: true,
        responseType: "blob", // 设置响应类型为 blob
      }
    );

    // 创建一个临时的 URL 对象
    const url = window.URL.createObjectURL(response.data);
    // 创建一个下载链接
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "avatar.png"); // 设置下载文件名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // 释放临时 URL 对象
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("下载失败", error);
  }
};
const downloadImage = (imgSrc, name) => {
  // 下载图片地址和图片名
  fetch(imgSrc)
    .then((response) => response.blob())
    .then((blob) => {
      // 创建一个链接元素用于下载
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", name || "download.png"); // 设置下载文件名
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    })
    .catch((error) => {
      console.error("下载失败", error);
    });
};

const downloadByBlob = (url, name) => {
  let image = new Image();
  image.setAttribute("crossOrigin", "anonymous");
  image.src = url;
  image.onload = () => {
    let canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height);
    canvas.toBlob((blob) => {
      let url = URL.createObjectURL(blob);
      download(url, name);
      // 用完释放URL对象
      URL.revokeObjectURL(url);
    });
  };
};

const download = (href, name) => {
  let eleLink = document.createElement("a");
  eleLink.download = name;
  eleLink.href = href;
  eleLink.click();
  eleLink.remove();
};

const onProgress = async (currentFile) => {
  file.value = currentFile;
  var res = await UserControllerService.uploadAvatarUsingPost(
    "user_avatar",
    currentFile?.file
  );
  await store.dispatch("user/updateAvatar", res.data);
};
</script>

<style scoped>
#userInfoView {
  margin: 0 auto;
}
</style>

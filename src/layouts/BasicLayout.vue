<template>
  <div id="basicLayout">
    <a-layout style="min-height: 100vh">
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </div>
</template>

<style scoped>
#basicLayout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

#basicLayout .header {
  box-shadow: #eee 1px 1px 5px;
  padding: 0 20px; /* 添加边距让内容不会紧贴边缘 */
}

#basicLayout .content {
  flex-grow: 1; /* 让内容区域自动占满剩余空间 */
  padding: 20px;
  overflow: auto; /* 防止内容溢出 */
}

#basicLayout .footer {
  background: #efefef;
  padding: 8px;
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
}

@media (max-width: 768px) {
  /* 针对小屏幕的优化 */
  #basicLayout .header {
    padding: 0 10px;
  }

  #basicLayout .content {
    padding: 10px;
  }

  #basicLayout .footer {
    font-size: 12px;
  }
}
</style>
<script setup lang="ts">
import GlobalHeader from "@/components/GlobalHeader.vue";
</script>

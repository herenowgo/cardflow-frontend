<template>
  <div id="userLayout">
    <a-layout style="min-height: 100vh">
      <a-layout-header>
        <img src="../assets/logo.jpg" class="logo" />
      </a-layout-header>
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
      <a-layout-footer class="footer">
        <div>版权所有 © 2023 qiu</div>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<style scoped>
#userLayout {
  text-align: center;
}

#userLayout .header {
  box-shadow: #eee 1px 1px 5px;
  margin-top: 16px;

  margin-bottom: 16px;
}

#userLayout .logo {
  width: 200px;
  /* height: 170px;
  margin: 16px; */
  margin-top: 100px;
}

#userLayout .content {
  padding: 20px;
  margin-bottom: 16px;
}

#userLayout .footer {
  //background: #efefef;
  padding: 10px;
  text-align: center;
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
}

#userLayout.footer > div {
  color: #999;
}
</style>
<script setup lang="ts">
import GlobalHeader from "@/components/GlobalHeader.vue";
</script>

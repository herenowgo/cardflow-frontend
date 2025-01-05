<template>
  <div id="basicLayout">
    <a-layout style="min-height: 100vh">
      <a-layout-header v-if="!hideHeader" class="header">
        <GlobalHeader />
      </a-layout-header>
      <a-layout-content :class="{ content: true, 'no-header': hideHeader }">
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
  padding: 0 20px;
}

#basicLayout .content {
  flex-grow: 1;
  padding: 20px;
  overflow: auto;
}

#basicLayout .content.no-header {
  padding: 0;
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
  #basicLayout .header {
    padding: 0 10px;
  }

  #basicLayout .content {
    padding: 10px;
  }

  #basicLayout .content.no-header {
    padding: 0;
  }

  #basicLayout .footer {
    font-size: 12px;
  }
}
</style>

<script setup lang="ts">
import GlobalHeader from "@/components/GlobalHeader.vue";
import { useRoute } from "vue-router";
import { computed } from "vue";

const route = useRoute();
const hideHeader = computed(() => route.meta.hideHeader);
</script>

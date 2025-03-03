import { createApp } from "vue";
import App from "./App.vue";
import ArcoVue from "@arco-design/web-vue";
import "@arco-design/web-vue/dist/arco.css";
import router from "./router";
import store from "./store";
import "@/access";
import "bytemd/dist/index.css";
import ArcoVueIcon from "@arco-design/web-vue/es/icon";
import TDesign from "tdesign-vue-next";
import TDesignChat from "@tdesign-vue-next/chat"; // 引入chat组件
import "tdesign-vue-next/es/style/index.css";
import { createPinia } from "pinia";

// 导入 vue-echarts
import VChart from "vue-echarts";
import "./plugins/echarts";
// 导入权限控制设置函数
import { setupAccessControl } from "./access";

const pinia = createPinia();

// 初始化时获取用户信息，但使用 await 确保按顺序执行
const initApp = async () => {
  const app = createApp(App);
  await store.dispatch("user/getLoginUser").catch(console.error);

  // 注册 VChart 全局组件
  app.component("VChart", VChart);

  app
    .use(ArcoVue)
    .use(store)
    .use(pinia)
    .use(router)
    .use(ArcoVueIcon)
    .use(TDesign)
    .use(TDesignChat);

  // 设置权限控制（确保在router初始化后调用）
  setupAccessControl(router);

  app.mount("#app");
};

initApp();

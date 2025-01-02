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

createApp(App)
  .use(ArcoVue)
  .use(store)
  .use(router)
  .use(ArcoVueIcon)
  .use(TDesign)
  .use(TDesignChat)
  .mount("#app");

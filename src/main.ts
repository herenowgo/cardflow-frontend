import { createApp } from "vue";
import App from "./App.vue";
import ArcoVue from "@arco-design/web-vue";
import "@arco-design/web-vue/dist/arco.css";
import router from "./router";
import store from "./store";
import "@/access";
import "bytemd/dist/index.css";
import ArcoVueIcon from "@arco-design/web-vue/es/icon";
import * as pdfjsLib from "pdfjs-dist";

// 设置 PDF worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

createApp(App)
  .use(ArcoVue)
  .use(store)
  .use(router)
  .use(ArcoVueIcon)
  .mount("#app");

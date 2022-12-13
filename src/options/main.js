import { createApp } from "vue";
import App from "./App.vue";
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App);

// TODO 仅依赖时导入
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// TODO 仅依赖时导入
app.use(ElementPlus);
app.mount("#app");
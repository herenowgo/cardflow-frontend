
使用的组件库的文档链接为：https://arco.design/vue/docs/start

技术栈：
·Vue3
·Vue-CLI脚手架
·Vuex状态管理
·Arco Design组件库
前端工程化：ESLint+Prettier+TypeScript
★前端项目模板(通用布局、权限管理、状态管理、菜单生成)
·★Markdown富文本编辑器
·Monaco Editor代码编辑器
·OpenAPI前端代码生成

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

npx openapi-typescript-codegen --input http://localhost:8166/v3/api-docs --output backendApi --client axios

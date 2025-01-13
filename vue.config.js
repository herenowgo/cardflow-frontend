const { defineConfig } = require("@vue/cli-service");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const path = require("path");

module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack(config) {
    config.plugin("monaco").use(new MonacoWebpackPlugin());
    config.resolve.alias.set("@", path.resolve(__dirname, "src"));
    config.resolve.alias.set("@api", path.resolve(__dirname, "api"));
  },
});

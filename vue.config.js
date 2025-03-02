const { defineConfig } = require("@vue/cli-service");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const path = require("path");

module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  chainWebpack(config) {
    config.plugins.delete("fork-ts-checker");
    config.plugin("monaco").use(
      new MonacoWebpackPlugin({
        languages: ["java", "python"], // 只加载需要的语言
        features: ["!gotoSymbol"], // 禁用不需要的特性
      })
    );
    config.resolve.alias.set("@", path.resolve(__dirname, "src"));
    config.resolve.alias.set("@api", path.resolve(__dirname, "api"));
    config.resolve.alias.set(
      "@backendApi",
      path.resolve(__dirname, "backendApi")
    ); // 添加这行
    config.resolve.alias.set(
      "@documentApi",
      path.resolve(__dirname, "documentApi")
    ); // 添加这行
    if (process.env.NODE_ENV === "production") {
      // 生产环境优化
      config.optimization.splitChunks({
        chunks: "all",
        cacheGroups: {
          libs: {
            name: "chunk-libs",
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: "initial",
          },
          arcodesign: {
            name: "chunk-arcodesign",
            priority: 20,
            test: /[\\/]node_modules[\\/]@arco-design[\\/]/,
          },
          monaco: {
            name: "chunk-monaco",
            priority: 20,
            test: /[\\/]node_modules[\\/]monaco-editor[\\/]/,
          },
        },
      });

      config.optimization.minimize(true);

      // 压缩图片
      config.module
        .rule("images")
        .use("image-webpack-loader")
        .loader("image-webpack-loader")
        .options({
          bypassOnDebug: true,
        })
        .end();
    }
  },
  configureWebpack: {
    performance: {
      hints: false,
    },
  },
  devServer: {
    compress: true, // 启用gzip压缩
    client: {
      overlay: true, // 在浏览器中显示编译错误
    },
    hot: true, // 热更新
  },
});

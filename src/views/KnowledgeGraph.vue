<template>
  <div class="knowledge-graph-container">
    <div class="graph-header">
      <h2>我的知识图谱</h2>
      <div class="graph-actions">
        <a-button type="primary" @click="refreshGraph">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
      </div>
    </div>

    <div class="graph-content">
      <div v-if="loading" class="loading-container">
        <a-spin tip="加载中..."></a-spin>
      </div>
      <div v-else-if="error" class="error-container">
        <a-result
          status="error"
          :title="error"
          :subtitle="'请刷新页面或稍后再试'"
        >
          <template #extra>
            <a-button type="primary" @click="refreshGraph">重试</a-button>
          </template>
        </a-result>
      </div>
      <div v-else class="graph-chart-container">
        <v-chart
          class="knowledge-graph-chart"
          :option="graphOption"
          autoresize
        />
        <div class="graph-legend">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #5470c6"></div>
            <span>标签</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #91cc75"></div>
            <span>卡片</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue";
import { use } from "echarts/core";
import { GraphChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import VChart from "vue-echarts";
import { GraphControllerService, GraphDTO, NodeDTO } from "@backendApi/index";

// 注册需要的 ECharts 组件
use([
  GraphChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  ToolboxComponent,
  CanvasRenderer,
]);

export default defineComponent({
  name: "KnowledgeGraph",
  components: {
    VChart,
  },
  setup() {
    const graphData = ref<GraphDTO | null>(null);
    const loading = ref(true);
    const error = ref<string | null>(null);

    // 计算 ECharts 图表配置
    const graphOption = computed(() => {
      if (!graphData.value) {
        return {};
      }

      const { nodes, edges } = graphData.value;

      // 定义节点类别，使用更美观的配色
      const categories = [
        {
          name: "标签",
          itemStyle: {
            color: "#5B8FF9",
          },
        },
        {
          name: "卡片",
          itemStyle: {
            color: "#5AD8A6",
          },
        },
      ];

      // 转换节点数据 - 减小基础尺寸，增大间距
      const echartsNodes =
        nodes?.map((node) => ({
          id: String(node.id),
          name: node.name || "",
          value: node.value,
          // 调整尺寸公式，让节点不要过大
          symbolSize: Math.min(node.value * 3 + 15, 50),
          category: node.type === NodeDTO.type.TAG ? 0 : 1,
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.3)",
          },
          label: {
            show: true,
            position: "right",
            distance: 8, // 增加标签距离
            formatter: "{b}",
            fontSize: 12,
            fontWeight: 500,
            color: "#333",
          },
        })) || [];

      // 转换边数据
      const echartsLinks =
        edges?.map((edge) => ({
          source: String(edge.source),
          target: String(edge.target),
          value: edge.name || "",
          symbolSize: [5, 10],
          lineStyle: {
            width: Math.max(1, Math.min(3, edge.weight || 1)),
            curveness: 0.1, // 添加适当的曲度
            opacity: 0.7,
            cap: "round",
          },
          emphasis: {
            lineStyle: {
              width: 5,
              shadowBlur: 5,
              shadowColor: "rgba(0, 0, 0, 0.3)",
            },
          },
        })) || [];

      return {
        backgroundColor: "#ffffff",
        title: {
          text: "知识图谱",
          subtext: "标签和卡片的关系网络",
          top: "bottom",
          left: "right",
          textStyle: {
            fontSize: 16,
            fontWeight: "normal",
            color: "#555",
          },
          subtextStyle: {
            color: "#999",
          },
        },
        tooltip: {
          trigger: "item",
          formatter: (params: any) => {
            if (params.dataType === "node") {
              return `${params.name}<br/>连接数：${params.value}`;
            }
            return params.value || "关联";
          },
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderColor: "#eee",
          borderWidth: 1,
          textStyle: {
            color: "#333",
          },
          extraCssText: "box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);",
        },
        legend: [
          {
            data: categories.map((a) => a.name),
            orient: "vertical",
            right: 10,
            top: 20,
            itemWidth: 18,
            itemHeight: 10,
            textStyle: {
              color: "#333",
              fontSize: 12,
            },
            itemStyle: {
              borderWidth: 0,
            },
          },
        ],
        toolbox: {
          feature: {
            saveAsImage: {
              title: "保存为图片",
              pixelRatio: 2,
            },
            restore: {
              title: "还原",
            },
            dataView: {
              title: "数据视图",
              readOnly: true,
              lang: ["数据视图", "关闭", "刷新"],
            },
          },
          right: 10,
          top: 80,
        },
        animationDurationUpdate: 1500,
        animationEasingUpdate: "quinticInOut",
        series: [
          {
            name: "知识网络",
            type: "graph",
            layout: "force",
            data: echartsNodes,
            links: echartsLinks,
            categories: categories,
            roam: true,
            draggable: true,
            zoom: 0.9, // 略微缩小初始视图
            force: {
              repulsion: [600, 1000], // 大幅增加斥力，使节点分散
              edgeLength: [150, 250], // 增加边的长度范围
              gravity: 0.05, // 减小重力，让节点更分散
              friction: 0.8, // 增加摩擦力，更稳定
              layoutAnimation: true,
            },
            label: {
              show: true,
              position: "right",
              distance: 5,
              formatter: "{b}",
              color: "#333",
              fontWeight: 500,
            },
            edgeLabel: {
              show: false,
              formatter: "{c}",
              fontSize: 10,
            },
            edgeSymbol: ["none", "arrow"],
            edgeSymbolSize: [0, 8],
            emphasis: {
              focus: "adjacency",
              scale: true,
              labelFontSize: 14,
              lineStyle: {
                width: 4,
              },
            },
            labelLayout: {
              hideOverlap: true,
              dx: 10, // 增加标签水平偏移
            },
            animation: true,
            autoCurveness: true, // 自动计算曲度，避免重叠
            circular: {
              rotateLabel: true,
            },
          },
        ],
      };
    });

    // 获取知识图谱数据
    const fetchGraphData = async () => {
      loading.value = true;
      error.value = null;

      try {
        const response = await GraphControllerService.getTagsGraph();
        if (response.code === 200 && response.data) {
          graphData.value = response.data;
        } else {
          error.value = response.message || "获取知识图谱失败";
        }
      } catch (err) {
        console.error("获取知识图谱出错:", err);
        error.value = "连接服务器失败，请稍后再试";
      } finally {
        loading.value = false;
      }
    };

    const refreshGraph = () => {
      fetchGraphData();
    };

    onMounted(() => {
      fetchGraphData();
    });

    return {
      graphData,
      graphOption,
      loading,
      error,
      refreshGraph,
    };
  },
});
</script>

<style scoped>
.knowledge-graph-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.graph-header h2 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.graph-actions {
  display: flex;
  gap: 10px;
}

.graph-content {
  flex: 1;
  position: relative;
  min-height: 500px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading-container,
.error-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.graph-chart-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.knowledge-graph-chart {
  width: 100%;
  height: 100%;
  min-height: 500px;
  border-radius: 8px;
  overflow: hidden;
}

.graph-legend {
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.legend-color {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-right: 8px;
}
</style>

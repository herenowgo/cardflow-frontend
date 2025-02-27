<template>
  <div class="knowledge-graph-container">
    <div class="graph-sidebar">
      <div class="sidebar-section search-section">
        <h3>搜索节点</h3>
        <div class="search-input-wrapper">
          <a-input-search
            v-model="searchText"
            placeholder="输入标签或卡片名称..."
            allow-clear
            @search="searchNode"
          />
        </div>
        <div v-if="searchResults.length > 0" class="search-results">
          <div class="results-title">搜索结果：</div>
          <a-list size="small">
            <a-list-item
              v-for="node in searchResults"
              :key="node.id"
              class="search-result-item"
              @click="focusOnNode(String(node.id))"
            >
              <div class="result-item-content">
                <div
                  class="result-item-icon"
                  :class="node.type === 0 ? 'tag-icon' : 'card-icon'"
                ></div>
                <div class="result-item-name">{{ node.name }}</div>
              </div>
            </a-list-item>
          </a-list>
        </div>
      </div>

      <div class="sidebar-section legend-section">
        <h3>图例说明</h3>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #5b8ff9"></div>
          <span>标签</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background-color: #5ad8a6"></div>
          <span>卡片</span>
        </div>
      </div>

      <div class="sidebar-section stats-section">
        <h3>统计信息</h3>
        <div class="stat-item">
          <span class="stat-label">节点总数:</span>
          <span class="stat-value">{{ totalNodes }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">连接总数:</span>
          <span class="stat-value">{{ totalEdges }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">标签数量:</span>
          <span class="stat-value">{{ totalTags }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">卡片数量:</span>
          <span class="stat-value">{{ totalCards }}</span>
        </div>
      </div>
    </div>

    <div class="graph-main">
      <div class="graph-header">
        <h2>我的知识图谱</h2>
        <div class="graph-actions">
          <a-button
            v-if="isNodeFocused || isSearchActive"
            type="primary"
            @click="resetView"
          >
            <template #icon><icon-undo /></template>
            返回完整图谱
          </a-button>
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
            ref="chartRef"
            class="knowledge-graph-chart"
            :option="graphOption"
            autoresize
            @dblclick="handleNodeDblClick"
          />

          <!-- 节点操作菜单 -->
          <div
            v-if="showNodeMenu"
            class="node-action-menu"
            :style="nodeMenuStyle"
          >
            <div
              class="action-item"
              v-for="(item, index) in nodeActionItems"
              :key="index"
              :style="getActionItemStyle(index)"
              @click="item.action(activeNodeId)"
              :title="item.name"
            >
              <span class="action-icon">{{ item.icon }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  computed,
  nextTick,
  watch,
} from "vue";
import { use } from "echarts/core";
import * as echarts from "echarts/core";
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
    const chartRef = ref<any>(null);

    // 搜索相关状态
    const searchText = ref("");
    const searchResults = ref<any[]>([]);
    const isSearchActive = ref(false);

    // 节点交互相关状态
    const showNodeMenu = ref(false);
    const activeNodeId = ref<string | null>(null);
    const nodeMenuPosition = ref({ x: 0, y: 0 });
    const menuRadius = 60; // 环形菜单半径

    // 节点聚焦状态
    const isNodeFocused = ref(false);
    const originalGraphData = ref<GraphDTO | null>(null);
    const focusedNodeId = ref<string | null>(null);

    // 环形菜单样式计算
    const nodeMenuStyle = computed(() => {
      return {
        left: `${nodeMenuPosition.value.x}px`,
        top: `${nodeMenuPosition.value.y}px`,
      };
    });

    // 环形菜单项
    const nodeActionItems = [
      {
        name: "聚焦",
        icon: "🔍",
        action: (nodeId: string | null) => {
          if (nodeId) {
            focusOnNode(nodeId);
            hideNodeMenu();
          }
        },
      },
      // 这里可以轻松添加更多菜单项
    ];

    // 计算每个菜单项的位置
    const getActionItemStyle = (index: number) => {
      const totalItems = nodeActionItems.length;
      // 计算角度，从顶部开始，顺时针排列
      const angle = (index * (360 / totalItems) - 90) * (Math.PI / 180);
      return {
        transform: `translate(${menuRadius * Math.cos(angle)}px, ${
          menuRadius * Math.sin(angle)
        }px)`,
      };
    };

    // 处理节点双击事件
    const handleNodeDblClick = (params: any) => {
      if (
        params.componentType === "series" &&
        params.seriesType === "graph" &&
        params.dataType === "node"
      ) {
        // 保存当前活跃节点ID
        activeNodeId.value = params.data.id;

        // 计算菜单位置（相对于图表容器）
        const chartDom = chartRef.value?.chart;
        if (chartDom) {
          // 将图表坐标转换为容器坐标
          const pointInPixel = chartDom.convertToPixel(
            "grid",
            params.event.offsetPos
          );
          nodeMenuPosition.value = {
            x: pointInPixel ? pointInPixel[0] : params.event.offsetX,
            y: pointInPixel ? pointInPixel[1] : params.event.offsetY,
          };

          // 显示菜单
          showNodeMenu.value = true;
        }
      } else {
        hideNodeMenu();
      }
    };

    // 隐藏节点菜单
    const hideNodeMenu = () => {
      showNodeMenu.value = false;
      activeNodeId.value = null;
    };

    // 聚焦到节点
    const focusOnNode = (nodeId: string) => {
      if (!graphData.value) return;

      // 备份原始数据
      if (!originalGraphData.value) {
        originalGraphData.value = JSON.parse(JSON.stringify(graphData.value));
      }

      const { nodes, edges } = graphData.value;
      if (!nodes || !edges) return;

      // 找出目标节点
      const targetNode = nodes.find((node) => String(node.id) === nodeId);
      if (!targetNode) return;

      // 找出与此节点直接相连的边和节点
      const connectedEdges = edges.filter(
        (edge) =>
          String(edge.source) === nodeId || String(edge.target) === nodeId
      );

      const connectedNodeIds = new Set<string>();
      connectedNodeIds.add(nodeId);

      // 收集所有相连的节点ID
      connectedEdges.forEach((edge) => {
        connectedNodeIds.add(String(edge.source));
        connectedNodeIds.add(String(edge.target));
      });

      // 过滤出相关节点和边
      const filteredNodes = nodes.filter((node) =>
        connectedNodeIds.has(String(node.id))
      );
      const filteredEdges = edges.filter(
        (edge) =>
          connectedNodeIds.has(String(edge.source)) &&
          connectedNodeIds.has(String(edge.target))
      );

      // 更新图表数据
      graphData.value = {
        nodes: filteredNodes,
        edges: filteredEdges,
      };

      // 更新聚焦状态
      isNodeFocused.value = true;
      focusedNodeId.value = nodeId;
      isSearchActive.value = true;

      // 重置环形菜单
      hideNodeMenu();
    };

    // 重置聚焦，恢复完整图谱
    const resetFocus = () => {
      if (originalGraphData.value) {
        graphData.value = originalGraphData.value;
        originalGraphData.value = null;
        isNodeFocused.value = false;
        focusedNodeId.value = null;
      }
    };

    // 监听点击事件以关闭菜单
    onMounted(() => {
      fetchGraphData();

      document.addEventListener("click", (event) => {
        // 点击外部区域关闭菜单
        if (showNodeMenu.value) {
          hideNodeMenu();
        }
      });
    });

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
            // 聚焦节点高亮显示
            ...(focusedNodeId.value === String(node.id)
              ? {
                  color: "#FF7D00",
                  borderWidth: 4,
                  borderColor: "#FF5500",
                }
              : {}),
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
              itemStyle: {
                borderWidth: 2,
                borderColor: "#FF5500",
              },
              lineStyle: {
                width: 4,
                color: "#FF5500",
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

    // 统计信息计算
    const totalNodes = computed(() => graphData.value?.nodes?.length || 0);
    const totalEdges = computed(() => graphData.value?.edges?.length || 0);
    const totalTags = computed(() => {
      return (
        graphData.value?.nodes?.filter((node) => node.type === NodeDTO.type.TAG)
          .length || 0
      );
    });
    const totalCards = computed(() => {
      return (
        graphData.value?.nodes?.filter(
          (node) => node.type === NodeDTO.type.CARD
        ).length || 0
      );
    });

    // 搜索节点函数
    const searchNode = () => {
      if (!searchText.value.trim() || !graphData.value?.nodes) {
        searchResults.value = [];
        return;
      }

      const searchTerm = searchText.value.toLowerCase().trim();

      // 查找匹配的节点
      searchResults.value = graphData.value.nodes.filter(
        (node) => node.name && node.name.toLowerCase().includes(searchTerm)
      );
    };

    // 监听搜索文本变化，实时搜索
    watch(searchText, () => {
      searchNode();
    });

    // 重置视图（包括聚焦和搜索结果）
    const resetView = () => {
      resetFocus();
      searchText.value = "";
      searchResults.value = [];
      isSearchActive.value = false;
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
      chartRef,
      // 节点菜单相关
      showNodeMenu,
      activeNodeId,
      nodeMenuStyle,
      nodeActionItems,
      getActionItemStyle,
      handleNodeDblClick,
      hideNodeMenu,
      // 聚焦相关
      isNodeFocused,
      resetFocus,
      focusOnNode,
      // 搜索相关
      searchText,
      searchResults,
      searchNode,
      isSearchActive,
      resetView,
      // 统计信息
      totalNodes,
      totalEdges,
      totalTags,
      totalCards,
    };
  },
});
</script>

<style scoped>
.knowledge-graph-container {
  height: 100%;
  display: flex;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* 侧边栏样式 */
.graph-sidebar {
  width: 280px;
  padding: 20px;
  border-right: 1px solid #eaeaea;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: auto;
}

.sidebar-section {
  background-color: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.sidebar-section h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.search-input-wrapper {
  margin-bottom: 16px;
}

.search-results {
  max-height: 200px;
  overflow-y: auto;
}

.results-title {
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
}

.search-result-item {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.search-result-item:hover {
  background-color: #f5f5f5;
}

.result-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-item-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.tag-icon {
  background-color: #5b8ff9;
}

.card-icon {
  background-color: #5ad8a6;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.legend-color {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-right: 8px;
}

.stat-item {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 500;
  color: #333;
}

/* 主要内容区域样式 */
.graph-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
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
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background-color: white;
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
  border-radius: 8px;
  overflow: hidden;
}

.node-action-menu {
  position: absolute;
  width: 0;
  height: 0;
  z-index: 100;
}

.action-item {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  transform: translate(-50%, -50%);
  font-size: 18px;
  user-select: none;
}

.action-item:hover {
  transform: translate(-50%, -50%) scale(1.1);
  background-color: #f0f9ff;
}

.action-icon {
  pointer-events: none;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .knowledge-graph-container {
    flex-direction: column;
  }

  .graph-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #eaeaea;
    max-height: 200px;
  }
}
</style>

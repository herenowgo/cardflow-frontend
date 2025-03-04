import { EventMessage, StreamingEventMessage } from "@/models/EventMessage";
import store from "@/store";
import { ref } from "vue";

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeout: NodeJS.Timeout;
}

interface StreamingMessage {
  content: string;
  sequence: number;
}

class EventStreamService {
  private readonly baseUrl = "http://localhost:8101/api";
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private autoReconnect = true;

  // 使用 ref 来存储最新消息，便于组件响应式更新
  public latestMessage = ref<EventMessage | null>(null);

  // 存储不同事件类型的处理函数
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();

  // 存储待处理的请求
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly REQUEST_TIMEOUT = 300000; // 300 seconds timeout

  // 存储流式消息的Map
  private streamingMessages: Map<string, Map<number, string>> = new Map();

  // 存储流式消息的处理函数
  private streamingHandlers: Map<string, (content: string) => void> = new Map();

  // 检查连接状态
  public isConnected(): boolean {
    return (
      this.eventSource !== null &&
      this.eventSource.readyState === EventSource.OPEN
    );
  }

  public connect(userId: string | number) {
    if (this.eventSource) {
      this.disconnect();
    }

    const userIdStr = String(userId);
    const url = `${this.baseUrl}/stream/subscribe/${userIdStr}`;

    this.eventSource = new EventSource(url, { withCredentials: true });

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0;
      // 存储连接信息到 localStorage
      localStorage.setItem("sseUserId", userIdStr);
    };

    this.eventSource.onmessage = this.handleMessage;

    this.eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      this.handleError();
    };

    // 添加页面可见性变化监听
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    // 添加在线状态监听
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.reconnectAttempts = 0;
      localStorage.removeItem("sseUserId");
    }

    // 移除事件监听
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange
    );
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      const userId = localStorage.getItem("sseUserId");
      if (userId && !this.isConnected()) {
        this.connect(userId);
      }
    }
  };

  private handleOnline = () => {
    const userId = localStorage.getItem("sseUserId");
    if (userId && !this.isConnected()) {
      this.connect(userId);
    }
  };

  private handleOffline = () => {
    if (this.eventSource) {
      this.disconnect();
    }
  };

  private handleError() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        const userId = store.state.user?.loginUser?.id;
        if (userId) {
          this.connect(userId);
        }
      }, this.reconnectTimeout * Math.pow(2, this.reconnectAttempts));
    }
  }

  // 添加事件处理函数
  public on(eventType: string, handler: (data: any) => void) {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }

  // 移除事件处理函数
  public off(eventType: string, handler: (data: any) => void) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
      if (handlers.length === 0) {
        this.eventHandlers.delete(eventType);
      }
    }
  }

  // 等待特定请求ID的结果
  public waitForResult(requestId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error("Request timeout"));
      }, this.REQUEST_TIMEOUT);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
      });
    });
  }

  // 等待流式消息的结果
  public waitForStreamingResult(
    requestId: string,
    onUpdate: (content: string) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.streamingHandlers.delete(requestId);
        this.streamingMessages.delete(requestId);
        reject(new Error("Request timeout"));
      }, this.REQUEST_TIMEOUT);

      // 初始化消息Map
      this.streamingMessages.set(requestId, new Map());

      // 存储处理函数
      this.streamingHandlers.set(requestId, onUpdate);

      this.pendingRequests.set(requestId, {
        resolve: (finalContent: string) => {
          clearTimeout(timeout);
          this.streamingHandlers.delete(requestId);
          this.streamingMessages.delete(requestId);
          resolve(finalContent);
        },
        reject: (error: any) => {
          clearTimeout(timeout);
          this.streamingHandlers.delete(requestId);
          this.streamingMessages.delete(requestId);
          reject(error);
        },
        timeout,
      });
    });
  }

  // 修改现有的 onmessage 处理
  private handleMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as EventMessage;
      this.latestMessage.value = message;

      // 处理流式消息
      if (
        (message.eventType === "CODE_SUGGEST" ||
          message.eventType === "CHAT" ||
          message.eventType === "ANSWER" ||
          message.eventType === "TAGS") &&
        message.requestId
      ) {
        // 检查是否是结束消息
        if (message.sequence === -1) {
          // 处理结束消息
          const streamingMessage: StreamingEventMessage = {
            requestId: message.requestId,
            data: {
              sequence: -1,
              content: "",
              isEnd: true, // 标记为结束消息
            },
          };
          this.handleStreamingMessage(streamingMessage);
        } else {
          // 处理正常消息
          const sequence =
            typeof message.sequence === "number" ? message.sequence : 1;

          // 对于 TAGS 事件类型，将数组转换为字符串
          const content =
            message.eventType === "TAGS"
              ? JSON.stringify({ eventType: "TAGS", data: message.data })
              : message.data || "";

          const streamingMessage: StreamingEventMessage = {
            requestId: message.requestId,
            data: {
              sequence: sequence,
              content: content,
              isEnd: false,
            },
          };
          this.handleStreamingMessage(streamingMessage);
        }
      } else if (message.eventType === "JUDGE_RESULT" && message.requestId) {
        const pendingRequest = this.pendingRequests.get(message.requestId);
        if (pendingRequest) {
          clearTimeout(pendingRequest.timeout);
          this.pendingRequests.delete(message.requestId);
          pendingRequest.resolve(message.data);
        }
      } else if (message.eventType === "CARDS_GENERATE" && message.requestId) {
        // 处理卡片生成事件
        const pendingRequest = this.pendingRequests.get(message.requestId);
        if (pendingRequest) {
          clearTimeout(pendingRequest.timeout);
          this.pendingRequests.delete(message.requestId);
          pendingRequest.resolve(message.data);
        }
      } else if (message.eventType === "CARDS_GENERATED" && message.requestId) {
        // 处理卡片生成事件
        const pendingRequest = this.pendingRequests.get(message.requestId);
        if (pendingRequest) {
          clearTimeout(pendingRequest.timeout);
          this.pendingRequests.delete(message.requestId);
          pendingRequest.resolve(message.data);
        }
      }

      // 继续处理其他事件类型
      const handlers = this.eventHandlers.get(message.eventType);
      if (handlers) {
        handlers.forEach((handler) => handler(message.data));
      }
    } catch (error) {
      console.error("Failed to parse event data:", error);
    }
  };

  private handleStreamingMessage(message: StreamingEventMessage) {
    const { requestId, data } = message;
    if (!requestId) return;

    const messageMap = this.streamingMessages.get(requestId);
    const handler = this.streamingHandlers.get(requestId);
    if (!messageMap || !handler) {
      console.warn("No message map or handler for requestId:", requestId);
      return;
    }

    if (data.isEnd) {
      // 处理结束消息
      const pendingRequest = this.pendingRequests.get(requestId);
      if (pendingRequest) {
        // 获取完整内容
        let fullContent = "";
        const sortedEntries = Array.from(messageMap.entries()).sort(
          ([a], [b]) => a - b
        );
        for (const [_, content] of sortedEntries) {
          fullContent += content;
        }

        // 清理资源
        clearTimeout(pendingRequest.timeout);
        this.pendingRequests.delete(requestId);
        this.streamingMessages.delete(requestId);
        this.streamingHandlers.delete(requestId);

        // 解析 Promise
        pendingRequest.resolve(fullContent);
      }
      return;
    }

    // 存储新消息
    if (data.content) {
      messageMap.set(data.sequence, data.content);

      // 按顺序拼接消息
      let fullContent = "";
      const sortedEntries = Array.from(messageMap.entries()).sort(
        ([a], [b]) => a - b
      );
      for (const [_, content] of sortedEntries) {
        fullContent += content;
      }

      // 立即调用更新处理函数
      handler(fullContent);
    } else {
      console.warn("Empty content received for sequence:", data.sequence);
    }
  }

  // 添加取消请求的公共方法
  public cancelRequest(requestId: string) {
    const pendingRequest = this.pendingRequests.get(requestId);
    if (pendingRequest) {
      clearTimeout(pendingRequest.timeout);
      pendingRequest.reject(new Error("用户取消生成"));
      this.pendingRequests.delete(requestId);

      // 清理相关资源
      this.streamingHandlers.delete(requestId);
      this.streamingMessages.delete(requestId);
    }
  }
}

export const eventStreamService = new EventStreamService();

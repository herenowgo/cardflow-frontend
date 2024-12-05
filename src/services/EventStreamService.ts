import { ref } from "vue";
import { EventMessage } from "@/models/EventMessage";
import store from "@/store";

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
    console.log("Attempting to connect SSE at:", url);

    this.eventSource = new EventSource(url, { withCredentials: true });

    this.eventSource.onopen = () => {
      console.log("SSE connection established");
      this.reconnectAttempts = 0;
      // 存储连接信息到 localStorage
      localStorage.setItem("sseUserId", userIdStr);
    };

    this.eventSource.onmessage = (event) => {
      try {
        const message: EventMessage = JSON.parse(event.data);
        this.latestMessage.value = message;
        console.log("Received SSE message:", message);

        const handlers = this.eventHandlers.get(message.eventType);
        if (handlers) {
          handlers.forEach((handler) => handler(message.data));
        }
      } catch (error) {
        console.error("Failed to parse event data:", error);
      }
    };

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
}

export const eventStreamService = new EventStreamService();

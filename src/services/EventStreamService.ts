import { ref } from "vue";
import { EventMessage } from "@/models/EventMessage";
import store from "@/store";

class EventStreamService {
  private readonly baseUrl = "/api";
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;

  // 使用 ref 来存储最新消息，便于组件响应式更新
  public latestMessage = ref<EventMessage | null>(null);

  // 存储不同事件类型的处理函数
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();

  public connect(userId: string | number) {
    if (this.eventSource) {
      this.disconnect();
    }

    // 确保 userId 是字符串类型
    const userIdStr = String(userId);
    const url = `
http://localhost:8101/api/stream/subscribe/${userIdStr}`;
    console.log("Attempting to connect SSE at:", url);

    this.eventSource = new EventSource(url, { withCredentials: true });

    this.eventSource.onopen = () => {
      console.log("SSE connection established");
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const message: EventMessage = JSON.parse(event.data);
        this.latestMessage.value = message;
        console.log("Received SSE message:", message);

        // 调用对应事件类型的所有处理函数
        const handlers = this.eventHandlers.get(message.eventType);
        if (handlers) {
          handlers.forEach((handler) => handler(message.data));
        }
      } catch (error) {
        console.error("Failed to parse event data:", error);
      }
    };

    this.eventSource.onerror = () => {
      console.error("SSE connection error");
      this.handleError();
    };
  }

  public disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.reconnectAttempts = 0;
    }
  }

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

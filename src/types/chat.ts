export interface ChatMessage {
  avatar: string;
  name: string;
  datetime: string;
  content: string;
  role: "user" | "assistant" | "model-change";
}

export interface ChatProps {
  // 初始消息列表
  initialMessages?: ChatMessage[];
  // 用户头像
  userAvatar?: string;
  // AI头像
  aiAvatar?: string;
  // 用户名称
  userName?: string;
  // AI名称
  aiName?: string;
  // 对话框标题
  title?: string;
  // 对话框高度
  height?: string | number;
  // 是否可拖拽
  draggable?: boolean;
  // 是否显示清空按钮
  showClear?: boolean;
  // 自定义样式
  customClass?: string;
}

export interface ChatEvents {
  // 发送消息时触发
  (e: "send", message: string): void;
  // 清空历史时触发
  (e: "clear"): void;
  // 停止生成时触发
  (e: "stop"): void;
  // 对话框关闭时触发
  (e: "close"): void;
}

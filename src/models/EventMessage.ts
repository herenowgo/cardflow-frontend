export interface EventMessage {
  eventType: string;
  requestId?: string;
  sequence?: number;
  data: string | any;
}

export interface StreamingEventMessage {
  requestId: string;
  data: {
    sequence: number;
    content: string;
    isEnd?: boolean;
  };
}

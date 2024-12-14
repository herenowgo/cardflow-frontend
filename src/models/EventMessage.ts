export interface EventMessage {
  eventType: string;
  requestId?: string;
  data: any;
}

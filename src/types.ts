export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
  mock?: boolean;
}

export interface Chat {
  chatId: string;
  phoneNumber: string;
  name: string;
  createdAt: number;
}

export type MessageStatus = 'pending' | 'sent' | 'failed';

export interface ChatMessage {
  id: string;
  chatId: string;
  text: string;
  direction: 'outgoing' | 'incoming';
  timestamp: number;
  status: MessageStatus;
  reaction?: string;
}

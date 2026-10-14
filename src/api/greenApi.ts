import type { Credentials } from '../types';

export class GreenApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GreenApiError';
    this.status = status;
  }
}

function buildUrl(creds: Credentials, method: string, suffix = ''): string {
  const host = creds.apiUrl.replace(/\/+$/, '');
  const token = creds.apiTokenInstance.trim();
  return `${host}/waInstance${creds.idInstance.trim()}/${method}/${token}${suffix}`;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new GreenApiError('Network error while calling GREEN-API. Check your connection.');
  }

  const text = await response.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message?: unknown }).message)
        : undefined) ?? `Request failed with status ${response.status}`;
    throw new GreenApiError(message, response.status);
  }

  return data as T;
}

export interface GetSettingsResponse {
  wid?: string;
  [key: string]: unknown;
}

export function getSettings(creds: Credentials): Promise<GetSettingsResponse> {
  return request(buildUrl(creds, 'getSettings'));
}

export interface CheckWhatsappResponse {
  existsWhatsapp: boolean;
}

export function checkWhatsapp(creds: Credentials, phoneNumber: string): Promise<CheckWhatsappResponse> {
  return request(buildUrl(creds, 'checkWhatsapp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
  });
}

export interface SendMessageResponse {
  idMessage: string;
}

export function sendMessage(creds: Credentials, chatId: string, message: string): Promise<SendMessageResponse> {
  return request(buildUrl(creds, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  });
}

export interface IncomingMessageNotification {
  typeWebhook: string;
  timestamp: number;
  idMessage?: string;
  senderData?: {
    chatId: string;
    chatName?: string;
    sender?: string;
    senderName?: string;
    senderPhoneNumber?: number;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: {
      textMessage: string;
    };
    extendedTextMessageData?: {
      text: string;
    };
    quotedMessage?: {
      stanzaId: string;
      participant?: string;
    };
  };
}

export interface ReceivedNotification {
  receiptId: number;
  body: IncomingMessageNotification;
}

export async function receiveNotification(
  creds: Credentials,
  receiveTimeout = 20,
): Promise<ReceivedNotification | null> {
  const result = await request<ReceivedNotification | null | ''>(
    buildUrl(creds, 'receiveNotification', `?receiveTimeout=${receiveTimeout}`),
  );
  if (!result) return null;
  return result;
}

export function deleteNotification(creds: Credentials, receiptId: number): Promise<{ result: boolean }> {
  return request(buildUrl(creds, 'deleteNotification', `/${receiptId}`), { method: 'DELETE' });
}

export interface GreenApiClient {
  getSettings(creds: Credentials): Promise<GetSettingsResponse>;
  checkWhatsapp(creds: Credentials, phoneNumber: string): Promise<CheckWhatsappResponse>;
  sendMessage(creds: Credentials, chatId: string, message: string): Promise<SendMessageResponse>;
  receiveNotification(creds: Credentials, receiveTimeout?: number): Promise<ReceivedNotification | null>;
  deleteNotification(creds: Credentials, receiptId: number): Promise<{ result: boolean }>;
}

export const liveApi: GreenApiClient = {
  getSettings,
  checkWhatsapp,
  sendMessage,
  receiveNotification,
  deleteNotification,
};

import type { Chat, ChatMessage, Credentials } from './types';

const CREDENTIALS_KEY = 'wa-chat:credentials';

export function loadCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    return raw ? (JSON.parse(raw) as Credentials) : null;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: Credentials): void {
  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
  } catch {}
}

export function clearCredentials(): void {
  try {
    localStorage.removeItem(CREDENTIALS_KEY);
  } catch {}
}

function dataKey(idInstance: string): string {
  return `wa-chat:data:${idInstance}`;
}

interface PersistedData {
  chats: Chat[];
  messages: Record<string, ChatMessage[]>;
}

export function loadChatData(idInstance: string): PersistedData {
  try {
    const raw = localStorage.getItem(dataKey(idInstance));
    if (!raw) return { chats: [], messages: {} };
    const parsed = JSON.parse(raw) as PersistedData;
    return { chats: parsed.chats ?? [], messages: parsed.messages ?? {} };
  } catch {
    return { chats: [], messages: {} };
  }
}

export function saveChatData(idInstance: string, data: PersistedData): void {
  try {
    localStorage.setItem(dataKey(idInstance), JSON.stringify(data));
  } catch {}
}

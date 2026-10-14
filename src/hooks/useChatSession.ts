import { useCallback, useEffect, useRef, useState } from 'react';
import { liveApi, type IncomingMessageNotification } from '../api/greenApi';
import { mockApi } from '../api/mockGreenApi';
import { loadChatData, saveChatData } from '../storage';
import type { Chat, ChatMessage, Credentials } from '../types';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

const DEMO_CHAT_ID = 'demo-welcome';

function seedDemoChat(): { chats: Chat[]; messages: Record<string, ChatMessage[]> } {
  const now = Date.now();
  return {
    chats: [{ chatId: DEMO_CHAT_ID, phoneNumber: '00000000000', name: 'GREEN-API Демо', createdAt: now }],
    messages: {
      [DEMO_CHAT_ID]: [
        {
          id: 'welcome-1',
          chatId: DEMO_CHAT_ID,
          text: 'Это демо-режим — данные генерируются локально, ничего не отправляется в GREEN-API. Начните новый чат с любым номером телефона или просто напишите сообщение здесь.',
          direction: 'incoming',
          timestamp: Math.floor(now / 1000),
          status: 'sent',
        },
      ],
    },
  };
}

export function useChatSession(creds: Credentials) {
  const api = creds.mock ? mockApi : liveApi;
  const initial = (() => {
    const loaded = loadChatData(creds.idInstance);
    if (creds.mock && loaded.chats.length === 0) return seedDemoChat();
    return loaded;
  })();
  const [chats, setChats] = useState<Chat[]>(initial.chats);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, ChatMessage[]>>(initial.messages);
  const [activeChatId, setActiveChatId] = useState<string | null>(initial.chats[0]?.chatId ?? null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const credsRef = useRef(creds);
  credsRef.current = creds;

  useEffect(() => {
    saveChatData(creds.idInstance, { chats, messages: messagesByChat });
  }, [chats, messagesByChat]);

  const processNotification = useCallback((body: IncomingMessageNotification) => {
    if (body.typeWebhook !== 'incomingMessageReceived') return;
    const chatId = body.senderData?.chatId;
    if (!chatId) return;

    if (body.messageData?.typeMessage === 'reactionMessage') {
      const targetId = body.messageData.quotedMessage?.stanzaId;
      if (!targetId) return;
      const emoji = body.messageData.extendedTextMessageData?.text || undefined;
      setMessagesByChat((prev) => {
        const existing = prev[chatId];
        if (!existing || !existing.some((m) => m.id === targetId)) return prev;
        return {
          ...prev,
          [chatId]: existing.map((m) => (m.id === targetId ? { ...m, reaction: emoji } : m)),
        };
      });
      return;
    }

    const text = body.messageData?.textMessageData?.textMessage ?? body.messageData?.extendedTextMessageData?.text;
    if (!text) return;

    const id = body.idMessage ?? `incoming-${body.timestamp}-${chatId}`;
    setMessagesByChat((prev) => {
      const existing = prev[chatId] ?? [];
      if (existing.some((m) => m.id === id)) return prev;
      const message: ChatMessage = {
        id,
        chatId,
        text,
        direction: 'incoming',
        timestamp: body.timestamp ?? Math.floor(Date.now() / 1000),
        status: 'sent',
      };
      return { ...prev, [chatId]: [...existing, message] };
    });

    setChats((prev) => {
      if (prev.some((c) => c.chatId === chatId)) return prev;
      const phone = body.senderData?.senderPhoneNumber
        ? String(body.senderData.senderPhoneNumber)
        : chatId.split('@')[0];
      const name = body.senderData?.chatName || body.senderData?.senderName || phone;
      const chat: Chat = { chatId, phoneNumber: phone, name, createdAt: Date.now() };
      return [...prev, chat];
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        try {
          const notification = await api.receiveNotification(credsRef.current, 20);
          if (cancelled) return;
          if (notification) {
            processNotification(notification.body);
            try {
              await api.deleteNotification(credsRef.current, notification.receiptId);
            } catch {}
          }
          setConnectionError(null);
        } catch (err) {
          if (cancelled) return;
          setConnectionError(err instanceof Error ? err.message : 'Не удалось подключиться к GREEN-API');
          await sleep(5000);
        }
      }
    }

    loop();
    return () => {
      cancelled = true;
    };
  }, [creds.idInstance, creds.apiTokenInstance, creds.apiUrl, creds.mock, processNotification]);

  const createChat = useCallback(
    async (phoneRaw: string): Promise<string> => {
      const phoneNumber = normalizePhone(phoneRaw);
      if (!phoneNumber) {
        throw new Error('Введите номер телефона');
      }

      const existing = chats.find((c) => c.phoneNumber === phoneNumber);
      if (existing) {
        setActiveChatId(existing.chatId);
        return existing.chatId;
      }

      const result = await api.checkWhatsapp(credsRef.current, phoneNumber);
      if (!result.existsWhatsapp) {
        throw new Error('По этому номеру не найден аккаунт WhatsApp');
      }

      const chat: Chat = {
        chatId: `${phoneNumber}@c.us`,
        phoneNumber,
        name: phoneNumber,
        createdAt: Date.now(),
      };
      setChats((prev) => (prev.some((c) => c.chatId === chat.chatId) ? prev : [...prev, chat]));
      setActiveChatId(chat.chatId);
      return chat.chatId;
    },
    [chats],
  );

  const sendMessageText = useCallback(async (chatId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: ChatMessage = {
      id: tempId,
      chatId,
      text: trimmed,
      direction: 'outgoing',
      timestamp: Math.floor(Date.now() / 1000),
      status: 'pending',
    };
    setMessagesByChat((prev) => ({ ...prev, [chatId]: [...(prev[chatId] ?? []), optimistic] }));

    try {
      const res = await api.sendMessage(credsRef.current, chatId, trimmed);
      setMessagesByChat((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] ?? []).map((m) =>
          m.id === tempId ? { ...m, id: res.idMessage, status: 'sent' } : m,
        ),
      }));
    } catch (err) {
      setMessagesByChat((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] ?? []).map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)),
      }));
      throw err;
    }
  }, []);

  return {
    chats,
    messagesByChat,
    activeChatId,
    setActiveChatId,
    connectionError,
    createChat,
    sendMessageText,
  };
}

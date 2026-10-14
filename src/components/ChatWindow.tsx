import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { avatarGradient } from '../avatarGradient';
import type { Chat, ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatWindowProps {
  chat: Chat | null;
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void>;
}

export function ChatWindow({ chat, messages, onSend }: ChatWindowProps) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, chat?.chatId]);

  if (!chat) {
    return (
      <div className="chat-window chat-window-empty">
        <p>Выберите чат или создайте новый, чтобы отправить сообщение.</p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    setSending(true);
    const text = draft;
    setDraft('');
    try {
      await onSend(text);
    } catch {
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="chat-avatar" style={{ background: avatarGradient(chat.chatId) }}>
          {chat.name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <div className="chat-window-title">{chat.name}</div>
          <div className="chat-window-subtitle">{chat.phoneNumber}</div>
        </div>
      </div>

      <div className="chat-window-messages">
        {messages.length === 0 && (
          <div className="chat-window-empty-hint">Пока нет сообщений. Напишите первым!</div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение…"
          rows={1}
        />
        <button type="submit" className="primary-button" disabled={!draft.trim() || sending} title="Отправить">
          Отправить
        </button>
      </form>
    </div>
  );
}

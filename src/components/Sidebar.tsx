import { useState, type FormEvent } from 'react';
import { avatarGradient } from '../avatarGradient';
import type { Chat, ChatMessage } from '../types';

interface SidebarProps {
  chats: Chat[];
  messagesByChat: Record<string, ChatMessage[]>;
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateChat: (phoneNumber: string) => Promise<string>;
  onLogout: () => void;
}

export function Sidebar({ chats, messagesByChat, activeChatId, onSelectChat, onCreateChat, onLogout }: SidebarProps) {
  const [showNewChat, setShowNewChat] = useState(chats.length === 0);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await onCreateChat(phone);
      setPhone('');
      setShowNewChat(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start chat');
    } finally {
      setCreating(false);
    }
  }

  const sortedChats = [...chats].sort((a, b) => {
    const lastA = messagesByChat[a.chatId]?.at(-1)?.timestamp ?? a.createdAt / 1000;
    const lastB = messagesByChat[b.chatId]?.at(-1)?.timestamp ?? b.createdAt / 1000;
    return lastB - lastA;
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Chats</h2>
        <div className="sidebar-header-actions">
          <button className="icon-button" onClick={() => setShowNewChat((v) => !v)} title="New chat">
            +
          </button>
          <button className="link-button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>

      {showNewChat && (
        <form className="new-chat-form" onSubmit={handleCreate}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Recipient phone number, e.g. 79991234567"
            inputMode="tel"
            autoFocus
          />
          <button type="submit" className="primary-button" disabled={creating}>
            {creating ? 'Checking…' : 'Start chat'}
          </button>
          {error && <div className="form-error">{error}</div>}
        </form>
      )}

      <ul className="chat-list">
        {sortedChats.map((chat) => {
          const lastMessage = messagesByChat[chat.chatId]?.at(-1);
          return (
            <li
              key={chat.chatId}
              className={`chat-list-item ${chat.chatId === activeChatId ? 'active' : ''}`}
              onClick={() => onSelectChat(chat.chatId)}
            >
              <div className="chat-avatar" style={{ background: avatarGradient(chat.chatId) }}>
                {chat.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="chat-list-item-text">
                <div className="chat-list-item-name">{chat.name}</div>
                <div className="chat-list-item-preview">{lastMessage ? lastMessage.text : 'No messages yet'}</div>
              </div>
            </li>
          );
        })}
        {sortedChats.length === 0 && <li className="chat-list-empty">No chats yet. Start one above.</li>}
      </ul>
    </aside>
  );
}

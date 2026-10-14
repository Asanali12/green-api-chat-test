import { useState } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { LoginForm } from './components/LoginForm';
import { Sidebar } from './components/Sidebar';
import { useChatSession } from './hooks/useChatSession';
import { clearCredentials, loadCredentials, saveCredentials } from './storage';
import type { Credentials } from './types';
import './App.css';

function ChatApp({ credentials, onLogout }: { credentials: Credentials; onLogout: () => void }) {
  const { chats, messagesByChat, activeChatId, setActiveChatId, connectionError, createChat, sendMessageText } =
    useChatSession(credentials);

  const activeChat = chats.find((c) => c.chatId === activeChatId) ?? null;
  const activeMessages = activeChatId ? messagesByChat[activeChatId] ?? [] : [];

  return (
    <div className="app-shell">
      {credentials.mock && (
        <div className="mock-banner">Демо-режим — показаны тестовые данные, подключения к GREEN-API нет.</div>
      )}
      {!credentials.mock && connectionError && (
        <div className="connection-banner">Проблема с подключением: {connectionError} — повтор…</div>
      )}
      <div className="app-layout">
        <Sidebar
          chats={chats}
          messagesByChat={messagesByChat}
          activeChatId={activeChatId}
          onSelectChat={setActiveChatId}
          onCreateChat={createChat}
          onLogout={onLogout}
        />
        <ChatWindow
          chat={activeChat}
          messages={activeMessages}
          onSend={(text) => sendMessageText(activeChat!.chatId, text)}
        />
      </div>
    </div>
  );
}

function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(() => loadCredentials());

  function handleLogin(creds: Credentials) {
    saveCredentials(creds);
    setCredentials(creds);
  }

  function handleLogout() {
    clearCredentials();
    setCredentials(null);
  }

  if (!credentials) {
    return <LoginForm onSuccess={handleLogin} />;
  }

  return <ChatApp key={credentials.idInstance} credentials={credentials} onLogout={handleLogout} />;
}

export default App;

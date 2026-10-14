import type { ChatMessage } from '../types';

function formatTime(timestampSeconds: number): string {
  return new Date(timestampSeconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`message-row ${message.direction} ${message.reaction ? 'has-reaction' : ''}`}>
      <div className={`message-bubble ${message.direction} ${message.status === 'failed' ? 'failed' : ''}`}>
        <span className="message-text">{message.text}</span>
        <span className="message-meta">
          {formatTime(message.timestamp)}
          {message.status === 'pending' && ' · Sending…'}
          {message.status === 'failed' && ' · Failed to send'}
        </span>
        {message.reaction && <span className="message-reaction">{message.reaction}</span>}
      </div>
    </div>
  );
}

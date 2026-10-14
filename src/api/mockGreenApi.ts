import type {
  CheckWhatsappResponse,
  GetSettingsResponse,
  GreenApiClient,
  IncomingMessageNotification,
  ReceivedNotification,
  SendMessageResponse,
} from './greenApi';

// Simulates GREEN-API closely enough to drive the real UI/hook: checkWhatsapp
// always succeeds, sendMessage schedules a canned reply a couple of seconds
// later, and receiveNotification/deleteNotification behave like a real queue
// (the same head notification is re-served until explicitly deleted).

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEMO_NAMES = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Riley'];

function demoNameFor(phoneNumber: string): string {
  let hash = 0;
  for (const ch of phoneNumber) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `${DEMO_NAMES[hash % DEMO_NAMES.length]} (demo)`;
}

const REPLIES = [
  "Hey! This is a simulated reply — GREEN-API isn't actually connected right now.",
  'Mock mode is on, so this message was generated locally.',
  'Got it — but remember, nothing here is really going out over WhatsApp.',
  'Looks good on this end (demo data).',
];

function pickReply(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return REPLIES[hash % REPLIES.length];
}

interface Contact {
  chatId: string;
  phoneNumber: string;
  name: string;
}

const contactsByChatId = new Map<string, Contact>();
let queue: ReceivedNotification[] = [];
let nextReceiptId = 1;

function enqueueIncoming(contact: Contact, text: string): void {
  const notification: ReceivedNotification = {
    receiptId: nextReceiptId++,
    body: {
      typeWebhook: 'incomingMessageReceived',
      timestamp: Math.floor(Date.now() / 1000),
      idMessage: `mock-in-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      senderData: {
        chatId: contact.chatId,
        chatName: contact.name,
        senderName: contact.name,
      },
      messageData: {
        typeMessage: 'textMessage',
        textMessageData: { textMessage: text },
      },
    } satisfies IncomingMessageNotification,
  };
  queue.push(notification);
}

async function getSettings(): Promise<GetSettingsResponse> {
  await sleep(200);
  return { wid: 'demo@c.us' };
}

async function checkWhatsapp(): Promise<CheckWhatsappResponse> {
  await sleep(400);
  return { existsWhatsapp: true };
}

async function sendMessage(_creds: unknown, chatId: string, message: string): Promise<SendMessageResponse> {
  await sleep(300);
  let contact = contactsByChatId.get(chatId);
  if (!contact) {
    const phoneNumber = chatId.split('@')[0];
    contact = { chatId, phoneNumber, name: demoNameFor(phoneNumber) };
    contactsByChatId.set(chatId, contact);
  }
  setTimeout(() => enqueueIncoming(contact, pickReply(message)), 1200 + Math.random() * 1800);
  return { idMessage: `mock-out-${Date.now()}-${Math.random().toString(36).slice(2)}` };
}

async function receiveNotification(_creds: unknown, receiveTimeout = 20): Promise<ReceivedNotification | null> {
  const deadline = Date.now() + receiveTimeout * 1000;
  while (Date.now() < deadline) {
    if (queue.length > 0) return queue[0];
    await sleep(250);
  }
  return null;
}

async function deleteNotification(_creds: unknown, receiptId: number): Promise<{ result: boolean }> {
  const before = queue.length;
  queue = queue.filter((n) => n.receiptId !== receiptId);
  return { result: queue.length < before };
}

export const mockApi: GreenApiClient = {
  getSettings,
  checkWhatsapp,
  sendMessage,
  receiveNotification,
  deleteNotification,
};

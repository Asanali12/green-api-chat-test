# WhatsApp Web Chat

A minimal React UI for sending and receiving text messages in WhatsApp
through [GREEN-API](https://green-api.com/). Built as a test assignment.

## One-time setup: authorize the GREEN-API instance

This app only *uses* an instance — it doesn't create or log one into
WhatsApp. Before `idInstance`/`apiTokenInstance` will work here:

1. Create a WhatsApp instance in the GREEN-API console
   ([console.green-api.com](https://console.green-api.com)).
2. Authorize it with **your own WhatsApp account** by scanning the QR code
   the console shows you (WhatsApp → Linked Devices → Link a Device, same as
   WhatsApp Web). This step is GREEN-API's, not this app's.
3. Once the instance shows as authorized, copy its `idInstance` and
   `apiTokenInstance` — that's what you sign in with below.

## Running it

```bash
npm install
npm run dev
```

Open the printed local URL and sign in with your instance's `idInstance` /
`apiTokenInstance`. Credentials are verified with a `getSettings` call and
stored in `localStorage` so you stay signed in across reloads.

## Using the app

1. Sign in with `idInstance` / `apiTokenInstance`.
2. Click **+** and enter the recipient's phone number (digits only, with
   country code, e.g. `79991234567`) to start a chat. This checks the
   number via `CheckWhatsapp` first, so you get a clear error if it doesn't
   have WhatsApp, then addresses it as `{phone}@c.us` — WhatsApp chat IDs
   are deterministic from the phone number, unlike some of GREEN-API's other
   messenger products.
3. Type a message and press Enter (or click Send). It's sent via
   `SendMessage` and appears as an optimistic bubble that resolves to "sent"
   or "failed".
4. Replies sent from the WhatsApp app arrive automatically: the app
   long-polls `ReceiveNotification` for the lifetime of the session and
   calls `DeleteNotification` once each notification is processed. An
   incoming message for an unknown `chatId` creates a new chat in the
   sidebar.

To actually test it, use two phones/WhatsApp accounts: authorize one as the
GREEN-API instance you sign in with here, and send/reply from the other
WhatsApp account using the first account's phone number as the chat you
create.

There's also a **Try demo with mock data** button on the login screen for
exploring the UI without a live instance (e.g. while GREEN-API is down) —
see `src/api/mockGreenApi.ts`.

## How it's built

- Plain React + TypeScript, no UI framework or router — the brief asked for
  the smallest reasonable interface, not a feature-complete client.
- `src/api/greenApi.ts` is the only place that talks to GREEN-API
  (`getSettings`, `checkWhatsapp`, `sendMessage`, `receiveNotification`,
  `deleteNotification`).
- `src/hooks/useChatSession.ts` owns the chat/message state, the
  receive-notification long-poll loop, and localStorage persistence
  (scoped per `idInstance`, so switching accounts doesn't mix chat
  histories).
- All state lives in `localStorage` on the client — there's no backend.
  GREEN-API is called directly from the browser.

## Notes / assumptions

- GREEN-API's request host is normally instance-specific
  (`https://{cluster}.api.green-api.com`), but the generic
  `https://api.green-api.com` host (used as the default here) transparently
  routes to the right cluster. An **Advanced settings** field on the login
  screen lets you override the API URL if your instance needs a specific
  host.
- The interface is a simplified two-pane chat layout (chat list +
  conversation), covering only the one flow the assignment asks for: start
  a chat by phone number, send/receive text only.

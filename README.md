# FollowUp

**Dad remembers the thing. FollowUp remembers what he needs to do about it.**

A privacy-first memory assistant for information buried in WhatsApp exports, notes, documents and screenshots.

## Modes

- **Private** — parsing, retrieval and Gemma inference happen in the browser. Imported data is stored in IndexedDB on the user's device.
- **Assisted** — optional Backboard-powered RAG for selected documents. Use only when you explicitly want to send data to the hosted service.

## Local run

Requirements: Node.js 20.9+ (Node 22 recommended), npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The first Private AI load downloads a quantized Gemma 3 270M browser model from Hugging Face and caches it locally. WebGPU is recommended.

## Render

Create a Render Web Service connected to this repo.

Build command: `npm install && npm run build`
Start command: `npm start`

Add `BACKBOARD_API_KEY` only if Assisted Mode is enabled. Keep it server-side.

# FollowUp — exact setup path

## 0. What you need
- Node.js 22.x recommended.
- A GitHub account if you want Render deployment.
- No API key for Private Mode.
- Optional: Backboard account/API key for Assisted Mode.

## 1. Put the project on your PC
Extract `FollowUp-Hacktoberfest-2026.zip`.
Open PowerShell in that folder.

```powershell
node -v
npm -v
npm install
npm run dev
```

Open `http://localhost:3000`.

If `npm install` fails, copy the full terminal error (not secrets) into ChatGPT.

## 2. First demo test — do NOT use Dad's data yet
Click `Load demo Dad data`.
Try:
- When is the society payment due?
- Who sent me the AC offer?
- Where did I get the quotation?
- What am I forgetting?

The first AI model load is large because Gemma runs in the browser. Keep the tab open while it downloads. Later loads should use the browser/model cache.

## 3. Why the demo exists
It proves the full flow before personal data is involved. The sample memories are synthetic. Do not claim they are Dad's actual messages in the article.

## 4. Get Dad's WhatsApp export
Android: open the relevant WhatsApp chat/group → menu → More → Export chat → Without media.

iPhone: open the chat → contact/group info → Export Chat → Without Media.

The exact labels can vary by WhatsApp version.

Start with ONE small chat export, not the entire history. Import the resulting `.txt` file into FollowUp.

## 5. What Private Mode means
Imported memories are stored in the browser's IndexedDB. Embeddings and Gemma inference run client-side. No Backboard key is needed.

Important: browser-local does not mean magically encrypted from the operating system/browser. Do not use a shared/public computer for sensitive family data.

## 6. Backboard Assisted Mode (optional)
Only do this if you want the partner integration/demo.

1. Create/log into a Backboard account.
2. Open Dashboard → Settings → API Keys.
3. Create a new API key and copy it. Backboard says the key is only shown once.
4. In the project folder create `.env.local`.
5. Add:

```env
BACKBOARD_API_KEY=your_key_here
```

Do NOT prefix it with `NEXT_PUBLIC_`.
Do NOT paste it into GitHub.
Do NOT paste the key into ChatGPT.

Restart `npm run dev` after changing `.env.local`.

The app's Assisted Mode sends only the selected/retrieved memory context for a question to the server route, not your entire browser database. The server holds the API key.

## 7. Render
Push the project to GitHub.

On Render:
- New → Web Service
- Connect the GitHub repository
- Runtime: Node
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Plan: Free for the initial demo
- Environment variables: add `BACKBOARD_API_KEY` only if using Assisted Mode

Do not put Dad's personal data in the deployed demo. Use the synthetic demo dataset for judging.

## 8. Real handoff to Dad
After the public demo works:
1. Use Private Mode on Dad's device if possible.
2. Import a small real export first.
3. Test the 3-4 questions he actually asks.
4. Fix retrieval/category misses before importing more.
5. Let Dad try it without explaining the answer first.
6. Record what he says/does honestly.

For the article, only report a reaction after this actual handoff.

## 9. What to send ChatGPT if something breaks
Send:
- the exact command you ran
- the exact error text
- your Node version (`node -v`)
- the filename involved, if shown

Never send:
- API keys
- WhatsApp exports
- private messages
- passwords
- `.env.local`

If the error contains a secret, replace the secret with `[REDACTED]` before sending it.

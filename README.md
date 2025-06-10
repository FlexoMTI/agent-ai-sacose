# Agent AI pentru Sacoșe – Backend complet

## 🔧 Tehnologii
- Node.js + Express
- OpenAI GPT-3.5 API
- SQLite pentru stocare mesaje
- Salvare pe clientId + curățare automată (24h)

## ▶️ Start local
1. `npm install`
2. Adaugă în `.env` cheia:
   ```
   OPENAI_API_KEY=cheia_ta
   ```
3. `npm start`

## 🚀 Deploy pe Render
- Tip: Web Service
- Start Command: `npm start`
- Adaugă `OPENAI_API_KEY` în Environment

## Endpoint-uri
- `POST /chat` → `{ clientId, message }`
- `GET /history?clientId=...`
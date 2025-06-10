import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { initDB, saveMessage, getHistory, cleanupOldMessages } from "./database.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initDB();

// RUTĂ POST pentru mesaj nou
app.post("/chat", async (req, res) => {
  const { message, clientId } = req.body;

  if (!message || !clientId) {
    return res.status(400).json({ error: "Lipsă mesaj sau clientId" });
  }

  await cleanupOldMessages();

  await saveMessage(clientId, "user", message);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: await getHistory(clientId)
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ error: "Răspuns invalid AI" });
    }

    await saveMessage(clientId, "assistant", reply);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare OpenAI sau server" });
  }
});

// RUTĂ GET pentru istoric
app.get("/history", async (req, res) => {
  const clientId = req.query.clientId;
  if (!clientId) return res.status(400).json({ error: "Fără clientId" });
  const history = await getHistory(clientId);
  res.json(history);
});

app.listen(PORT, () => {
  console.log(`Server ascultă pe portul ${PORT}`);
});
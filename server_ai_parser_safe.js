import express from "express";More actions
import cors from "cors";
import fetch from "node-fetch";
import {
  getBasePrice,
  getHandleAdjustment,
  getPrintAdjustment,
  getBoxCount,
  getTransportCost,
  getMatritaCost
} from "./oferte.js";

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message, clientId } = req.body;
  if (!message || !clientId) return res.status(400).json({ error: "Lipsă mesaj sau clientId" });

  try {
    const extractPrompt = `
Extrage din următorul mesaj datele despre ofertă pentru sacoșe:

Mesaj: "${message}"

Returnează un obiect JSON cu câmpurile:
{
  "dimensiune": "...",
  "material": "...",
  "tiraj": număr,
  "maner": "...",
  "imprimare": "...",
  "culori": număr
}
Dacă nu găsești un câmp, setează-l cu null.
`;

    const extractRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
  model: "gpt-3.5-turbo",
  response_format: "json",  // 👈 Asta activează JSON mode
  messages: [
    {
      role: "system",
      content: "Răspunzi DOAR cu un obiect JSON. Fără text explicativ."
    },
    {
      role: "user",
      content: `
        model: "gpt-3.5-turbo-1106", // sau gpt-4-1106-preview
        response_format: "json",
        messages: [
          {
            role: "system",
            content: "Răspunzi DOAR cu un obiect JSON valid. Fără explicații."
          },
          {
            role: "user",
            content: `
Extrage câmpurile despre ofertă din textul de mai jos. Returnează obiect JSON cu:
{
  "dimensiune": "...",
@@ -69,21 +52,26 @@

Textul este: """${message}"""
`
    }
  ],
  temperature: 0.2
          }
        ],
        temperature: 0.2
      })
    });

    const extractData = await extractRes.json();
    const jsonText = extractData.choices?.[0]?.message?.content;

    if (!extractData.choices || !extractData.choices[0]?.message?.content) {
      console.error("⚠️ Eroare în răspunsul OpenAI:", extractData);
      return res.json({ reply: "AI-ul nu a reușit să răspundă. Poți reformula cererea?" });
    }

    let extracted;
    try {
      extracted = JSON.parse(jsonText);}
    catch (err) {
      console.error("❌ GPT a returnat un JSON invalid:", jsonText);
      extracted = JSON.parse(extractData.choices[0].message.content);
    } catch (err) {
      console.error("❌ GPT a returnat un JSON invalid:", extractData.choices[0].message.content);
      return res.json({
        reply: "Nu am putut înțelege complet cererea. Poți reformula, menționând clar dimensiunea, tirajul și materialul?"
        reply: "Nu am putut înțelege complet cererea. Poți reformula cu detalii clare?"
      });
    }

@@ -124,7 +112,7 @@

    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error("Eroare generală:", err);
    console.error("❌ Eroare generală:", err);Add commentMore actions
    res.status(500).json({ error: "Eroare server sau GPT" });
  }
});

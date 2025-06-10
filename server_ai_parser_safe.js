import express from "express";
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
        messages: [{ role: "user", content: extractPrompt }],
        temperature: 0.2
      })
    });

    const extractData = await extractRes.json();
    const jsonText = extractData.choices?.[0]?.message?.content;

    let extracted;
    try {
      extracted = JSON.parse(jsonText);
    } catch (err) {
      console.error("❌ GPT a returnat un JSON invalid:", jsonText);
      return res.json({
        reply: "Nu am putut înțelege complet cererea. Poți reformula, menționând clar dimensiunea, tirajul și materialul?"
      });
    }

    if (!extracted.dimensiune || !extracted.material || !extracted.tiraj) {
      return res.json({
        reply: "Te rog reformulează cererea – lipsesc date precum dimensiune, material sau tiraj."
      });
    }

    const pretBaza = getBasePrice(extracted.dimensiune, extracted.material, extracted.tiraj);
    if (!pretBaza) {
      return res.json({ reply: "Dimensiunea sau tirajul solicitat nu sunt disponibile." });
    }

    const adaosManer = getHandleAdjustment(extracted.maner || "plat");
    const adaosPrint = getPrintAdjustment(extracted.imprimare || "mic");
    const costMatrita = getMatritaCost(extracted.dimensiune, extracted.culori || 0);
    const bucPerCutie = getBoxCount(extracted.dimensiune) || 1000;
    const nrCutii = Math.ceil(extracted.tiraj / bucPerCutie);
    const nrPaleti = Math.floor(nrCutii / 40);
    const costTransport = getTransportCost(nrCutii, nrPaleti);

    const pretTotalBuc = pretBaza + adaosManer + adaosPrint;
    const costTotal = pretTotalBuc * extracted.tiraj + costMatrita + costTransport;

    const reply = `
📦 Ofertă estimativă:
• Dimensiune: ${extracted.dimensiune}
• Material: ${extracted.material}
• Tiraj: ${extracted.tiraj} buc
• Mâner: ${extracted.maner || "plat"}, Imprimare: ${extracted.imprimare || "mică"}, ${extracted.culori || 0} culori

💰 Preț unitar: ${pretTotalBuc.toFixed(3)} lei
🧾 Cost total (cu matrițe și transport): ${costTotal.toFixed(2)} lei

*Ofertă estimativă valabilă 30 zile.
    `;

    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error("Eroare generală:", err);
    res.status(500).json({ error: "Eroare server sau GPT" });
  }
});

app.listen(PORT, () => {
  console.log("✅ Serverul rulează pe portul " + PORT);
});

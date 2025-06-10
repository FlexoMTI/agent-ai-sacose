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

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message, clientId, dimensiune, material, tiraj, maner, imprimare, culori } = req.body;

  if (!message || !clientId) {
    return res.status(400).json({ error: "Lipsă mesaj sau clientId" });
  }

  try {
    const pretBaza = getBasePrice(dimensiune, material, tiraj);
    if (!pretBaza) {
      return res.status(400).json({ error: "Dimensiune sau tiraj invalid" });
    }

    const adaosManer = getHandleAdjustment(maner || "plat");
    const adaosPrint = getPrintAdjustment(imprimare || "mic");
    const costMatrita = getMatritaCost(dimensiune, culori || 0);
    const bucPerCutie = getBoxCount(dimensiune) || 1000;
    const nrCutii = Math.ceil(tiraj / bucPerCutie);
    const nrPaleti = Math.floor(nrCutii / 40);
    const costTransport = getTransportCost(nrCutii, nrPaleti);

    const pretTotalBuc = pretBaza + adaosManer + adaosPrint;
    const costTotal = pretTotalBuc * tiraj + costMatrita + costTransport;

    const reply = `
📦 Ofertă estimativă:
• Dimensiune: ${dimensiune}
• Material: ${material}
• Tiraj: ${tiraj} buc
• Mâner: ${maner || "plat"}, Imprimare: ${imprimare || "mică"}, ${culori || 0} culori

💰 Preț unitar: ${pretTotalBuc.toFixed(3)} lei
🧾 Cost total (cu matrițe și transport): ${costTotal.toFixed(2)} lei

*Ofertă estimativă valabilă 30 zile.
    `;

    res.json({ reply: reply.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Eroare server" });
  }
});

app.listen(PORT, () => {
  console.log(`Serverul rulează pe portul ${PORT}`);
});
import xlsx from "xlsx";
const workbook = xlsx.readFile("./oferta_ai_sacose_REFORMAT_GL+GLOSAR.xlsx");

const preturi = xlsx.utils.sheet_to_json(workbook.Sheets["Preturi Baza"]);
const ajustariManer = xlsx.utils.sheet_to_json(workbook.Sheets["Ajustari Maner"]);
const ajustariImprimare = xlsx.utils.sheet_to_json(workbook.Sheets["Ajustari Imprimare"]);
const ambalare = xlsx.utils.sheet_to_json(workbook.Sheets["Ambalare"]);
const matrite = xlsx.utils.sheet_to_json(workbook.Sheets["Matrite"]);
const transport = xlsx.utils.sheet_to_json(workbook.Sheets["Transport"]);

function getBasePrice(dimensiune, material, tiraj) {
  const row = preturi.find(r => r.Dimensiune === dimensiune && r.Material.toLowerCase() === material.toLowerCase());
  if (!row) return null;
  if (tiraj >= 50000) return row["minim 50000"];
  if (tiraj >= 20000) return row["minim 20000"];
  if (tiraj >= 10000) return row["minim 10000"];
  if (tiraj >= 5000)  return row["minim 5000"];
  return null;
}

function getHandleAdjustment(tipManer) {
  const row = ajustariManer.find(r => r.Maner.toLowerCase() === tipManer.toLowerCase());
  return row ? row["Adaos LEI/buc"] : 0;
}

function getPrintAdjustment(tipPrint) {
  const row = ajustariImprimare.find(r => r.Imprimare.toLowerCase() === tipPrint.toLowerCase());
  return row ? row["Adaos LEI/buc"] : 0;
}

function getBoxCount(dimensiune) {
  const row = ambalare.find(r => r.Dimensiune === dimensiune);
  return row ? row["Buc/Cutie"] : null;
}

function getTransportCost(cutii, paleti) {
  const row = transport[0];
  return (cutii * row["LEI/cutie"]) + (paleti * row["LEI/palet"]);
}

function getMatritaCost(dimensiune, culori) {
  const row = matrite.find(r => r.Dimensiune === dimensiune);
  return row ? (row["LEI/culoare"] * culori) : 0;
}

export {
  getBasePrice,
  getHandleAdjustment,
  getPrintAdjustment,
  getBoxCount,
  getTransportCost,
  getMatritaCost
};
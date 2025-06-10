import sqlite3 from "sqlite3";
import { open } from "sqlite";

let db;

export async function initDB() {
  db = await open({
    filename: "./messages.db",
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId TEXT,
      role TEXT,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function saveMessage(clientId, role, content) {
  await db.run(
    "INSERT INTO messages (clientId, role, content) VALUES (?, ?, ?)",
    [clientId, role, content]
  );
}

export async function getHistory(clientId) {
  const rows = await db.all(
    "SELECT role, content FROM messages WHERE clientId = ? ORDER BY timestamp ASC",
    [clientId]
  );
  return rows;
}

export async function cleanupOldMessages() {
  await db.run("DELETE FROM messages WHERE timestamp <= datetime('now', '-1 day')");
}

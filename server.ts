import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("finance.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'income' or 'expense'
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    date TEXT NOT NULL,
    note TEXT,
    is_bazaar INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/transactions", (req, res) => {
    try {
      const transactions = db.prepare("SELECT * FROM transactions ORDER BY date DESC, id DESC").all();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", (req, res) => {
    const { type, amount, category, subcategory, date, note, is_bazaar } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO transactions (type, amount, category, subcategory, date, note, is_bazaar)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(type, amount, category, subcategory, date, note, is_bazaar ? 1 : 0);
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      res.status(500).json({ error: "Failed to add transaction" });
    }
  });

  app.post("/api/transactions/bulk", (req, res) => {
    const transactions = req.body; // Array of transactions
    const insert = db.prepare(`
      INSERT INTO transactions (type, amount, category, subcategory, date, note, is_bazaar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insert.run(item.type, item.amount, item.category, item.subcategory, item.date, item.note, item.is_bazaar ? 1 : 0);
      }
    });

    try {
      insertMany(transactions);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add transactions" });
    }
  });

  app.delete("/api/transactions/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

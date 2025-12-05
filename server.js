// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

// Autoriser toutes les origines pour l’instant
app.use(cors());
app.use(express.json());

// Petit stockage en mémoire pour commencer
// On branchera une vraie base plus tard
// Exemple: { "2025-12-12": "unavailable" }
let availability = {};

// Healthcheck simple
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Récupérer toutes les dates
app.get("/api/availability", (req, res) => {
  const items = Object.entries(availability).map(([date, status]) => ({
    date,
    status,
  }));
  res.json(items);
});

// Récupérer le statut d’une seule date
app.get("/api/availability/:date", (req, res) => {
  const date = req.params.date;
  const status = availability[date] || "available";
  res.json({ date, status });
});

// Mettre à jour une date
app.put("/api/availability", (req, res) => {
  const { date, status } = req.body;

  if (!date || !status) {
    return res.status(400).json({ error: "date and status are required" });
  }

  const allowed = ["available", "unavailable", "pending"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "invalid status" });
  }

  availability[date] = status;

  res.json({ date, status });
});

app.listen(PORT, () => {
  console.log(`Studio calendar API running on http://localhost:${PORT}`);
});

const express = require("express");
const cors = require("cors");
const path = require("path"); // Nécessaire pour gérer les chemins de fichiers

const app = express();
const PORT = process.env.PORT || 4000;

// Autoriser les requêtes cross-origin
app.use(cors());
app.use(express.json());

// --- CORRECTION 1 : Gestion du dossier Public (Respect de la majuscule) ---
// On utilise path.join pour être sûr que le chemin est correct sur tous les OS
app.use(express.static(path.join(__dirname, "Public"))); 

// Stockage en mémoire (Disparaît si le serveur redémarre sur Render)
// Format : { "2025-12-12": "unavailable", "2025-12-13": "pending" }
let availability = {};

// Healthcheck
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// --- CORRECTION 2 : Route pour récupérer TOUTES les disponibilités ---
// C'est celle-ci qui manquait pour que loadAvailability() fonctionne
app.get("/api/availability", (req, res) => {
  // On transforme l'objet en tableau pour le frontend
  // Ex: [{ date: "2025-12-12", status: "unavailable" }, ...]
  const list = Object.keys(availability).map((date) => ({
    date,
    status: availability[date],
  }));
  res.json(list);
});

// Récupérer le statut d’une seule date (Optionnel, mais on le garde)
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

  // Mise à jour de la mémoire
  availability[date] = status;

  console.log(`Mise à jour : ${date} -> ${status}`); // Log pour débugger
  res.json({ date, status });
});

// Route par défaut pour renvoyer vers l'admin si on tape juste l'URL racine
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Public", "admin.html"));
});

app.listen(PORT, () => {
  console.log(`Studio calendar API running on port ${PORT}`);
});

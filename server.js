const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config(); 

const app = express();
const PORT = process.env.PORT || 4000;

// --- 1. CONNEXION MONGODB ---
// Le code va chercher la variable "MONGO_URI" configurée dans Render
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  // Ceci s'affichera si tu as oublié de configurer Render
  console.error("ERREUR CRITIQUE: La variable d'environnement MONGO_URI est manquante !");
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("Connecté à MongoDB avec succès"))
    .catch(err => console.error("Erreur connexion MongoDB:", err));
}

// --- 2. SCHÉMA DE DONNÉES ---
const availabilitySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, 
  status: { type: String, required: true }              
});

const Availability = mongoose.model("Availability", availabilitySchema);

// --- 3. CONFIGURATION SERVEUR ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "Public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// --- 4. ROUTES API ---

app.get("/api/availability", async (req, res) => {
  try {
    const items = await Availability.find({}, 'date status -_id');
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/availability/:date", async (req, res) => {
  try {
    const date = req.params.date;
    const found = await Availability.findOne({ date });
    const status = found ? found.status : "available";
    res.json({ date, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.put("/api/availability", async (req, res) => {
  const { date, status } = req.body;

  if (!date || !status) {
    return res.status(400).json({ error: "date and status are required" });
  }

  const allowed = ["available", "unavailable", "pending"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "invalid status" });
  }

  try {
    await Availability.findOneAndUpdate(
      { date: date },
      { status: status },
      { upsert: true, new: true }
    );
    console.log(`Sauvegardé : ${date} -> ${status}`);
    res.json({ date, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de sauvegarder" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Public", "admin.html"));
});

app.listen(PORT, () => {
  console.log(`Studio calendar API running on port ${PORT}`);
});

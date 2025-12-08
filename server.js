const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const basicAuth = require("express-basic-auth"); // Nouvelle librairie
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// --- 1. VARIABLES D'ENVIRONNEMENT ---
const MONGO_URI = process.env.MONGO_URI;
// On définit un user/pass par défaut si jamais tu oublies de les mettre dans Render
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "supersecret";

// Connexion MongoDB
if (!MONGO_URI) {
  console.error("ERREUR: MONGO_URI manquant !");
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("Connecté à MongoDB"))
    .catch(err => console.error("Erreur MongoDB:", err));
}

// Schéma
const availabilitySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  status: { type: String, required: true }
});
const Availability = mongoose.model("Availability", availabilitySchema);

app.use(cors());
app.use(express.json());

// --- 2. SÉCURITÉ (MIDDLEWARE) ---
// On configure la sécurité
const authMiddleware = basicAuth({
    users: { [ADMIN_USER]: ADMIN_PASS }, // Le nom et le mot de passe
    challenge: true // Fait apparaitre la pop-up du navigateur
});

// IMPORTANT : On intercepte la demande pour admin.html AVANT que le dossier public ne soit servi
app.use("/admin.html", authMiddleware);

// On sert le dossier public (tout le reste est accessible sans mot de passe)
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => { res.json({ status: "ok" }); });

// --- 3. ROUTES API ---

// Lecture (Publique : tout le monde peut voir le calendrier)
app.get("/api/availability", async (req, res) => {
  try {
    const items = await Availability.find({}, 'date status -_id');
    res.json(items);
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

app.get("/api/availability/:date", async (req, res) => {
  try {
    const found = await Availability.findOne({ date: req.params.date });
    res.json({ date: req.params.date, status: found ? found.status : "available" });
  } catch (err) { res.status(500).json({ error: "Erreur serveur" }); }
});

// Écriture (PROTÉGÉE : Il faut le mot de passe pour modifier)
// On ajoute 'authMiddleware' comme 2ème argument
app.put("/api/availability", authMiddleware, async (req, res) => {
  const { date, status } = req.body;
  if (!date || !status) return res.status(400).json({ error: "Missing data" });
  
  const allowed = ["available", "unavailable", "pending"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

  try {
    await Availability.findOneAndUpdate(
      { date }, { status }, { upsert: true, new: true }
    );
    res.json({ date, status });
  } catch (err) { res.status(500).json({ error: "Save failed" }); }
});

// Route par défaut (affiche l'embed public)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "embed.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

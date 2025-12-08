// public/admin.js

// On utilise un chemin relatif pour que ça marche en local et sur Render
const API_URL = "/api/availability";

// Map interne "YYYY-MM-DD" -> "available" | "unavailable" | "pending"
let statusByDate = {};

// Mode actuel (cycle ou pinceau)
let currentMode = "cycle"; // "cycle" | "available" | "unavailable" | "pending"

// Mois de base (le premier affiché)
let currentBaseDate = new Date();
currentBaseDate.setDate(1);

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const WEEKDAYS_FR = ["DI", "LU", "MA", "ME", "JE", "VE", "SA"];

function pad(n) {
  return n.toString().padStart(2, "0");
}

function toKey(date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

// Charger les dispos depuis l API
async function loadAvailability() {
  try {
    const res = await fetch(API_URL);
    const items = await res.json(); // [{ date, status }, ...]

    statusByDate = {};
    for (const item of items) {
      statusByDate[item.date] = item.status;
    }

    renderCalendar();
  } catch (err) {
    console.error("Erreur de chargement des disponibilités", err);
    renderCalendar(); // on affiche quand même le calendrier, tout en available
  }
}

// Sauvegarder une date dans l API
async function saveAvailability(date, status) {
  try {
    const res = await fetch(API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date, status }),
    });

    if (!res.ok) {
      console.error("Erreur API", await res.text());
    }
  } catch (err) {
    console.error("Erreur réseau", err);
  }
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const label = document.getElementById("currentRange");
  if (!grid || !label) return;

  grid.innerHTML = "";

  const m1 = new Date(currentBaseDate);
  const m2 = new Date(currentBaseDate.getFullYear(), currentBaseDate.getMonth() + 1, 1);

  label.textContent =
    `${MONTHS_FR[m1.getMonth()]} ${m1.getFullYear()} / ` +
    `${MONTHS_FR[m2.getMonth()]} ${m2.getFullYear()}`;

  grid.appendChild(buildMonthCard(m1));
  grid.appendChild(buildMonthCard(m2));
}

function buildMonthCard(monthDate) {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();

  const container = document.createElement("section");
  container.className = "month-card";

  const header = document.createElement("div");
  header.className = "month-header";
  header.textContent = `${MONTHS_FR[monthIndex]} ${year}`;
  container.appendChild(header);

  const weekdaysRow = document.createElement("div");
  weekdaysRow.className = "weekdays";
  WEEKDAYS_FR.forEach((label) => {
    const span = document.createElement("div");
    span.textContent = label;
    weekdaysRow.appendChild(span);
  });
  container.appendChild(weekdaysRow);

  const daysGrid = document.createElement("div");
  daysGrid.className = "days";

  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const startIndex = firstDayOfMonth.getDay(); // 0 dimanche

  // Padding avant le 1
  for (let i = 0; i < startIndex; i++) {
    const empty = document.createElement("div");
    empty.className = "day empty";
    daysGrid.appendChild(empty);
  }

  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const todayKey = toKey(new Date());

  for (let d = 1; d <= lastDay; d++) {
    const dateObj = new Date(year, monthIndex, d);
    const key = toKey(dateObj);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";
    cell.textContent = d.toString();
    cell.dataset.date = key;

    const status = statusByDate[key] || "available";
    cell.classList.add(status);
    cell.dataset.status = status;

    if (key === todayKey) {
      cell.classList.add("today");
    }

    // Clic simple pour cycle ou pinceau
    cell.addEventListener("mousedown", () => onDayInteract(key, cell));

    // Drag pour peindre quand un pinceau est sélectionné
    cell.addEventListener("mouseover", (event) => {
      if (event.buttons === 1 && currentMode !== "cycle") {
        onDayInteract(key, cell, true);
      }
    });

    daysGrid.appendChild(cell);
  }

  container.appendChild(daysGrid);
  return container;
}

function onDayInteract(key, cell, isDrag = false) {
  let current = statusByDate[key] || "available";
  let next = current;

  if (currentMode === "cycle") {
    if (isDrag) return; // on ne cycle pas en drag
    next =
      current === "available"
        ? "unavailable"
        : current === "unavailable"
        ? "pending"
        : "available";
  } else if (currentMode === "available") {
    next = "available";
  } else if (currentMode === "unavailable") {
    next = "unavailable";
  } else if (currentMode === "pending") {
    next = "pending";
  }

  statusByDate[key] = next;
  cell.dataset.status = next;

  cell.classList.remove("available", "unavailable", "pending");
  cell.classList.add(next);

  saveAvailability(key, next);
}

function setupNav() {
  const prev = document.getElementById("prevMonth");
  const next = document.getElementById("nextMonth");

  if (prev) {
    prev.addEventListener("click", () => {
      currentBaseDate.setMonth(currentBaseDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      currentBaseDate.setMonth(currentBaseDate.getMonth() + 1);
      renderCalendar();
    });
  }
}

function setupModeButtons() {
  const modeCycleBtn = document.getElementById("modeCycle");
  const modeAvailableBtn = document.getElementById("modeAvailable");
  const modeUnavailableBtn = document.getElementById("modeUnavailable");
  const modePendingBtn = document.getElementById("modePending");

  const all = [modeCycleBtn, modeAvailableBtn, modeUnavailableBtn, modePendingBtn];

  function activate(btn, mode) {
    currentMode = mode;
    all.forEach((b) => b && b.classList.remove("active"));
    if (btn) btn.classList.add("active");
  }

  if (modeCycleBtn) {
    modeCycleBtn.addEventListener("click", () => activate(modeCycleBtn, "cycle"));
  }
  if (modeAvailableBtn) {
    modeAvailableBtn.addEventListener("click", () =>
      activate(modeAvailableBtn, "available")
    );
  }
  if (modeUnavailableBtn) {
    modeUnavailableBtn.addEventListener("click", () =>
      activate(modeUnavailableBtn, "unavailable")
    );
  }
  if (modePendingBtn) {
    modePendingBtn.addEventListener("click", () =>
      activate(modePendingBtn, "pending")
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupModeButtons();
  loadAvailability();
});

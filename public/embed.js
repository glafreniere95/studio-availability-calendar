// public/embed.js

const API_URL = "/api/availability"; 

// Map interne "YYYY-MM-DD" -> "available" | "unavailable" | "pending"
let statusByDate = {};

// On part à partir du mois courant
let currentBaseDate = new Date(); // toujours au 1er du mois en pratique
currentBaseDate.setDate(1);

// Utilitaires de date

function pad(n) {
  return n.toString().padStart(2, "0");
}

function toKey(date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

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

// Chargement des données

async function loadAvailability() {
  try {
    const res = await fetch(API_URL);
    const items = await res.json();

    statusByDate = {};
    for (const item of items) {
      statusByDate[item.date] = item.status;
    }

    renderCalendar();
  } catch (err) {
    console.error("Erreur de chargement des disponibilités", err);
  }
}

// Construction du calendrier

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const rangeLabel = document.getElementById("currentRange");
  if (!grid || !rangeLabel) return;

  grid.innerHTML = "";

  const firstMonth = new Date(
    currentBaseDate.getFullYear(),
    currentBaseDate.getMonth(),
    1
  );
  const secondMonth = new Date(
    currentBaseDate.getFullYear(),
    currentBaseDate.getMonth() + 1,
    1
  );

  const months = [firstMonth, secondMonth];

  // Label de plage (par exemple "Décembre 2025 – Janvier 2026")
  const label =
    MONTHS_FR[firstMonth.getMonth()] +
    " " +
    firstMonth.getFullYear() +
    "  /  " +
    MONTHS_FR[secondMonth.getMonth()] +
    " " +
    secondMonth.getFullYear();
  rangeLabel.textContent = label;

  for (const monthDate of months) {
    const card = buildMonthCard(monthDate);
    grid.appendChild(card);
  }
}

function buildMonthCard(monthDate) {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth(); // 0 à 11

  const monthCard = document.createElement("section");
  monthCard.className = "month-card";

  const header = document.createElement("div");
  header.className = "month-header";
  header.textContent = `${MONTHS_FR[monthIndex]} ${year}`;
  monthCard.appendChild(header);

  // Ligne des jours de semaine
  const weekdaysRow = document.createElement("div");
  weekdaysRow.className = "weekdays";
  WEEKDAYS_FR.forEach((label) => {
    const span = document.createElement("div");
    span.className = "weekday";
    span.textContent = label;
    weekdaysRow.appendChild(span);
  });
  monthCard.appendChild(weekdaysRow);

  // Grille des jours
  const daysGrid = document.createElement("div");
  daysGrid.className = "days";

  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const dayOfWeek = firstDayOfMonth.getDay(); // 0 dimanche, 6 samedi

  // Padding avant le 1er
  for (let i = 0; i < dayOfWeek; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day empty";
    daysGrid.appendChild(emptyCell);
  }

  // Nombre de jours dans le mois
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const todayKey = toKey(new Date());

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, monthIndex, day);
    const key = toKey(date);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";

    // Etat de disponibilité
    const status = statusByDate[key] || "available";
    cell.classList.add(status);

    if (key === todayKey) {
      cell.classList.add("today");
    }

    cell.textContent = day.toString();

    // Pas de clic en embed, c'est une vue lecture seule
    cell.disabled = true;

    daysGrid.appendChild(cell);
  }

  monthCard.appendChild(daysGrid);
  return monthCard;
}

// Navigation mois précédent / suivant

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

// Init

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  loadAvailability();
});

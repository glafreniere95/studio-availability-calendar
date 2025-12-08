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
  const monthIndex = monthDate.getMonth(); 

  const monthCard = document.createElement("section");
  monthCard.className = "month-card";

  const header = document.createElement("div");
  header.className = "month-header";
  header.textContent = `${MONTHS_FR[monthIndex]} ${year}`;
  monthCard.appendChild(header);

  const weekdaysRow = document.createElement("div");
  weekdaysRow.className = "weekdays";
  WEEKDAYS_FR.forEach((label) => {
    const span = document.createElement("div");
    span.className = "weekday";
    span.textContent = label;
    weekdaysRow.appendChild(span);
  });
  monthCard.appendChild(weekdaysRow);

  const daysGrid = document.createElement("div");
  daysGrid.className = "days";

  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const dayOfWeek = firstDayOfMonth.getDay(); 

  for (let i = 0; i < dayOfWeek; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day empty";
    daysGrid.appendChild(emptyCell);
  }

  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const todayKey = toKey(new Date());
  
  // --- NOUVEAU : Date référence ---
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let day = 1; day <= lastDay; day++) {
    const dateObj = new Date(year, monthIndex, day);
    const key = toKey(dateObj);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";
    cell.textContent = day.toString();
    cell.disabled = true; // Toujours désactivé en embed

    // --- NOUVEAU : Si c'est le passé ---
    if (dateObj < todayDate) {
        cell.classList.add("past");
    } else {
        // Sinon on met le statut normal
        const status = statusByDate[key] || "available";
        cell.classList.add(status);
        
        if (key === todayKey) {
            cell.classList.add("today");
        }
    }

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

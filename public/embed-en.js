// public/embed-en.js

const API_URL = "/api/availability";

let statusByDate = {};
let currentBaseDate = new Date();
currentBaseDate.setDate(1);

function pad(n) {
  return n.toString().padStart(2, "0");
}

function toKey(date) {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
}

// --- TRADUCTION ICI ---
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS_EN = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

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
    console.error("Error loading availability", err);
  }
}

function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  const rangeLabel = document.getElementById("currentRange");
  if (!grid || !rangeLabel) return;

  grid.innerHTML = "";

  const firstMonth = new Date(currentBaseDate.getFullYear(), currentBaseDate.getMonth(), 1);
  const secondMonth = new Date(currentBaseDate.getFullYear(), currentBaseDate.getMonth() + 1, 1);

  const months = [firstMonth, secondMonth];

  // Label en anglais
  const label =
    MONTHS_EN[firstMonth.getMonth()] + " " + firstMonth.getFullYear() +
    " / " +
    MONTHS_EN[secondMonth.getMonth()] + " " + secondMonth.getFullYear();
  
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
  // Mois en anglais
  header.textContent = `${MONTHS_EN[monthIndex]} ${year}`;
  monthCard.appendChild(header);

  const weekdaysRow = document.createElement("div");
  weekdaysRow.className = "weekdays";
  // Jours en anglais
  WEEKDAYS_EN.forEach((label) => {
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
  
  // Logique "Past" (jours passés)
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let day = 1; day <= lastDay; day++) {
    const dateObj = new Date(year, monthIndex, day);
    const key = toKey(dateObj);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";
    cell.textContent = day.toString();
    cell.disabled = true;

    if (dateObj < todayDate) {
        cell.classList.add("past");
    } else {
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

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  loadAvailability();
});

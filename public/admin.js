// admin.js

const API_URL =
  "https://studio-availability-calendar.onrender.com/api/availability";

let statusByDate = {};
let currentMode = "cycle"; // cycle | available | unavailable | pending
let currentBaseDate = new Date();
currentBaseDate.setDate(1);

const MONTHS_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
];

const WEEKDAYS_FR = ["DI","LU","MA","ME","JE","VE","SA"];

function pad(n){return n.toString().padStart(2,"0");}
function toKey(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}

// Load existing availability
async function loadAvailability(){
  try{
    const res = await fetch(API_URL);
    const items = await res.json();
    statusByDate = {};
    for(const item of items){
      statusByDate[item.date] = item.status;
    }
    renderCalendar();
  }catch(e){
    console.error("Erreur:", e);
  }
}

// Save new status to API
async function updateDate(key, newStatus){
  try{
    await fetch(`${API_URL}/${key}`,{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({date:key, status:newStatus})
    });
  }catch(e){
    console.error("Erreur PUT:", e);
  }
}

function renderCalendar(){
  const grid = document.getElementById("calendarGrid");
  const label = document.getElementById("currentRange");
  grid.innerHTML = "";

  const m1 = new Date(currentBaseDate);
  const m2 = new Date(currentBaseDate.getFullYear(), currentBaseDate.getMonth()+1, 1);

  label.textContent =
    `${MONTHS_FR[m1.getMonth()]} ${m1.getFullYear()} / ${MONTHS_FR[m2.getMonth()]} ${m2.getFullYear()}`;

  grid.appendChild(buildMonthCard(m1));
  grid.appendChild(buildMonthCard(m2));
}

function buildMonthCard(monthDate){
  const year = monthDate.getFullYear();
  const m = monthDate.getMonth();

  const container = document.createElement("section");
  container.className = "month-card";

  const header = document.createElement("div");
  header.className = "month-header";
  header.textContent = `${MONTHS_FR[m]} ${year}`;
  container.appendChild(header);

  const weekRow = document.createElement("div");
  weekRow.className = "weekdays";
  WEEKDAYS_FR.forEach(w=> {
    const e=document.createElement("div");
    e.textContent=w;
    weekRow.appendChild(e);
  });
  container.appendChild(weekRow);

  const days = document.createElement("div");
  days.className = "days";

  const firstDay = new Date(year,m,1);
  const startIndex = firstDay.getDay();
  for(let i=0;i<startIndex;i++){
    const empty = document.createElement("div");
    empty.className="day empty";
    days.appendChild(empty);
  }

  const lastDay = new Date(year,m+1,0).getDate();
  const todayKey = toKey(new Date());

  for(let d=1; d<=lastDay; d++){
    const dateObj = new Date(year,m,d);
    const key = toKey(dateObj);

    const cell = document.createElement("button");
    cell.className = "day";
    cell.textContent = d;

    const state = statusByDate[key] || "available";
    cell.classList.add(state);

    if(key===todayKey) cell.classList.add("today");

    cell.addEventListener("mousedown", ()=> onDayClick(key, cell));
    cell.addEventListener("mouseover", (e)=>{
      if(e.buttons===1 && currentMode!=="cycle"){
        onDayClick(key, cell, true);
      }
    });

    days.appendChild(cell);
  }

  container.appendChild(days);
  return container;
}

function onDayClick(key, cell, isDrag = false){
  let current = statusByDate[key] || "available";
  let next = current;

  if(currentMode==="cycle"){
    next = current==="available" ? "unavailable"
         : current==="unavailable" ? "pending"
         : "available";
  }

  if(currentMode==="available") next = "available";
  if(currentMode==="unavailable") next = "unavailable";
  if(currentMode==="pending") next = "pending";

  statusByDate[key] = next;

  cell.classList.remove("available","unavailable","pending");
  cell.classList.add(next);

  updateDate(key,next);
}

function setupNav(){
  document.getElementById("prevMonth").onclick = ()=>{
    currentBaseDate.setMonth(currentBaseDate.getMonth()-1);
    renderCalendar();
  };
  document.getElementById("nextMonth").onclick = ()=>{
    currentBaseDate.setMonth(currentBaseDate.getMonth()+1);
    renderCalendar();
  };
}

function setupModes(){
  const buttons = {
    cycle: document.getElementById("modeCycle"),
    available: document.getElementById("modeAvailable"),
    unavailable: document.getElementById("modeUnavailable"),
    pending: document.getElementById("modePending"),
  };

  Object.entries(buttons).forEach(([mode,btn])=>{
    btn.addEventListener("click", ()=>{
      currentMode = mode;
      Object.values(buttons).forEach(b=> b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  setupNav();
  setupModes();
  loadAvailability();
});

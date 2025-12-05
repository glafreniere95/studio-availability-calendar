const API = "https://studio-availability-calendar.onrender.com/api/availability";

fetch(API)
  .then(r => r.json())
  .then(data => {
    const div = document.getElementById("calendar");
    div.innerHTML = "<pre>" + JSON.stringify(data, null, 2) + "</pre>";
  });

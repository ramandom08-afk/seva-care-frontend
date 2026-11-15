const API_BASE = "/api";
let db = {
  patients: [],
  doctors: [],
  hospitals: [],
  organs: [],
  blood: [],
  appointments: [],
};
let activeTab = "patients";
let indiaMap = null;

const tabConfig = {
  patients: {
    title: "Patient Records & Unique Credentials",
    subtitle:
      "Manage patient login usernames, passwords, blood groups & assigned doctors",
    fields: [
      { key: "id", label: "Patient ID (e.g. P-103)" },
      { key: "username", label: "Username (Unique ID)" },
      { key: "password", label: "Password" },
      { key: "name", label: "Patient Name" },
      { key: "age", label: "Age / Gender" },
      { key: "blood", label: "Blood Group" },
      { key: "diagnosis", label: "Diagnosis" },
      { key: "doctor", label: "Assigned Doctor" },
      { key: "status", label: "Status (Admitted / Recovering)" },
    ],
  },
  doctors: {
    title: "Specialist Doctors & OPD Schedules",
    subtitle:
      "View doctor qualifications, experience, available timings & clinic facilities",
    fields: [
      { key: "id", label: "Doctor ID (e.g. D-203)" },
      { key: "name", label: "Doctor Name" },
      { key: "degree", label: "Degree / Qualification (e.g. MBBS, MD)" },
      { key: "spec", label: "Specialization" },
      { key: "exp", label: "Experience" },
      { key: "timing", label: "Available Timing" },
      { key: "facilities", label: "Facilities / Clinic Setup" },
      { key: "contact", label: "Contact Number" },
      { key: "status", label: "Status (Available / In Surgery)" },
    ],
  },
  hospitals: {
    title: "All India Nearest Hospitals & Facilities",
    subtitle:
      "Search hospitals by city, ICU availability, bed capacity & verified map locations",
    fields: [
      { key: "id", label: "Hospital ID (e.g. H-904)" },
      { key: "name", label: "Hospital Name" },
      { key: "location", label: "City / State (e.g. Pune, Maharashtra)" },
      { key: "facilities", label: "Facilities (ICU, Trauma, MRI)" },
      { key: "beds", label: "Total Beds" },
      { key: "contact", label: "Contact Helpline" },
      { key: "status", label: "Status (Open 24/7)" },
      { key: "lat", label: "Latitude (e.g. 18.5204)" },
      { key: "lng", label: "Longitude (e.g. 73.8567)" },
    ],
  },
  blood: {
    title: "Blood Bank & Active Donors",
    subtitle:
      "Check live blood unit availability and contact verified blood donors",
    fields: [
      { key: "id", label: "Donor ID (e.g. BLD-403)" },
      { key: "name", label: "Donor Name" },
      { key: "group", label: "Blood Group" },
      { key: "units", label: "Units Available" },
      { key: "date", label: "Donation Date" },
      { key: "contact", label: "Contact Number" },
      { key: "status", label: "Status (Available / Low Stock)" },
    ],
  },
  organs: {
    title: "Organ Donation Registry",
    subtitle: "Verified organ donor pledges and city-wise organ availability",
    fields: [
      { key: "id", label: "Registry ID (e.g. ORG-303)" },
      { key: "name", label: "Donor Name" },
      { key: "age", label: "Age" },
      { key: "blood", label: "Blood Group" },
      { key: "organ", label: "Pledged Organ(s)" },
      { key: "city", label: "City" },
      { key: "status", label: "Status (Verified / Pending)" },
    ],
  },
  appointments: {
    title: "Doctor OPD Appointments",
    subtitle:
      "Book and track confirmed patient consultations with specialist doctors",
    fields: [
      { key: "id", label: "Appointment ID (e.g. APT-502)" },
      { key: "patient", label: "Patient Name" },
      { key: "doctor", label: "Doctor Name" },
      { key: "date", label: "Appointment Date (YYYY-MM-DD)" },
      { key: "time", label: "Time Slot (e.g. 11:00 AM)" },
      { key: "status", label: "Status (Confirmed / Pending)" },
    ],
  },
};

const triageData = {
  fever: {
    title: "ACUTE FEVER / VECTOR-BORNE SCREENING",
    desc: "Visit Primary Health Centre (PHC) for free Rapid Malaria & Dengue NS1 testing. Stay hydrated with ORS.",
    doctor: "Dr. Ananya Deshmukh (General Physician)",
  },
  chest: {
    title: "CARDIAC TRIAGE & BLOOD PRESSURE CHECK",
    desc: "Immediate ECG screening recommended. Emergency ambulance coordination active with nearest district hospital.",
    doctor: "Dr. Rajesh Verma (General Medicine)",
  },
  pregnancy: {
    title: "MATERNAL CARE & ANC CHECKUP",
    desc: "Free ultrasound screening and iron/folic acid distribution available at community health outpost.",
    doctor: "Dr. Sneha Kulkarni (Gynecology)",
  },
  child: {
    title: "PEDIATRIC ILLNESS & VACCINATION",
    desc: "Routine immunization tracking and ORS distribution for infant dehydration care.",
    doctor: "Dr. Rajesh Verma (Pediatrics)",
  },
  injury: {
    title: "TRAUMA & FARM ACCIDENT FIRST AID",
    desc: "Emergency tetanus shot and fracture immobilization kit ready at taluka health center.",
    doctor: "Dr. Sneha Kulkarni (Orthopedics)",
  },
  video: {
    title: "TELEHEALTH REMOTE VIDEO CONSULTATION",
    desc: "Connect securely with certified district specialists via live video link within 5 minutes.",
    doctor: "All Available Specialists",
  },
};

function selectSymptom(key) {
  const data = triageData[key];
  if (!data) return;
  document.getElementById("triageTitle").innerText = data.title;
  document.getElementById("triageDesc").innerText = data.desc;
  document.querySelector(".triage-action button").innerText =
    `Book ${data.doctor} →`;
}

async function fetchRecords() {
  try {
    const res = await fetch(`${API_BASE}/all`);
    db = await res.json();
    document.getElementById("count-patients").innerText = (
      db.patients || []
    ).length;
    document.getElementById("count-doctors").innerText = (
      db.doctors || []
    ).length;
    document.getElementById("count-hospitals").innerText = (
      db.hospitals || []
    ).length;
    document.getElementById("count-blood").innerText = (db.blood || []).length;
    renderCards();
    if (activeTab === "hospitals") {
      initIndiaMap();
    }
  } catch (err) {
    console.error("Failed to fetch records:", err);
  }
}

function getStatusBadge(status = "") {
  const s = status.toLowerCase();
  if (
    s.includes("avail") ||
    s.includes("verif") ||
    s.includes("recover") ||
    s.includes("confirm") ||
    s.includes("open") ||
    s.includes("discharg")
  )
    return "bg-ok";
  if (s.includes("low") || s.includes("admit")) return "bg-alert";
  return "bg-warn";
}

function switchTab(tabName) {
  document.querySelectorAll(".nav-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  activeTab = tabName === "overview" ? "patients" : tabName;

  const mapSec = document.getElementById("mapViewSection");
  if (activeTab === "hospitals") {
    if (mapSec) mapSec.style.display = "block";
    setTimeout(() => initIndiaMap(), 200);
  } else {
    if (mapSec) mapSec.style.display = "none";
  }

  renderCards(document.getElementById("searchBox").value);
  document
    .querySelector(".records-section")
    .scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function initIndiaMap() {
  const mapContainer = document.getElementById("indiaHospitalMap");
  if (!mapContainer) return;

  if (indiaMap) {
    indiaMap.remove();
    indiaMap = null;
  }

  // Centered on India
  indiaMap = L.map("indiaHospitalMap").setView([20.5937, 78.9629], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap contributors | Seva Care Verified Network",
  }).addTo(indiaMap);

  const hospitals = db.hospitals || [];
  hospitals.forEach((h) => {
    const lat = parseFloat(h.lat) || 18 + Math.random() * 5;
    const lng = parseFloat(h.lng) || 73 + Math.random() * 5;

    L.marker([lat, lng])
      .addTo(indiaMap)
      .bindPopup(
        `<b>${h.name}</b><br>${h.location || ""}<br><b>Beds:</b> ${h.beds || "N/A"}<br><b>Facilities:</b> ${h.facilities || "ICU Available"}<br><span style="color:green;font-weight:bold;">✔ Verified Location</span>`,
      );
  });
}

function renderCards(query = "") {
  const config = tabConfig[activeTab];
  document.getElementById("panel-title").innerText = config.title;
  document.getElementById("panel-subtitle").innerText = config.subtitle;

  const list = db[activeTab] || [];
  const filtered = list.filter((item) =>
    Object.values(item).some((v) =>
      String(v).toLowerCase().includes(query.toLowerCase()),
    ),
  );

  document.getElementById("cards-grid").innerHTML = filtered
    .map((item, index) => {
      let mapButtonHtml = "";
      if (activeTab === "hospitals") {
        const queryStr = encodeURIComponent(
          `${item.name} ${item.location || ""}`,
        );
        mapButtonHtml = `<a href="https://www.google.com/maps/search/?api=1&query=${queryStr}" target="_blank" class="btn-map">📍 View on Google Map</a>`;
      }

      return `
      <div class="profile-card">
        <div class="card-top">
          <img src="${item.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}" alt="Photo" class="avatar">
          <div>
            <span class="card-id">${item.id}</span>
            <h4>${item.name || item.patient}</h4>
          </div>
        </div>
        <div class="card-details">
          ${config.fields
            .filter(
              (f) =>
                !["id", "name", "patient", "status", "lat", "lng"].includes(
                  f.key,
                ),
            )
            .map(
              (f) =>
                `<p><strong>${f.label.split(" ")[0]}:</strong> ${item[f.key] || "-"}</p>`,
            )
            .join("")}
        </div>
        ${mapButtonHtml}
        <div class="card-footer">
          <span class="badge ${getStatusBadge(item.status)}">${item.status || "Active"}</span>
          <div class="btn-actions-group">
            <button class="btn-edit" onclick="openEditModal('${activeTab}', ${index})">Edit</button>
            <button class="btn-del" onclick="removeItem('${item.id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}

document
  .getElementById("searchBox")
  .addEventListener("input", (e) => renderCards(e.target.value));

function previewImage(e) {
  const file = e.target.files[0];
  if (file)
    document.getElementById("photoPreview").src = URL.createObjectURL(file);
}

function openModalFor(tabName) {
  switchTab(tabName);
  openModal();
}

function openModal() {
  const config = tabConfig[activeTab];
  document.getElementById("modal-heading").innerText = `New ${config.title}`;
  document.getElementById("saveBtnText").innerText = "Save Record";
  document.getElementById("editIndex").value = -1;
  document.getElementById("photoPreview").src =
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  document.getElementById("form-fields").innerHTML = config.fields
    .map(
      (f) => `
    <div class="field">
      <label>${f.label}</label>
      <input type="text" name="${f.key}" required>
    </div>
  `,
    )
    .join("");
  document.getElementById("entryModal").classList.add("open");
}

function openEditModal(tab, index) {
  activeTab = tab;
  const config = tabConfig[tab];
  const item = db[tab][index];

  document.getElementById("modal-heading").innerText = `Edit ${config.title}`;
  document.getElementById("saveBtnText").innerText = "Update Record";
  document.getElementById("editIndex").value = index;
  document.getElementById("photoPreview").src =
    item.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  document.getElementById("form-fields").innerHTML = config.fields
    .map(
      (f) => `
    <div class="field">
      <label>${f.label}</label>
      <input type="text" name="${f.key}" value="${item[f.key] || ""}" required>
    </div>
  `,
    )
    .join("");

  document.getElementById("entryModal").classList.add("open");
}

function closeModal() {
  document.getElementById("entryModal").classList.remove("open");
}

async function handleSave(e) {
  e.preventDefault();
  const formEl = document.getElementById("entryForm");
  const formData = new FormData(formEl);
  const editIdx = parseInt(document.getElementById("editIndex").value);

  if (editIdx > -1) {
    await fetch(`${API_BASE}/${activeTab}/${editIdx}`, {
      method: "PUT",
      body: formData,
    });
  } else {
    await fetch(`${API_BASE}/${activeTab}`, {
      method: "POST",
      body: formData,
    });
  }

  closeModal();
  fetchRecords();
}

async function removeItem(id) {
  await fetch(`${API_BASE}/${activeTab}/${id}`, { method: "DELETE" });
  fetchRecords();
}
fetchRecords();

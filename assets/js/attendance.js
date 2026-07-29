import { db,  getDoc,  doc,  addDoc,  updateDoc,  collection,  getDocs,  query,  where,  serverTimestamp, setDoc } from './database.js';
import { loader, currentUser } from "./utils/loggeduser.js";



// ---------------- ELEMENTS ----------------
const userName = document.getElementById("userName");
const markBtn = document.getElementById("markBtn");
const checkoutBtn = document.getElementById("checkout");
const brkoutBtn = document.getElementById("brkout");
const brkinBtn = document.getElementById("brkin");

const inTimeEl = document.getElementById("inTime");
const outTimeEl = document.getElementById("outTime");
const breaksContainer = document.getElementById("breaksContainer");
const branchEl = document.getElementById("branchSelect");

const depCheckinBtn = document.getElementById("depCheckinBtn");
const depCheckoutBtn = document.getElementById("depCheckoutBtn");
const depBranchSelect = document.getElementById("depBranchSelect");
const depInTimeEl = document.getElementById("depInTime");
const depOutTimeEl = document.getElementById("depOutTime");

userName.textContent = currentUser.user;
 
// ---------------- LOAD BRANCH ----------------
const branchRef = doc(db, "branches", currentUser.branchId);
const branchDoc = await getDoc(branchRef);
let branch = null;
if (branchDoc.exists()) {
  branch = branchDoc.data();
  branchEl.textContent = branch.name;
}

// ---------------- LOAD ALL BRANCHES FOR DEPUTATION ----------------
async function loadDeputationBranches() {
  const branchesSnap = await getDocs(collection(db, "branches"));
  branchesSnap.forEach(doc => {
    if (doc.id !== currentUser.branchId) {
      const b = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = b.name;
      option.dataset.lat = b.lat;
      option.dataset.lng = b.lng;
      option.dataset.radius = b.radius_m || 200;
      depBranchSelect.appendChild(option);
    }
  });
}
loadDeputationBranches();

function startLocationWatch() {
  if (!('geolocation' in navigator)) return;
  try {
    window.__geoWatchId = navigator.geolocation.watchPosition(async (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      try {
        await setDoc(doc(db, 'userLocations', currentUser.id), {
          userId: currentUser.id,
          username: currentUser.username,
          branchId: currentUser.branchId,
          location: { lat: latitude, lng: longitude, accuracy },
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch {}
    }, () => {}, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 });
  } catch {}
}

startLocationWatch();

window.addEventListener('beforeunload', () => {
  if (window.__geoWatchId) {
    try { navigator.geolocation.clearWatch(window.__geoWatchId); } catch {}
  }
});

// ---------------- UTILITY ----------------
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180) *
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------- DATE-TIME FORMAT ----------------
function formatDateTime(timestamp) {
  const d = timestamp instanceof Date ? timestamp : timestamp.toDate();
  const day = String(d.getDate()).padStart(2,'0');
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2,'0');
  const seconds = String(d.getSeconds()).padStart(2,'0');
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day} ${month} ${year} : ${String(hours).padStart(2,'0')}:${minutes}:${seconds} ${ampm}`;
}

// ---------------- LOAD TODAY ATTENDANCE ----------------
const todayStr = new Date().toISOString().slice(0,10);
const attQuery = query(collection(db, "attendance"),
  where("userId", "==", currentUser.id),
  where("dateStr", "==", todayStr)
);

let attRef = null;
let attData = null;

const attSnap = await getDocs(attQuery);
if (!attSnap.empty) {
  attRef = attSnap.docs[0].ref;
  attData = attSnap.docs[0].data();

  if (attData.isDeputation) {
    if (attData.time)
      depInTimeEl.textContent = formatDateTime(attData.time);
    if (attData.outTime)
      depOutTimeEl.textContent = formatDateTime(attData.outTime);
    
    // Set the selected branch manually if it's already in the options
    setTimeout(() => {
      depBranchSelect.value = attData.branchId;
      depBranchSelect.disabled = true;
    }, 500);
  } else {
    if (attData.time)
      inTimeEl.textContent = formatDateTime(attData.time);
    if (attData.outTime)
      outTimeEl.textContent = formatDateTime(attData.outTime);
  }

  // Initialize breaks array for backwards compatibility
  if (!attData.breaks) {
    attData.breaks = [];
    if (attData.breakOutTime) {
      attData.breaks.push({
        outTime: attData.breakOutTime,
        inTime: attData.breakInTime,
        purpose: attData.breakPurpose,
        type: attData.breakType || "Personal"
      });
    }
  }
  renderBreaks();
}

function renderBreaks() {
  breaksContainer.innerHTML = "";
  if (!attData || !attData.breaks || attData.breaks.length === 0) {
    breaksContainer.innerHTML = "<p style='text-align:center'>No breaks yet</p>";
    return;
  }
  
  attData.breaks.forEach((b, index) => {
    const breakEl = document.createElement("div");
    breakEl.style.borderBottom = "1px solid #ffcccc";
    breakEl.style.paddingBottom = "10px";
    breakEl.style.marginBottom = "10px";
    
    breakEl.innerHTML = `
      <p><strong>Break ${index + 1} (${b.type || "Personal"})</strong></p>
      <p><img src="./assets/icons/checkout 2.png"> <span>${b.outTime ? formatDateTime(b.outTime) : "-"}</span></p>
      <p><img src="./assets/icons/checkin 2.png"> <span>${b.inTime ? formatDateTime(b.inTime) : "-"}</span></p>
      <p><img src="./assets/icons/purpose.png"> <span>${b.purpose || "-"}</span></p>
    `;
    breaksContainer.appendChild(breakEl);
  });
}

// ---------------- BUTTON STATE ----------------
function updateButtonState() {
  if (!attData) {
    checkoutBtn.disabled = true;
    brkoutBtn.disabled = true;
    brkinBtn.disabled = true;
    depCheckoutBtn.disabled = true;
    return;
  }

  const hasOpenBreak = attData.breaks && attData.breaks.length > 0 && !attData.breaks[attData.breaks.length - 1].inTime;

  if (attData.isDeputation) {
    markBtn.disabled = true;
    checkoutBtn.disabled = true;
    brkoutBtn.disabled = true; 
    brkinBtn.disabled = true;
    depCheckinBtn.disabled = true;
    depCheckoutBtn.disabled = !!attData.outTime;
  } else {
    markBtn.disabled = true;
    depCheckinBtn.disabled = true;
    depCheckoutBtn.disabled = true;
    depBranchSelect.disabled = true;
    
    checkoutBtn.disabled = !!attData.outTime || hasOpenBreak;
    brkoutBtn.disabled = !!attData.outTime || hasOpenBreak;
    brkinBtn.disabled = !!attData.outTime || !hasOpenBreak;
  }
}
updateButtonState();

// ---------------- CHECK-IN ----------------
markBtn.onclick = async () => {
  loader.style.display = "flex";
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    const distance = getDistance(latitude, longitude, branch.lat, branch.lng);

    if (distance > branch.radius_m && currentUser.role !== "admin") {
      loader.style.display = "none";
      return alert("❌ You are outside the branch area!");
    }

    const existing = await getDocs(attQuery);
    if (!existing.empty) {
      loader.style.display = "none";
      return alert("⚠️ Already Checked In Today!");
    }

    const docRef = await addDoc(collection(db, "attendance"), {
      userId: currentUser.id,
      username: currentUser.username,
      branchId: currentUser.branchId,
      branchName: branch.name,
      time: serverTimestamp(),
      dateStr: todayStr,
      location: { lat: latitude, lng: longitude, distance }
    });

    attRef = docRef;
    attData = { userId: currentUser.id, time: { toDate: () => new Date() }, breaks: [] };

    inTimeEl.textContent = formatDateTime(attData.time);
    renderBreaks();
    alert("✅ Checked In Successfully!");
    updateButtonState();
    loader.style.display = "none";
  }, (error) => {
    loader.style.display = "none";
    alert("❌ Location error: " + error.message);
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
};

// ---------------- CHECK-OUT ----------------
checkoutBtn.onclick = async () => {
  if (!attRef) return alert("⚠️ You must Check In first!");
  if (attData?.outTime) return alert("✅ You already Checked Out!");

  const popup = document.getElementById("checkoutPopup");
  popup.style.display = "flex";
  const confirmBtn = document.getElementById("checkoutConfirm");
  const cancelBtn = document.getElementById("checkoutCancel");
  const closePopup = () => popup.style.display = "none";
  cancelBtn.onclick = closePopup;

  confirmBtn.onclick = async () => {
    closePopup();
    loader.style.display = "flex";

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const distance = getDistance(latitude, longitude, branch.lat, branch.lng);
      if (distance > branch.radius_m && currentUser.role !== "admin") {
        loader.style.display = "none";
        return alert("❌ Outside branch area!");
      }

      await updateDoc(attRef, { outTime: serverTimestamp() });
      attData.outTime = { toDate: () => new Date() };
      outTimeEl.textContent = formatDateTime(attData.outTime);

      alert("✅ Checked Out Successfully!");
      updateButtonState();
      loader.style.display = "none";
    }, (error) => {
      loader.style.display = "none";
      alert("❌ Location error: " + error.message);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
  };
};

// ---------------- BREAK-OUT ----------------
brkoutBtn.onclick = async () => {
  if (!attRef) return alert("⚠️ You must Check In first!");
  if (attData?.outTime) return alert("⚠️ You already Checked Out!");
  
  const hasOpenBreak = attData.breaks && attData.breaks.length > 0 && !attData.breaks[attData.breaks.length - 1].inTime;
  if (hasOpenBreak) return alert("⚠️ You are already on a break!");

  const popup = document.getElementById("breakPopup");
  popup.style.display = "flex";
  const input = document.getElementById("breakPurposeInput");
  const typeInput = document.getElementById("breakTypeInput");
  const confirmBtn = document.getElementById("breakConfirm");
  const cancelBtn = document.getElementById("breakCancel");
  
  input.value = "";
  if (typeInput) typeInput.value = "Personal";
  
  const closePopup = () => popup.style.display = "none";
  cancelBtn.onclick = closePopup;

  confirmBtn.onclick = async () => {
    const purpose = input.value.trim();
    const type = typeInput ? typeInput.value : "Personal";
    if (!purpose) return alert("Please enter a break reason!");
    closePopup();
    loader.style.display = "flex";

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const distance = getDistance(latitude, longitude, branch.lat, branch.lng);
      if (distance > branch.radius_m && currentUser.role !== "admin") {
        loader.style.display = "none";
        return alert("❌ Outside branch area!");
      }

      const newBreak = { 
        outTime: new Date(), 
        purpose: purpose,
        type: type 
      };
      
      attData.breaks.push(newBreak);

      // Keep legacy fields updated for history.js backward compatibility
      const updateData = { breaks: attData.breaks };
      if (attData.breaks.length === 1) {
        updateData.breakOutTime = serverTimestamp();
        updateData.breakPurpose = purpose;
        updateData.breakType = type;
      }

      await updateDoc(attRef, updateData);
      
      renderBreaks();
      alert("☕ Break Out Recorded!");
      updateButtonState();
      loader.style.display = "none";
    }, (error) => {
      loader.style.display = "none";
      alert("❌ Location error: " + error.message);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
  };
};

// ---------------- BREAK-IN ----------------
brkinBtn.onclick = async () => {
  if (!attRef) return alert("⚠️ Check In first!");
  if (attData?.outTime) return alert("⚠️ You already Checked Out!");
  
  const hasOpenBreak = attData.breaks && attData.breaks.length > 0 && !attData.breaks[attData.breaks.length - 1].inTime;
  if (!hasOpenBreak) return alert("⚠️ You are not currently on a break!");

  loader.style.display = "flex";
  
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    const distance = getDistance(latitude, longitude, branch.lat, branch.lng);
    if (distance > branch.radius_m && currentUser.role !== "admin") {
      loader.style.display = "none";
      return alert("❌ Outside branch area!");
    }

    const lastBreak = attData.breaks[attData.breaks.length - 1];
    lastBreak.inTime = new Date();

    const updateData = { breaks: attData.breaks };
    // Keep legacy field updated for history.js
    if (attData.breaks.length === 1) {
      updateData.breakInTime = serverTimestamp();
    }

    await updateDoc(attRef, updateData);
    
    renderBreaks();
    alert("✅ Break In Done!");
    updateButtonState();
    loader.style.display = "none";
  }, (error) => {
    loader.style.display = "none";
    alert("❌ Location error: " + error.message);
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
};


// ---------------- DEPUTATION CHECK-IN ----------------
depCheckinBtn.onclick = async () => {
  const selectedOption = depBranchSelect.options[depBranchSelect.selectedIndex];
  if (!selectedOption || !selectedOption.value) {
    return alert("⚠️ Please select a branch for deputation!");
  }

  loader.style.display = "flex";
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    const depBranchLat = parseFloat(selectedOption.dataset.lat);
    const depBranchLng = parseFloat(selectedOption.dataset.lng);
    const depBranchRadius = parseFloat(selectedOption.dataset.radius);
    const distance = getDistance(latitude, longitude, depBranchLat, depBranchLng);

    if (distance > depBranchRadius && currentUser.role !== "admin") {
      loader.style.display = "none";
      return alert("❌ You are outside the selected branch area!");
    }

    const existing = await getDocs(attQuery);
    if (!existing.empty) {
      loader.style.display = "none";
      return alert("⚠️ Already Checked In Today!");
    }

    const docRef = await addDoc(collection(db, "attendance"), {
      userId: currentUser.id,
      username: currentUser.username,
      branchId: selectedOption.value,
      branchName: selectedOption.text,
      isDeputation: true,
      time: serverTimestamp(),
      dateStr: todayStr,
      location: { lat: latitude, lng: longitude, distance }
    });

    attRef = docRef;
    attData = { 
      userId: currentUser.id, 
      time: { toDate: () => new Date() }, 
      breaks: [], 
      isDeputation: true, 
      branchId: selectedOption.value 
    };

    depInTimeEl.textContent = formatDateTime(attData.time);
    depBranchSelect.disabled = true;
    alert("✅ Deputation Checked In Successfully!");
    updateButtonState();
    loader.style.display = "none";
  }, (error) => {
    loader.style.display = "none";
    alert("❌ Location error: " + error.message);
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
};

// ---------------- DEPUTATION CHECK-OUT ----------------
depCheckoutBtn.onclick = async () => {
  if (!attRef || !attData.isDeputation) return alert("⚠️ You must Check In for deputation first!");
  if (attData?.outTime) return alert("✅ You already Checked Out!");

  const popup = document.getElementById("checkoutPopup");
  popup.style.display = "flex";
  const confirmBtn = document.getElementById("checkoutConfirm");
  const cancelBtn = document.getElementById("checkoutCancel");
  const closePopup = () => popup.style.display = "none";
  cancelBtn.onclick = closePopup;

  confirmBtn.onclick = async () => {
    closePopup();
    loader.style.display = "flex";

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const selectedOption = depBranchSelect.options[depBranchSelect.selectedIndex] || Array.from(depBranchSelect.options).find(opt => opt.value === attData.branchId);
      
      let inArea = true;
      if (selectedOption) {
        const depBranchLat = parseFloat(selectedOption.dataset.lat);
        const depBranchLng = parseFloat(selectedOption.dataset.lng);
        const depBranchRadius = parseFloat(selectedOption.dataset.radius);
        const distance = getDistance(latitude, longitude, depBranchLat, depBranchLng);
        if (distance > depBranchRadius && currentUser.role !== "admin") {
          inArea = false;
        }
      }

      if (!inArea) {
        loader.style.display = "none";
        return alert("❌ Outside deputation branch area!");
      }

      await updateDoc(attRef, { outTime: serverTimestamp() });
      attData.outTime = { toDate: () => new Date() };
      depOutTimeEl.textContent = formatDateTime(attData.outTime);

      alert("✅ Deputation Checked Out Successfully!");
      updateButtonState();
      loader.style.display = "none";
    }, (error) => {
      loader.style.display = "none";
      alert("❌ Location error: " + error.message);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 });
  };
};


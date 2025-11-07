import { db,  getDoc,  doc,  addDoc,  updateDoc,  collection,  getDocs,  query,  where,  serverTimestamp } from './database.js';
import { loader, currentUser } from "./utils/loggeduser.js";



// ---------------- ELEMENTS ----------------
const userName = document.getElementById("userName");
const markBtn = document.getElementById("markBtn");
const checkoutBtn = document.getElementById("checkout");
const brkoutBtn = document.getElementById("brkout");
const brkinBtn = document.getElementById("brkin");

const inTimeEl = document.getElementById("inTime");
const outTimeEl = document.getElementById("outTime");
const breakOutTimeEl = document.getElementById("breakOutTime");
const breakInTimeEl = document.getElementById("breakInTime");
const breakPurposeEl = document.getElementById("breakPurpose");
const branchEl = document.getElementById("branchSelect");

userName.textContent = currentUser.user;
 
// ---------------- LOAD BRANCH ----------------
const branchRef = doc(db, "branches", currentUser.branchId);
const branchDoc = await getDoc(branchRef);
let branch = null;
if (branchDoc.exists()) {
  branch = branchDoc.data();
  branchEl.textContent = branch.name;
}

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

  if (attData.time)
    inTimeEl.textContent = formatDateTime(attData.time);
  if (attData.outTime)
    outTimeEl.textContent = formatDateTime(attData.outTime);
  if (attData.breakOutTime)
    breakOutTimeEl.textContent = formatDateTime(attData.breakOutTime);
  if (attData.breakInTime)
    breakInTimeEl.textContent = formatDateTime(attData.breakInTime);
  if (attData.breakPurpose)
    breakPurposeEl.textContent = attData.breakPurpose;
}

// ---------------- BUTTON STATE ----------------
function updateButtonState() {
  if (!attData) {
    checkoutBtn.disabled = true;
    brkoutBtn.disabled = true;
    brkinBtn.disabled = true;
    return;
  }

  checkoutBtn.disabled = !!attData.outTime;
  brkoutBtn.disabled = !!attData.breakOutTime || !!attData.outTime;
  brkinBtn.disabled = !attData.breakOutTime || !!attData.breakInTime || !!attData.outTime;
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
    attData = { userId: currentUser.id, time: { toDate: () => new Date() } };

    inTimeEl.textContent = formatDateTime(attData.time);
    alert("✅ Checked In Successfully!");
    updateButtonState();
    loader.style.display = "none";
  });
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
    });
  };
};

// ---------------- BREAK-OUT ----------------
brkoutBtn.onclick = async () => {
  if (!attRef) return alert("⚠️ You must Check In first!");
  if (attData?.breakOutTime) return alert("⚠️ You already took a break!");

  const popup = document.getElementById("breakPopup");
  popup.style.display = "flex";
  const input = document.getElementById("breakPurposeInput");
  const confirmBtn = document.getElementById("breakConfirm");
  const cancelBtn = document.getElementById("breakCancel");
  input.value = "";
  const closePopup = () => popup.style.display = "none";
  cancelBtn.onclick = closePopup;

  confirmBtn.onclick = async () => {
    const purpose = input.value.trim();
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

      await updateDoc(attRef, { breakOutTime: serverTimestamp(), breakPurpose: purpose });
      attData.breakOutTime = { toDate: () => new Date() };
      attData.breakPurpose = purpose;

      breakOutTimeEl.textContent = formatDateTime(attData.breakOutTime);
      breakPurposeEl.textContent = purpose;
      alert("☕ Break Out Recorded!");
      updateButtonState();
      loader.style.display = "none";
    });
  };
};

// ---------------- BREAK-IN ----------------
brkinBtn.onclick = async () => {
  if (!attRef) return alert("⚠️ Check In first!");
  if (!attData?.breakOutTime) return alert("⚠️ You haven't done Break Out!");
  if (attData?.breakInTime) return alert("✅ Already Break In done!");

  await updateDoc(attRef, { breakInTime: serverTimestamp() });
  attData.breakInTime = { toDate: () => new Date() };
  breakInTimeEl.textContent = formatDateTime(attData.breakInTime);

  alert("✅ Break In Done!");
  updateButtonState();
};


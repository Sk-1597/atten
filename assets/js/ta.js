import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp, writeBatch, limit } from "./database.js";
import { loader, currentUser } from "./utils/loggeduser.js";

// --- DOM references ---
const modeSelect = document.getElementById('mode');
const busSection = document.getElementById('busSection');
const selfSection = document.getElementById('selfSection');
const totalDisplay = document.getElementById('totalDisplay');
const totalKm = document.getElementById('totalKm');
const busFare = document.getElementById('busFare');
const taFileBody = document.getElementById('taFileBody');
const fileTotalEl = document.getElementById('fileTotal');
const submitFileBtn = document.getElementById('submitFileBtn');
const popupAdrecord = document.getElementById("popupAdrecord");

let currentEntries = [];
let totalAmount = 0;

// ---------------- DATE-TIME FORMAT ----------------
function formatDate(timestamp) {
  const d = timestamp instanceof Date ? timestamp : timestamp.toDate();
  const day = String(d.getDate()).padStart(2,'0');
  const monthNames = ["01","02","03","04","05","06","07","08","09","10","11","12"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

// --- Mode selection ---
modeSelect.addEventListener('change', () => {
  busSection.style.display = modeSelect.value === 'bus' ? 'block' : 'none';
  selfSection.style.display = modeSelect.value === 'self' ? 'block' : 'none';
  totalDisplay.textContent = 'Total: ₹0.00';
});

// --- Amount calculation ---
totalKm.addEventListener('input', () => {
  const km = parseFloat(totalKm.value) || 0;
  totalAmount = km * 3.25;
  totalDisplay.textContent = `Total: ₹${totalAmount.toFixed(2)}`;
});

busFare.addEventListener('input', () => {
  totalAmount = parseFloat(busFare.value) || 0;
  totalDisplay.textContent = `Total: ₹${totalAmount.toFixed(2)}`;
});

// --- Add Entry (save to Firebase current_ta) ---
document.getElementById('taForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const purpose = document.getElementById('Purpose').value.trim();
  const to = document.getElementById('toPlace').value.trim();
  const mode = modeSelect.value;
  const km = parseFloat(totalKm.value) || 0;
  const fare = parseFloat(busFare.value) || 0;

  if (!mode) return alert("Select travel mode!");
  if (!purpose || !to) return alert("Enter both From and To places!");

  const entry = {
    purpose,
    to,
    mode,
    km,
    fare,
    total: totalAmount,
    createdAt: serverTimestamp(),
    userId: currentUser.id,
      branchId: currentUser.branchId,
  };

  await addDoc(collection(db, 'current_ta'), entry);

  e.target.reset();
  busSection.style.display = 'none';
  selfSection.style.display = 'none';
  totalDisplay.textContent = 'Total: ₹0.00';
  popupAdrecord.style.display = "none";
  alert('record saved');
});

// --- Load Current Entries (realtime) ---
function loadCurrentTA() {
  const q = query(
   collection(db, 'current_ta'),
  where('userId', '==', currentUser.id)
);

  onSnapshot(q, (snapshot) => {
    currentEntries = [];
    taFileBody.innerHTML = '';
    let sum = 0;

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      currentEntries.push({ id: docSnap.id, ...d });
      sum += d.total || 0;

      taFileBody.innerHTML += `
        <tr>
          <td>${formatDate(d.createdAt)}</td>
          <td>${d.to}</td>
          <td>${d.purpose}</td>
          <td>${d.mode}</td>
          <td>₹${(d.total || 0).toFixed(2)}</td>
        </tr>`;
    });

    fileTotalEl.textContent = `₹${sum.toFixed(2)}`;
    submitFileBtn.style.display = currentEntries.length > 0 ? 'block' : 'none';
  });
}

// --- Generate Next TA Number ---
async function getNextTANumber() {
  const q = query(collection(db, 'ta_files'), orderBy('createdAt', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return 'TA-0001';

  const last = snapshot.docs[0].data().taNumber;
  const num = parseInt(last.split('-')[1]) + 1;
  return `TA-${String(num).padStart(4, '0')}`;
}

// --- Submit TA File ---
submitFileBtn.addEventListener('click', async () => {
  if (!currentEntries.length) return alert('No entries to submit.');
  if (!confirm('Submit this TA file for approval?')) return;

  const taNumber = await getNextTANumber();
  const total = currentEntries.reduce((sum, e) => sum + e.total, 0);
  const fileData = {
    taNumber,
    entries: currentEntries.map(e => ({
      from: e.purpose, to: e.to, mode: e.mode, km: e.km, fare: e.fare, total: e.total
    })),
    totalAmount: total,
    status: 'pending',
    createdAt: serverTimestamp(),
    userId: currentUser.id,          // ✅ save current user id
    branchId: currentUser.branchId   // ✅ save branch
  };

  await addDoc(collection(db, 'ta_files'), fileData);

  // delete all from current_ta of that user only
  const batch = writeBatch(db);
  currentEntries.forEach(e => batch.delete(doc(db, 'current_ta', e.id)));
  await batch.commit();

  alert(`TA File ${taNumber} submitted for approval.`);

  taFileBody.innerHTML = '';
  fileTotalEl.textContent = '₹0.00';
  submitFileBtn.style.display = 'none';
});

// --- Load Previous Files ---
function loadPreviousFiles() {
  const q = query(
    collection(db, 'ta_files'),
    where('userId', '==', currentUser.id)
  );

  const body = document.getElementById('approvedBody');
  onSnapshot(q, (snapshot) => {
    body.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      const date = d.createdAt?.seconds
        ? new Date(d.createdAt.seconds * 1000).toLocaleDateString()
        : new Date().toLocaleDateString();
      body.innerHTML += `
        <tr>
          <td>${d.taNumber || '-'}</td>
          <td>${date}</td>
          <td>${(d.totalAmount || 0).toFixed(2)}</td>
          <td class="${d.status === 'approved' ? 'approved' : 'pending'}">${d.status || '-'}</td>
        </tr>`;
    });
  });
}

loadCurrentTA();
loadPreviousFiles()


import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from './database.js';
import { currentUser } from "./utils/loggeduser.js";
import { formatDate } from "./utils/formatdate.js";

formatDate();

let currentSection = "fd";
let editId = null;
let allData = []; // 🔹 store all loaded data for filtering

// 🔹 Common DOM Elements
const tableOut = document.getElementById("tab-section-Out");
const sectionSelect = document.getElementById("sectionSelect");
const addBtn = document.getElementById("addRecordBtn");
const inputSearch = document.getElementById("searchInput"); // 🔹 Add a search input in your HTML

// 🔹 Popup References
const popups = {
  fd: document.getElementById("popupDeposits"),
  rd: document.getElementById("popupRd"),
  chitty: document.getElementById("popupChitty")
};

// 🔹 Open popup based on selected section
addBtn.addEventListener("click", () => {
  Object.values(popups).forEach(p => p.classList.remove("active"));
  const popup = popups[currentSection];
  if (popup) popup.classList.add("active");
});

// 🔹 Close popup buttons
document.querySelectorAll(".cancel-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    Object.values(popups).forEach(p => p.classList.remove("active"));
  });
});

// 🔹 Section Change Handler
sectionSelect.addEventListener("change", e => {
  currentSection = e.target.value;
  loadSectionTable(currentSection);
});

// 🔹 Search Handler
if (inputSearch) {
  inputSearch.addEventListener("input", applyFilters);
}

// 🔹 Initial load
loadSectionTable(currentSection);

// 🔹 Load specific section table
async function loadSectionTable(sectionId) {
  tableOut.innerHTML = "<p style='text-align:center;color:#999;'>Loading...</p>";

  const sectionNames = {
    fd: "Deposit Record",
    rd: "R D Record",
    chitty: "Chitty Record"
  };

  const collectionRef = collection(db, sectionId + "_accounts");
  const q = query(collectionRef, where("userId", "==", currentUser.id));
  const snapshot = await getDocs(q);

  allData = []; // reset before loading
  if (snapshot.empty) {
    tableOut.innerHTML = `
      <div class="section-block">
        <h3>${sectionNames[sectionId]}</h3>
        <p style="text-align:center;color:#999;">No records found.</p>
      </div>`;
    return;
  }

  snapshot.forEach(docSnap => {
    const data = { id: docSnap.id, ...docSnap.data() };
    allData.push(data);
  });

  renderTable(allData, sectionId);
}

// 🔹 Render Table (Reusable)
function renderTable(data, sectionId) {
  let totalAmt = 0;
  let rows = "";

  data.forEach(d => {
    totalAmt += Number(d.amount || 0);

    const number = d.number || "-";
    const amount = Number(d.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const actionBtn = `<button class="action-btn" onclick="showActionMenu('${sectionId}','${d.id}')">🗑️</button>`;

    if (sectionId === "fd") {
      rows += `
        <tr>
          <td style="text-transform:uppercase;">${d.type || "-"}</td>
          <td>${number}</td>
          <td>${formatDate(d.end)}</td>
          <td>${amount}</td>
          <td>${actionBtn}</td>
        </tr>`;
    } else if (sectionId === "rd") {
      rows += `
        <tr>
          <td>${number}</td>
          <td>${formatDate(d.end)}</td>
          <td>${amount}</td>
          <td>${actionBtn}</td>
        </tr>`;
    } else if (sectionId === "chitty") {
      rows += `
        <tr>
          <td>${number}</td>
          <td>${d.end || "-"}</td>
          <td>${amount}</td>
          <td>${actionBtn}</td>
        </tr>`;
    }
  });

  let headers = "";
  if (sectionId === "fd") {
    headers = "<th>Type</th><th>Number</th><th>Maturity Date</th><th>Amount</th><th>Action</th>";
  } else if (sectionId === "rd") {
    headers = "<th>Number</th><th>Maturity Date</th><th>Amount</th><th>Action</th>";
  } else {
    headers = "<th>Number</th><th>Duration</th><th>Amount</th><th>Action</th>";
  }

  tableOut.innerHTML = `
    <div class="section-block">
      <h3>${sectionId.toUpperCase()} Record</h3>
      <div class="table-scroll">
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <table>
        <tfoot>
          <tr>
            <td colspan="${sectionId === 'fd' ? 3 : 2}">Total</td>
            <td colspan="2">₹${totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

// 🔹 Apply Filter (Search)
function applyFilters() {
  const searchValue = inputSearch.value.trim().toLowerCase();

  const filteredData = allData.filter(a => {
    const number = a.number ? a.number.toLowerCase() : "";
    return number.includes(searchValue);
  });

  renderTable(filteredData, currentSection);  
}

// 🔹 Delete Action Only
window.showActionMenu = async (section, id) => {
  const confirmDelete = confirm("Are you sure you want to delete this record?");
  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, section + "_accounts", id));
    alert("✅ Record deleted successfully!");
    loadSectionTable(currentSection);
  } catch (error) {
    console.error("Error deleting record:", error);
    alert("❌ Failed to delete record. Try again.");
  }
};

// 🔹 Save Record
async function saveRecord(section) {
  const popup = popups[section];
  const form = popup.querySelector("form");

  const type = form.querySelector('[name="type"]').value.trim();
  const number = form.querySelector('[name="number"]').value.trim();
  const end = form.querySelector('[name="end"]').value;
  const amount = form.querySelector('[name="amount"]').value.trim();
  const by = form.querySelector('[name="By"]').value.trim();
  const startdt = form.querySelector('[name="startDt"]').value;

  if (!number || !amount || !end || !type || !by || !startdt) {
    alert("Please fill all required fields!");
    return;
  }

  const data = {
    by,
    type,
    number,
    startdt,
    end,
    amount: parseFloat(amount),
    userId: currentUser.id,
    createdAt: serverTimestamp()
  };

  await addDoc(collection(db, section + "_accounts"), data);
  alert("Record saved successfully!");

  form.reset();
  popup.classList.remove("active");
  loadSectionTable(currentSection);
}

// 🔹 Bind Save Buttons
document.querySelectorAll(".save-btn").forEach(btn => {
  btn.addEventListener("click", e => {
    const section = e.target.getAttribute("data-section");
    saveRecord(section);
  });
});


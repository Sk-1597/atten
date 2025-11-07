/*  
  // 🧾 Submit Leave Request
  document.getElementById('leaveForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    const leaveDuration = document.getElementById('leaveDuration').value;
    const reason = document.getElementById('reason').value;

    if (!fromDate || !toDate || !reason || !leaveDuration ) {
      alert("Please fill all fields");
      return;
    }

    await addDoc(collection(db, "leaveRequests"), {
      userId,
      fromDate,
      toDate,
      reason,
      leaveType:"",
      leaveDuration,
      status: "Pending",
      createdAt: new Date().toISOString()
    });

    msg.textContent = "✅ Leave request submitted successfully!";
    document.getElementById('leaveForm').reset();
    setTimeout(() => msg.textContent = "", 3000);   
  });
*/

import { db, collection, query, where, getDocs } from "./database.js";
import { loader, currentUser } from "./utils/loggeduser.js";
import { formatDate } from './utils/formatdate.js';

const leaveTables = document.getElementById("leaveBody");
const year = new Date().getFullYear();
const month = new Date().getMonth() + 1;
const leaveTypes = ["Medical", "Casual", "LOP"];

// 📋 Load Approved Leaves
async function loadLeaves() {
  leaveTables.innerHTML = "";

  const stats = {
    Medical: { month: 0, year: 0 },
    Casual: { month: 0, year: 0 },
    LOP: { month: 0, year: 0 },
  };

  const allRows = [];

  for (let type of leaveTypes) {
    const q = query(
      collection(db, "leaveRequests"),
      where("userId", "==", currentUser.id),
      where("leaveType", "==", type),
      where("status", "==", "Approved")
    );

    const snap = await getDocs(q);

    snap.forEach(docSnap => {
      const d = docSnap.data();
      const from = new Date(d.fromDate);
      const to = new Date(d.toDate);

      let days = (to - from) / (1000 * 60 * 60 * 24) + 1;
      if (d.leaveDuration === "half") days = 0.5;

      // 🔹 Count monthly/yearly stats
      for (let dt = new Date(from); dt <= to; dt.setDate(dt.getDate() + 1)) {
        if (dt.getFullYear() === year) {
          stats[type].year++;
          if (dt.getMonth() + 1 === month) {
            stats[type].month++;
          }
        }
      }

      // 🔹 Add row
      allRows.push(`
        <tr>
          <td>${formatDate(from)}</td>
          <td>${formatDate(to)}</td>
          <td>${days}</td>
          <td>${type}</td>
        </tr>
      `);
    });
  }

  // ✅ Sort rows by date
  allRows.sort((a, b) => {
    const dateA = new Date(a.match(/\d{2}\/\d{2}\/\d{4}/)[0].split("/").reverse().join("-"));
    const dateB = new Date(b.match(/\d{2}\/\d{2}\/\d{4}/)[0].split("/").reverse().join("-"));
    return dateA - dateB;
  });

  // ✅ Render Table
  leaveTables.innerHTML = `
    <table class="leave-table">
      <thead>
        <tr>
          <th>From</th>
          <th>To</th>
          <th>Days</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        ${
          allRows.length
            ? allRows.join("")
            : "<tr><td colspan='4' style='text-align:center;color:#888;'>No records found</td></tr>"
        }
      </tbody>
    </table>
  `;

  // ✅ Update Summary UI
  document.getElementById("medMonth").textContent = stats.Medical.month;
  document.getElementById("medYear").textContent = stats.Medical.year;
  document.getElementById("casMonth").textContent = stats.Casual.month;
  document.getElementById("casYear").textContent = stats.Casual.year;
  document.getElementById("lopMonth").textContent = stats.LOP.month;
  document.getElementById("lopYear").textContent = stats.LOP.year;
}

// 🔹 Call the function
loadLeaves();

// 🔹 Popup close
document.getElementById("Close").addEventListener("click", () => {
  document.getElementById("popupLeave").style.display = "none";
});


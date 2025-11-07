  import { db, collection, query, where, getDocs } from './database.js';
  import { formatDate } from './utils/formatdate.js';
  import { loader, currentUser } from "./utils/loggeduser.js";

  const historyContainer = document.getElementById("attnHistoryBody");
  const sectionSelect = document.getElementById("sectionSelect");
  const searchInput = document.getElementById("searchInput");

  let allRecords = []; // store all fetched data
  let currentType = "attendance"; // current section

  // 🕓 Format time function
  function formatTimeOnly(timestamp) {
    const d = timestamp instanceof Date ? timestamp : timestamp.toDate();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  }

  // 🔹 Fetch attendance data from Firestore
  async function fetchData() {
    const attQuery = query(collection(db, "attendance"), where("userId", "==", currentUser.id));
    const attSnap = await getDocs(attQuery);
    allRecords = attSnap.docs.map(d => d.data());
  }

  // 🔹 Sort by date (Z → A)
  function sortByDateDesc(records) {
    return records.sort((a, b) => {
      const dateA = new Date(a.dateStr);
      const dateB = new Date(b.dateStr);
      return dateB - dateA; // descending order
    });
  }

  // 🔹 Render table dynamically
  function renderTable(type = "attendance", searchValue = "") {
    let filtered = [...allRecords];

    // 🔍 Search filter by date
    if (searchValue) {
      const lowerSearch = searchValue.toLowerCase();
      filtered = filtered.filter(item =>
        (item.dateStr || "").toLowerCase().includes(lowerSearch)
      );
    }

    // 🔽 Sort latest → oldest
    filtered = sortByDateDesc(filtered);

    let tableHTML = "";

    if (type === "attendance") {
      tableHTML = `
        <table>
          <thead>
            <tr> 
              <th>Date</th>
              <th>Branch</th>
              <th>Check-In</th>
              <th>Check-Out</th>
            </tr>
          </thead>
          <tbody>
      `;

      filtered.forEach(data => {
        tableHTML += `
          <tr>
            <td>${formatDate(data.dateStr)}</td>
            <td style="text-transform: capitalize;">${data.branchName || '--'}</td>
            <td>${data.time ? formatTimeOnly(data.time) : '--'}</td>
            <td>${data.outTime ? formatTimeOnly(data.outTime) : '--'}</td>
          </tr>
        `;
      });
    } else {
      tableHTML = `
        <table>
          <thead>
            <tr> 
              <th>Date</th>
              <th>Break-Out</th>
              <th>Break-In</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
      `;

      filtered.forEach(data => {
        tableHTML += `
          <tr>
            <td>${formatDate(data.dateStr)}</td>
            <td>${data.breakOutTime ? formatTimeOnly(data.breakOutTime) : '--'}</td>
            <td>${data.breakInTime ? formatTimeOnly(data.breakInTime) : '--'}</td>
            <td style="text-transform: capitalize;">${data.breakPurpose || '--'}</td>
          </tr>
        `;
      });
    }

    tableHTML += "</tbody></table>";
    historyContainer.innerHTML = tableHTML;
  }

  // 🔹 Dropdown change
  sectionSelect.addEventListener("change", (e) => {
    currentType = e.target.value;
    renderTable(currentType, searchInput.value.trim());
  });

  // 🔹 Search input
  searchInput.addEventListener("input", (e) => {
    renderTable(currentType, e.target.value.trim());
  });

  // 🔹 Initial load
  (async () => {
    await fetchData();
    renderTable("attendance");
  })();
import { db, collection, query, where, getDocs } from './database.js';
import { formatDate } from './utils/formatdate.js';
import { loader, currentUser } from "./utils/loggeduser.js";

console.log("Logged in user:", currentUser);

    formatDate();

userName.textContent = currentUser.user;
  email.textContent = currentUser.username;


const historyContainer = document.getElementById("historyContainer");

// date format function
function formatTimeOnly(timestamp) {
  const d = timestamp instanceof Date ? timestamp : timestamp.toDate();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
}

async function loadHistory() {
  const attQuery = query(collection(db, "attendance"), where("userId", "==", currentUser.id));
  const attSnap = await getDocs(attQuery);

  historyContainer.innerHTML = ''; // clear old

  attSnap.forEach(docSnap => {
    const data = docSnap.data();

    const card = document.createElement('div');
    card.className = 'card history-card';
    card.innerHTML = `
      <div class="attendance">
        <div class="card-header nameBranch"><h3>${formatDate(data.dateStr)}</h3></div>
        <div class="card-body">
          <p class="branch_nme"><img src="./assets/icons/location.png"><span>${data.branchName}</span></p>
          <p><img src="./assets/icons/checkin.png"><span>${data.time ? formatTimeOnly(data.time) : '--'}</span></p>
          <p><img src="./assets/icons/checkout.png"><span>${data.outTime ? formatTimeOnly(data.outTime) : '--'}</span></p>
        </div>
      </div>
      <div class="breake">
        <div class="card-header"><h3>Break Time</h3></div>
        <div class="card-body">
          <p><img src="./assets/icons/checkin.png"><span>${data.breakInTime ? formatTimeOnly(data.breakInTime) : '--'}</span></p>
          <p><img src="./assets/icons/checkout.png"><span>${data.breakOutTime ? formatTimeOnly(data.breakOutTime) : '--'}</span></p>
          <p><img src="./assets/icons/purpose.png"><span> ${data.breakPurpose || '--'}</span></p>
        </div>
      </div>
    `;

    historyContainer.appendChild(card);
  });
}

// initial load
loadHistory();


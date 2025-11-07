import { db, doc, getDoc, updateDoc } from './database.js';
import { formatDate } from './utils/formatdate.js';
import { currentUser } from "./utils/loggeduser.js";

// ---------------- ELEMENTS ----------------


const userName = document.getElementById("userName");
const email = document.getElementById("email");
const Mobile = document.getElementById("Mobile");
const jDate = document.getElementById("jDate");
const eCode = document.getElementById("eCode");
const address = document.getElementById("address");
const dob = document.getElementById("dob");
const designation = document.getElementById("designation");
const banknum = document.getElementById("banknum");
const details = document.getElementById("details");
const bank = document.getElementById("bank");

const dobInEl = document.getElementById("dobIn");
const mobileInEl = document.getElementById("mobileIn");
const addressInEl = document.getElementById("addressIn");
const iddetailsInEl = document.getElementById("iddetailsIn");
const bankInEl = document.getElementById("bankIn");
const banknumInEl = document.getElementById("banknumIn");
const updateDtlEl = document.getElementById("updateDtl");
const CancelDtlEl = document.getElementById("CancelDtl");
const statusBox = document.getElementById("status");
const PersonalPopup = document.getElementById("PersonalPopup");

// ---------------- Mask Function ----------------
function maskNumberDisplay(selector) {
  document.querySelectorAll(selector).forEach(el => {
    const text = el.textContent.trim();
    if (text.length > 4) {
      const masked =
        text.slice(0, -4).replace(/[0-9A-Za-z]/g, "*") + text.slice(-4);
      el.textContent = masked;
    }
  });
}

// ---------------- Display User Details ----------------
async function displayUserDetails(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return console.error("User not found in DB");

    const user = snap.data();

    // Fill UI   

    userName.textContent = user.user;
    email.textContent = user.username;
    Mobile.textContent = user.mobile;
    jDate.textContent = user.jDate ? formatDate(user.jDate) : "-";
    eCode.textContent = user.eCode || "-";
    address.textContent = user.address || "-";
    dob.textContent = user.dob ? formatDate(user.dob) : "-";
    designation.textContent = user.designation || "-";
    banknum.textContent = user.banknum || "-";
    details.textContent = user.iddetails || "-";
    bank.textContent = user.bank || "-";

    // Mask sensitive numbers
    ["#banknum", "#details", "#Mobile"].forEach(sel => maskNumberDisplay(sel));

    // Fill popup inputs
    dobInEl.value = user.dob || "";
    mobileInEl.value = user.mobile || "";
    addressInEl.value = user.address || "";
    iddetailsInEl.value = user.iddetails || "";
    bankInEl.value = user.bank || "";
    banknumInEl.value = user.banknum || "";

  } catch (error) {
    console.error("Error fetching user details:", error);
  }
}

// Initial load
displayUserDetails(currentUser.id);

// ---------------- Update Personal Details ----------------
updateDtlEl.onclick = async () => {
  const dobIn = dobInEl.value;
  const mobileIn = mobileInEl.value;
  const addressIn = addressInEl.value.trim();
  const iddetailsIn = iddetailsInEl.value;
  const bankIn = bankInEl.value.trim();
  const banknumIn = banknumInEl.value;

  if (!dobIn || !mobileIn || !addressIn || !iddetailsIn || !bankIn || !banknumIn) {
    statusBox.textContent = "⚠️ Please fill in all required fields";
    statusBox.style.color = "red";
    return;
  }

  try {
    const userDocRef = doc(db, "users", currentUser.id);

    await updateDoc(userDocRef, {
      dob: dobIn,
      mobile: mobileIn,
      address: addressIn,
      iddetails: iddetailsIn,
      bank: bankIn,
      banknum: banknumIn,
    });

    statusBox.textContent = "✅ Personal Details updated successfully!";
    statusBox.style.color = "green";

    // Refresh UI from DB
    await displayUserDetails(currentUser.id);

    // Close popup
    if (PersonalPopup) PersonalPopup.style.display = "none";

  } catch (error) {
    console.error("❌ Error updating details:", error);
    statusBox.textContent = "❌ Failed to update. Try again.";
    statusBox.style.color = "red";
  }
};

// ---------------- Cancel Button ----------------
CancelDtlEl.onclick = () => {
  if (PersonalPopup) PersonalPopup.style.display = "none";
  statusBox.textContent = "";
};

import {  db,  getDoc,  doc,  addDoc,  updateDoc,  deleteDoc,  collection,  getDocs,  query,  where,  serverTimestamp,} from "./database.js";
import { loader, currentUser } from "./utils/loggeduser.js";
import { formatDate } from './utils/formatdate.js';

// ---------------- ELEMENTS ----------------
const levTypeEl = document.getElementById("levType");
const levTimeEl = document.getElementById("levTime");
const levDateEl = document.getElementById("levDate");
const levToDateEl = document.getElementById("levToDate");
const levReasonEl = document.getElementById("levReason");

const CancelAplitn = document.getElementById("CancelAplitn");
const ConfirmLev = document.getElementById("ConfirmLev");
const leavePopup = document.getElementById("leavePopup");

// ---------------- DISPLAY ELEMENTS ----------------
const ApplyDate = document.getElementById("ApplyDate");
const leaveDate = document.getElementById("leaveDate");
const leaveStatus = document.getElementById("leaveStatus");

const alyLeav = document.getElementById("alyLeav");
const cslLeav = document.getElementById("cslLeav");

const todayStr = new Date().toISOString().slice(0, 10);
 const now = new Date();

let todayLeaveDocId = null; 

// 🔹 Load today's leave data
async function loadTodayLeave() {
  try {
    const leaveRef = query(
      collection(db, "leaveRequests"),
      where("userId", "==", currentUser.id),
    );

    const snapshot = await getDocs(leaveRef);

    if (snapshot.empty) {
      ApplyDate.textContent = "-";
      leaveDate.textContent = "-";
      leaveStatus.textContent = "-";
      todayLeaveDocId = null;
      cslLeav.style.display = "none"; // hide cancel if no leave  
      return;
    }

    // ✅ show leave data
    const docData = snapshot.docs[0].data();
    todayLeaveDocId = snapshot.docs[0].id;

    ApplyDate.textContent = formatDate(docData.createdAt) || "-";
    leaveDate.textContent = formatDate(docData.fromDate) || "-";
    leaveStatus.textContent = docData.status || "Pending";

    cslLeav.style.display = "inline-block";
  } catch (err) {
    console.error("Error loading leave:", err);
  }
}



// 🔹 Apply Leave
ConfirmLev.onclick = async () => {
  const levType = levTypeEl.value;
  const levTime = levTimeEl.value;
  const levFrom = levDateEl.value;
  const levToDate = levToDateEl.value;
  const levReason = levReasonEl.value.trim();

  if (!levType || !levFrom || !levReason) {
    alert("Please fill in all required fields!");
    return;
  }

  try {
    const leaveRef = collection(db, "leaveRequests");
    const q = query(
      leaveRef,
      where("userId", "==", currentUser.id),
      where("levDate", "==", levFrom)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      alert("You have already applied for leave on this date!");
      if (leavePopup) leavePopup.style.display = "none";
      return;
    }

    // ✅ Add new leave record
    const docRef = await addDoc(leaveRef, {    
      userId: currentUser.id,
      username: currentUser.user,
      branchId: currentUser.branchId,
      fromDate: levFrom,
      toDate: levToDate,
      reason: levReason,
      time:levTime,
      leaveType:"",
      leaveDuration: levType,
      status: "Pending",
      createdAt: new Date().toISOString()
    
    });

    console.log("✅ Leave application submitted:", docRef.id);
    alert("Leave application submitted successfully!");
    if (leavePopup) leavePopup.style.display = "none"; 
    if (alyLeav) alyLeav.style.display = "none";                   

    loadTodayLeave(); // refresh leave display

  } catch (error) {
    console.error("❌ Error submitting leave application:", error);
    alert("Failed to submit leave application. Try again.");
  }
};

// 🔹 Cancel (delete) today's leave
cslLeav.onclick = async () => {
  if (!todayLeaveDocId) {
    alert("No leave to cancel today!");
    return;
  }

  const confirmDelete = confirm("Are you sure you want to cancel today's leave?");
  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "leaveapply", todayLeaveDocId));
    alert("Leave cancelled successfully!");
    if (alyLeav) alyLeav.style.display = "flex";
    todayLeaveDocId = null;
    loadTodayLeave(); // refresh UI
  } catch (error) {
    console.error("Error cancelling leave:", error);
    alert("Failed to cancel leave. Try again.");
  }
};

// 🔹 Initial load
loadTodayLeave();


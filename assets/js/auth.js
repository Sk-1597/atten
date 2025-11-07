import { db, collection, getDocs, query, where, updateDoc, doc } from './database.js';

const statusBox = document.getElementById("status-mssg");
const email = document.getElementById("email");
const pass = document.getElementById("pass");

// 🔹 Generate or get unique device ID
const getDeviceId = () => {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = 'dev-' + Math.random().toString(36).substring(2) + Date.now();
    localStorage.setItem('deviceId', id);
  }
  return id;
};
const currentDeviceId = getDeviceId();

document.getElementById("signInBtn").onclick = async () => {
  const username = email.value.trim();
  const password = pass.value.trim();

  if (!username || !password) {
    statusBox.textContent = "Enter username and password";
    return;
  }

  // 🔹 Check if user exists
  const q = query(collection(db, 'users'), where('username', '==', username));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    statusBox.textContent = "User not found";
    return;
  }

  const docSnap = snapshot.docs[0];
  const user = docSnap.data();

  // 🔹 Password validation
  if (user.password !== password) {
    statusBox.textContent = "Incorrect password";
    return;
  }

  // 🔹 Device check
  if (!user.deviceId) {
    await updateDoc(doc(db, 'users', docSnap.id), { deviceId: currentDeviceId });
  } else if (user.deviceId !== currentDeviceId) {
    statusBox.textContent = "Account already linked to another device";
    return;
  }

  // 🔹 Minimal data only stored locally
  const minimalUserData = {
    id: docSnap.id,
    user: user.user,
    username: user.username || "", // if exists
    branchId: user.branchId || "",
    role: user.role || "",
    deviceId: user.deviceId || ""
  };

  localStorage.setItem("loggedUser", JSON.stringify(minimalUserData));

  // 🔹 Redirect
  window.location.href = "./attendance";
};

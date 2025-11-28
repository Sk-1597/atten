import { db, collection, getDocs, query, where, updateDoc, doc, serverTimestamp } from './database.js';

const statusBox = document.getElementById("status-mssg");
const email = document.getElementById("email");
const pass = document.getElementById("pass");
const enableLocationBtn = document.getElementById("enableLocationBtn");
let lastPosition = null;

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

const requestLocation = () => new Promise((resolve) => {
  if (!('geolocation' in navigator)) {
    statusBox.textContent = "Location not supported on this device";
    resolve(false);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      lastPosition = pos;
      resolve(true);
    },
    () => {
      resolve(false);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
});

const checkLocationEnabled = async () => {
  if (navigator.permissions?.query) {
    try {
      const p = await navigator.permissions.query({ name: 'geolocation' });
      if (p.state === 'granted') {
        const ok = await requestLocation();
        return ok;
      }
      return false;
    } catch {}
  }
  const ok = await requestLocation();
  return ok;
};

if (enableLocationBtn) {
  enableLocationBtn.onclick = async () => {
    statusBox.textContent = "Requesting location...";
    const ok = await requestLocation();
    if (ok) {
      statusBox.textContent = "Location enabled";
      enableLocationBtn.style.display = "none";
      if (lastPosition?.coords) {
        sessionStorage.setItem('lastLocation', JSON.stringify({
          lat: lastPosition.coords.latitude,
          lng: lastPosition.coords.longitude,
          accuracy: lastPosition.coords.accuracy
        }));
      }
    } else {
      statusBox.textContent = "Turn on device location and allow browser permission";
    }
  };
}

document.getElementById("signInBtn").onclick = async () => {
  const username = email.value.trim();
  const password = pass.value.trim();

  if (!username || !password) {
    statusBox.textContent = "Enter username and password";
    return;
  }

  const locationOk = await checkLocationEnabled();
  if (!locationOk) {
    statusBox.textContent = "Location is off. Enable location to continue";
    if (enableLocationBtn) enableLocationBtn.style.display = "block";
    return;
  }
  if (lastPosition?.coords) {
    sessionStorage.setItem('lastLocation', JSON.stringify({
      lat: lastPosition.coords.latitude,
      lng: lastPosition.coords.longitude,
      accuracy: lastPosition.coords.accuracy
    }));
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

  const storedLoc = sessionStorage.getItem('lastLocation');
  if (storedLoc) {
    try {
      const parsed = JSON.parse(storedLoc);
      await updateDoc(doc(db, 'users', docSnap.id), {
        lastLoginLocation: parsed,
        lastLoginAt: serverTimestamp()
      });
    } catch {}
  }

  // 🔹 Redirect
  window.location.href = "./attendance.html";
};

(async () => {
  const ok = await checkLocationEnabled();
  if (ok && lastPosition?.coords) {
    sessionStorage.setItem('lastLocation', JSON.stringify({
      lat: lastPosition.coords.latitude,
      lng: lastPosition.coords.longitude,
      accuracy: lastPosition.coords.accuracy
    }));
    statusBox.textContent = "Location ready";
  } else {
    if (enableLocationBtn) enableLocationBtn.style.display = "block";
  }
})();

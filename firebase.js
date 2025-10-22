// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyArh9Lqdyio6QZ276L2ciMwEgU8BgigrFs",
  authDomain: "user-atten.firebaseapp.com",
  projectId: "user-atten",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

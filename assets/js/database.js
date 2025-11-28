// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore,  getDoc,  doc,  addDoc,  updateDoc, deleteDoc,  collection,  getDocs,  query,  where, orderBy, onSnapshot,  writeBatch, limit, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
    // main db
    /*
   apiKey: "AIzaSyCOcsL9ahdFUunWDAcv5JZdnMxMZehquhg",
    authDomain: "art-staffmanage.firebaseapp.com",
    projectId: "art-staffmanage",
    storageBucket: "art-staffmanage.firebasestorage.app",
    messagingSenderId: "951269778971",
    appId: "1:951269778971:web:11fbb26385588ced133abe" 
-------------------- */

 //test db
    apiKey: "AIzaSyArh9Lqdyio6QZ276L2ciMwEgU8BgigrFs",
    authDomain: "user-atten.firebaseapp.com",
    databaseURL: "https://user-atten-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "user-atten",
    storageBucket: "user-atten.firebasestorage.app",
    messagingSenderId: "13092297593",
    appId: "1:13092297593:web:dd99a876e5dec1714fada8"
   
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db,  getDoc,  doc,  addDoc,  updateDoc, deleteDoc,  collection,  getDocs,  query,  where, orderBy, onSnapshot,  writeBatch, limit, serverTimestamp, setDoc };

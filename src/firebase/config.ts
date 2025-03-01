import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDHY0Ryc3BBKkAS2Em4Ow52MOm7A20BY6k",
  authDomain: "blue-day-dd725.firebaseapp.com",
  databaseURL: "https://blue-day-dd725-default-rtdb.firebaseio.com", // Añadir esta línea
  projectId: "blue-day-dd725",
  storageBucket: "blue-day-dd725.firebasestorage.app",
  messagingSenderId: "848696184650",
  appId: "1:848696184650:web:bfd50f2d125568418a3bb3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
const db = getDatabase(app);

export { db };
export default app;

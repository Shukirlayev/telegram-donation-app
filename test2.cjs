const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  projectId: undefined,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("DB type:", db.type, "projectId:", app.options.projectId);

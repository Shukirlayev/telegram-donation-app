const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs } = require("firebase/firestore");

async function run() {
  const firebaseConfig = {
    projectId: undefined, // Or missing
  };
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    await addDoc(collection(db, "test_col"), { dummy: true });
    console.log("Write success!");
    const snap = await getDocs(collection(db, "test_col"));
    console.log("Read success, docs:", snap.size);
  } catch (err) {
    console.log("Error:", err.message);
  }
}
run();

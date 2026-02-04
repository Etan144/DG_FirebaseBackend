const admin = require("firebase-admin");
admin.initializeApp();

const uid = "lmRFSo8upeP8E0ZSY5zTHK7U7233"; // Your admin user's UID

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("Admin claim set for user:", uid);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error setting admin claim:", err);
    process.exit(1);
  });

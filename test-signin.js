require('dotenv').config();
const MASTER_PASSWORD = "KlinikSehat_Secure_Password_123!";

fetch("http://localhost:3000/api/auth/sign-in/email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Origin": "http://localhost:3000"
  },
  body: JSON.stringify({
    email: "admin@klinik.local",
    password: MASTER_PASSWORD
  })
}).then(res => res.json()).then(console.log).catch(console.error);

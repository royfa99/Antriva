require('dotenv').config();
const MASTER_PASSWORD = "KlinikSehat_Secure_Password_123!";

async function testSession() {
  const signInRes = await fetch("http://localhost:3000/api/auth/sign-in/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "http://localhost:3000"
    },
    body: JSON.stringify({
      email: "admin@klinik.local",
      password: MASTER_PASSWORD
    })
  });
  
  const setCookieHeader = signInRes.headers.get("set-cookie");
  console.log("Set-Cookie:", setCookieHeader);

  if (setCookieHeader) {
    const sessionRes = await fetch("http://localhost:3000/api/auth/get-session", {
      headers: {
        "Cookie": setCookieHeader,
        "Origin": "http://localhost:3000"
      }
    });
    console.log("Session Res:", await sessionRes.json());
  }
}
testSession();

import { auth } from "./src/lib/auth";

async function test() {
  const res = await auth.api.signUpEmail({
    body: {
      email: "existing_admin_test@klinik.local",
      password: "password123",
      name: "Test",
      whatsapp: "test1234",
      role: "patient"
    },
    headers: new Headers()
  });
  console.log("Signup returned:", res);
}
test().catch(console.error);

export async function sendWhatsApp(target: string, message: string) {
  const token = process.env.FONNTE_TOKEN;
  
  if (!token) {
    console.log(`\n[FONNTE MOCK] To: ${target}\nMessage: ${message}\n`);
    return { status: true, detail: "Mocked successfully (Token not set)" };
  }

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target,
        message,
        delay: "1", 
      }),
    });
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Fonnte Error:", error);
    return { status: false, detail: error };
  }
}

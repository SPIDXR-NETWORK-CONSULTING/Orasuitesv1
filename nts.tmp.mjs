process.loadEnvFile(".env");
const H = { Authorization: `Bearer ${process.env.GHL_API_KEY}`, Accept: "application/json", Version: "2021-07-28", "User-Agent": "Mozilla/5.0 (Macintosh) Chrome/126" };
const r = await fetch(`https://services.leadconnectorhq.com/contacts/EIrFCYK9pHSrbL4ZqFHH/notes`, { headers: H }); console.log("notes GET", r.status, JSON.stringify(await r.json()).slice(0, 300));

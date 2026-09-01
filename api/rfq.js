/* ============================================================
   Vercel Serverless Function: /api/rfq
   Receives the RFQ form submission and forwards it to your
   inbox via Resend (free tier: 100 emails/day, no card needed).

   Required environment variables (set in Vercel dashboard):
     RESEND_API_KEY  — your Resend API key (re_xxxxxxxx)
     OWNER_EMAIL     — the inbox that receives RFQ notifications
   ============================================================ */

export default async function handler(req, res) {
  // CORS + JSON headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { RESEND_API_KEY, OWNER_EMAIL } = process.env;

  // If email forwarding is not configured, tell the front-end so it
  // falls back to opening the visitor's mail client (mailto).
  if (!RESEND_API_KEY || !OWNER_EMAIL) {
    return res.status(503).json({
      ok: false,
      error: "Email delivery is not configured. Please contact us directly.",
    });
  }

  const d = req.body || {};
  const clean = (v) => (typeof v === "string" ? v.trim().slice(0, 2000) : "");

  const name = clean(d.name);
  const email = clean(d.email);
  const product = clean(d.product) || "-";
  const quantity = clean(d.quantity) || "-";
  const country = clean(d.country) || "-";
  const details = clean(d.details);
  const page = d.page || {};

  // Server-side validation (mirror of the client checks)
  if (!name || !email || !details) {
    return res.status(400).json({ ok: false, error: "Missing required fields." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email address." });
  }

  // Build the notification email
  const lines = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Country / Port: ${country}`,
    `Product: ${product}`,
    `Quantity: ${quantity}`,
    "",
    "Requirement details:",
    details,
    "",
    "---- Landing info ----",
    `Page: ${page.landing || "-"}`,
    `Referrer: ${page.referrer || "-"}`,
    `utm_source: ${page.utm_source || "-"}`,
    `utm_medium: ${page.utm_medium || "-"}`,
    `utm_campaign: ${page.utm_campaign || "-"}`,
  ];

  const emailPayload = {
    from: "RFQ Bot <onboarding@resend.dev>", // Resend free tier default sender
    to: [OWNER_EMAIL],
    reply_to: email, // replies go straight to the buyer
    subject: `RFQ: ${product} — ${name}`,
    text: lines.join("\n"),
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Resend error:", response.status, errText);
      return res
        .status(502)
        .json({ ok: false, error: "Email provider rejected the request." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("RFQ forward failed:", err);
    return res.status(502).json({ ok: false, error: "Failed to send email." });
  }
}

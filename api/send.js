// Vercel serverless function: forwards the RFQ form to your inbox via Resend.
//
// Setup:
//   1. Sign up at resend.com, create an API Key (copy it immediately - shown only once).
//   2. In Vercel: Project -> Settings -> Environment Variables, add:
//        RESEND_API_KEY  = your key
//        RFQ_TO_EMAIL    = the inbox that should receive RFQs (e.g. sales@dazhisteel.com)
//   3. Redeploy.
// Without these variables the form will show the fallback message instead of sending.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { RESEND_API_KEY, RFQ_TO_EMAIL } = process.env;
  if (!RESEND_API_KEY || !RFQ_TO_EMAIL) {
    return res.status(500).json({ ok: false, error: 'Email service not configured' });
  }

  try {
    const d = req.body || {};
    const replyTo = typeof d.email === 'string' && d.email.includes('@') ? d.email : undefined;

    const lines = [
      `Name: ${d.name || '-'}`,
      `Company: ${d.company || '-'}`,
      `Country: ${d.country || '-'}`,
      `Email: ${d.email || '-'}`,
      `Product: ${d.product || '-'}`,
      `Spec: ${d.spec || '-'}`,
      '',
      'Message:',
      d.message || '-'
    ];

    const send = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'RFQ Form <onboarding@resend.dev>',
        to: [RFQ_TO_EMAIL],
        reply_to: replyTo,
        subject: `New RFQ from website - ${d.product || 'Corten Steel'} (${d.country || '-'})`,
        text: lines.join('\n')
      })
    });

    if (!send.ok) {
      return res.status(500).json({ ok: false, error: 'Send failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}

// ============================================================================
// Email sender. Uses Resend when RESEND_API_KEY is set; otherwise logs the
// confirmation to the server console so the demo works with zero setup.
// ============================================================================

interface EmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  sent: boolean;
  mock: boolean;
  error?: string;
}

export async function sendEmail(input: EmailInput): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "TEETOMIC <bookings@teetomic.golf>";
  // Domain: teetomic.golf (verify it in Resend + set DNS to send for real).

  if (!key) {
    /* eslint-disable no-console */
    console.log("\n📧 [teetomic mock email]");
    console.log(`   To:      ${input.to}`);
    console.log(`   Subject: ${input.subject}`);
    console.log(`   ${input.text}\n`);
    /* eslint-enable no-console */
    return { sent: true, mock: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
    });
    if (!res.ok) {
      // Surface the real reason (bad key, unverified domain, disallowed
      // recipient) instead of silently claiming success — this is exactly what
      // makes "the email never arrived and I don't know why" so hard to debug.
      const detail = await res.text().catch(() => "");
      /* eslint-disable-next-line no-console */
      console.error(`📧 Resend rejected (${res.status}): ${detail}`);
      return { sent: false, mock: false, error: `Resend ${res.status}: ${detail}` };
    }
    return { sent: true, mock: false };
  } catch (err) {
    /* eslint-disable-next-line no-console */
    console.error("📧 Resend request failed:", err);
    return { sent: false, mock: false, error: String((err as Error).message) };
  }
}

export function bookingConfirmationEmail(params: {
  reference: string;
  courseName: string;
  teeTimeLabel: string;
  pricePerPlayer: number;
  players: number;
  cancelDeadlineLabel: string;
}): { subject: string; html: string; text: string } {
  const { reference, courseName, teeTimeLabel, pricePerPlayer, players, cancelDeadlineLabel } = params;
  const subject = `TEETOMIC booking confirmed — ${courseName} (${reference})`;
  const text = `You're on the tee sheet at ${courseName}, ${teeTimeLabel}. Reference ${reference}. Pay $${pricePerPlayer}/player for ${players} player(s) at the pro shop — your $10 booking fee comes back as TeeCredit at check-in. Free cancellation until ${cancelDeadlineLabel}.`;
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;background:#FAF8F3;padding:24px;border-radius:16px;color:#1A1A1A">
    <div style="background:#0B3D2E;color:#C6F432;padding:12px 16px;border-radius:12px;font-weight:700;letter-spacing:.04em">TEE<span style="color:#fff">TOMIC</span></div>
    <h2 style="margin:20px 0 4px">You're on the tee sheet 🏌️</h2>
    <p style="margin:0;color:#4a4a4a">${courseName} — ${teeTimeLabel}</p>
    <div style="background:#fff;border-radius:12px;padding:16px;margin:16px 0">
      <p style="margin:0 0 8px"><strong>Reference:</strong> ${reference}</p>
      <p style="margin:0 0 8px"><strong>Due at the pro shop:</strong> $${pricePerPlayer}/player × ${players}</p>
      <p style="margin:0 0 8px"><strong>Booking fee:</strong> $10 — back as TeeCredit at check-in</p>
      <p style="margin:0;color:#0B3D2E"><strong>Free cancellation until ${cancelDeadlineLabel}</strong></p>
    </div>
    <p style="font-size:13px;color:#6a6a6a">Show your QR code at the pro shop to check in. Pay your green fee directly at the course — never through TEETOMIC.</p>
  </div>`;
  return { subject, html, text };
}

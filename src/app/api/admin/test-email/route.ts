import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Admin-only: fire a real test email and return the exact result (including the
// Resend error, if any). Lets you confirm email delivery before launch instead
// of guessing why nothing arrived.
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const to = process.env.APPROVALS_EMAIL || "tomictee@gmail.com";
  const from = process.env.EMAIL_FROM || "TEETOMIC <bookings@teetomic.golf>";
  const result = await sendEmail({
    to,
    subject: "TEETOMIC email test ✅",
    text: "If you can read this, TEETOMIC email delivery works.",
    html: `<div style="font-family:system-ui;padding:16px">
      <h2>TEETOMIC email test ✅</h2>
      <p>If you're reading this in your inbox, delivery works.</p>
    </div>`,
  });

  return NextResponse.json({
    ...result,
    to,
    from,
    hint: result.sent
      ? "Sent. Check the inbox (and spam)."
      : result.error?.includes("domain") || result.error?.includes("verif")
        ? "Likely cause: EMAIL_FROM uses an unverified domain. Set EMAIL_FROM to 'TEETOMIC <onboarding@resend.dev>' OR verify teetomic.golf in Resend."
        : "Send failed — see the error field.",
  });
}

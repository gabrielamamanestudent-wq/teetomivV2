import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const schema = z.object({
  courseName: z.string().min(2).max(80),
  city: z.string().min(1).max(60),
  region: z.enum([
    "west-island",
    "south-shore",
    "laval",
    "north-shore",
    "miami-dade",
    "broward",
    "other",
  ]),
  contactName: z.string().min(1).max(80),
  email: z.string().email(),
  pin: z.string().regex(/^\d{4}$/),
});

// Where business-account approval requests are sent for review.
const APPROVALS_INBOX = process.env.APPROVALS_EMAIL || "tomictee@gmail.com";

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const repo = getRepository();
  const result = await repo.createCourseAccount(parsed.data);

  // New business accounts require approval — email the review inbox. If email
  // isn't configured (or Resend rejects), the signup still succeeds: the pending
  // course always shows in the /admin dashboard, which is the source of truth.
  const origin = req.nextUrl.origin;
  const approveUrl = `${origin}/api/operator/approve?courseId=${result.courseId}`;
  const emailResult = await sendEmail({
    to: APPROVALS_INBOX,
    subject: `TEETOMIC — new business needs approval: ${parsed.data.courseName}`,
    text: `${parsed.data.courseName} (${parsed.data.city}, ${parsed.data.region}) signed up.\nContact: ${parsed.data.contactName} · ${parsed.data.email}\n\nApprove: ${approveUrl}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;color:#1A1A1A">
        <h2>New business account awaiting approval</h2>
        <p><strong>${parsed.data.courseName}</strong> — ${parsed.data.city}, ${parsed.data.region}</p>
        <p>Contact: ${parsed.data.contactName} · ${parsed.data.email}</p>
        <p style="margin-top:20px">
          <a href="${approveUrl}" style="background:#0B3D2E;color:#C6F432;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Approve this business →</a>
        </p>
      </div>`,
  });

  return NextResponse.json({ ...result, pending: true, approvalEmailSent: emailResult.sent });
}

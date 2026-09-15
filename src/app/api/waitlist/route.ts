import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { isAdminRequest } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const joinSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().max(30).optional(),
  region: z.enum([
    "west-island",
    "south-shore",
    "laval",
    "north-shore",
    "miami-dade",
    "broward",
    "other",
  ]),
  homeArea: z.string().trim().max(80).optional(),
  source: z.string().trim().max(40).optional(),
});

// Admin-only: read the collected waitlist (the demand-side proof for pro shops).
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const waitlist = await getRepository().listWaitlist();
  return NextResponse.json({ waitlist, count: waitlist.length });
}

// Public: a golfer joins the standby list. No auth — this is the top of funnel.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const entry = await getRepository().addWaitlistEntry(parsed.data);

  // Fire-and-forget heads-up to the business inbox so Gabriel sees demand build
  // up in real time. Never blocks or fails the signup.
  const notify =
    process.env.WAITLIST_NOTIFY_TO || process.env.APPROVALS_EMAIL || "tomictee@gmail.com";
  if (notify) {
    sendEmail({
      to: notify,
      subject: `New TEETOMIC standby signup — ${entry.name} (${entry.region})`,
      text: `${entry.name}\n${entry.email}${entry.phone ? "\n" + entry.phone : ""}\nRegion: ${entry.region}${entry.homeArea ? "\nArea: " + entry.homeArea : ""}${entry.source ? "\nSource: " + entry.source : ""}`,
      html: `<p><strong>${entry.name}</strong> just joined the standby list.</p>
<ul>
<li>Email: ${entry.email}</li>
${entry.phone ? `<li>Phone: ${entry.phone}</li>` : ""}
<li>Region: ${entry.region}</li>
${entry.homeArea ? `<li>Area: ${entry.homeArea}</li>` : ""}
${entry.source ? `<li>Source: ${entry.source}</li>` : ""}
</ul>`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: entry.id });
}

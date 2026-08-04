import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

const schema = z.object({
  courseName: z.string().min(2).max(80),
  city: z.string().min(1).max(60),
  region: z.enum(["west-island", "south-shore", "laval", "north-shore"]),
  contactName: z.string().min(1).max(80),
  email: z.string().email(),
  pin: z.string().regex(/^\d{4}$/),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const repo = getRepository();
  const result = await repo.createCourseAccount(parsed.data);
  return NextResponse.json(result);
}

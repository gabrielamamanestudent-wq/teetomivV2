import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const repo = getRepository();
  const user = await repo.authenticate(parsed.data.email, parsed.data.password);
  if (!user) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  const { password: _pw, ...safe } = user;
  return NextResponse.json({ user: safe });
}

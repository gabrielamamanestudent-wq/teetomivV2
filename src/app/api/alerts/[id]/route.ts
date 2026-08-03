import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const repo = getRepository();
  const alert = await repo.toggleAlert(params.id);
  return NextResponse.json({ alert });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const repo = getRepository();
  await repo.deleteAlert(params.id);
  return NextResponse.json({ ok: true });
}

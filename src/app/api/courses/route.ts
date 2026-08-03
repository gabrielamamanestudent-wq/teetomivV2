import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const repo = getRepository();
  const courses = await repo.listCourses();
  return NextResponse.json({ courses });
}

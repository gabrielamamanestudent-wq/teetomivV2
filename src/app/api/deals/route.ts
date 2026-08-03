import { NextRequest, NextResponse } from "next/server";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const repo = getRepository();
  const sp = req.nextUrl.searchParams;

  if (sp.get("recent")) {
    const limit = Number(sp.get("recent")) || 8;
    const deals = await repo.recentDeals(limit);
    const courses = await repo.listCourses();
    return NextResponse.json({ deals, courses });
  }

  const bands = sp.get("bands")?.split(",").filter(Boolean);
  const regions = sp.get("regions")?.split(",").filter(Boolean);
  const maxPrice = sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined;
  const holes = sp.get("holes") ? Number(sp.get("holes")) : undefined;
  const cart = sp.get("cart") === "1" ? true : undefined;
  const date = sp.get("date") || undefined;

  const deals = await repo.listDeals({ bands, regions, maxPrice, holes, cart, date });
  const courses = await repo.listCourses();
  return NextResponse.json({ deals, courses });
}

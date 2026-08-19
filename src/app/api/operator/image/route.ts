import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepository } from "@/lib/data";
import { getSupabaseAdmin, COURSE_PHOTOS_BUCKET } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Client sends the picked image as a data URL (FileReader.readAsDataURL).
const schema = z.object({
  courseId: z.string().min(1),
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpe?g|webp);base64,/, "must be a png/jpg/webp data URL"),
});

// ~4MB cap on the decoded image.
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { courseId, dataUrl } = parsed.data;

  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  const contentType = match[1];
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const repo = getRepository();
  const supa = getSupabaseAdmin();

  let photoUrl = dataUrl; // demo / mock fallback: store the data URL directly.

  if (supa) {
    const ext = contentType.split("/")[1].replace("jpeg", "jpg");
    const path = `${courseId}/${Date.now()}.${ext}`;
    const { error } = await supa.storage
      .from(COURSE_PHOTOS_BUCKET)
      .upload(path, bytes, { contentType, upsert: true });
    if (error) {
      return NextResponse.json({ error: "upload_failed", detail: error.message }, { status: 502 });
    }
    const { data } = supa.storage.from(COURSE_PHOTOS_BUCKET).getPublicUrl(path);
    photoUrl = data.publicUrl;
  }

  const course = await repo.updateCourse(courseId, { photoUrl });
  if (!course) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ course });
}

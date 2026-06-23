export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
// Save into the customer site's public folder so it's served at /menu-images/*
const UPLOAD_DIR = path.join(process.cwd(), "..", "website", "public", "menu-images");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const id = formData.get("id") as string | null;

    if (!file || !id) return NextResponse.json({ error: "file and id required" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Only JPEG, PNG, and WebP images allowed" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max file size is 5 MB" }, { status: 400 });

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filename = `${id}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    const imageUrl = `/menu-images/${filename}`;
    await prisma.menuItem.update({ where: { id }, data: { image: imageUrl } });

    return NextResponse.json({ url: imageUrl });
  } catch (err) {
    console.error("[menu upload]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.menuItem.update({ where: { id }, data: { image: null } });
    // Best-effort file deletion
    const { unlink } = await import("fs/promises");
    for (const ext of ["jpg", "png", "webp"]) {
      await unlink(path.join(UPLOAD_DIR, `${id}.${ext}`)).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

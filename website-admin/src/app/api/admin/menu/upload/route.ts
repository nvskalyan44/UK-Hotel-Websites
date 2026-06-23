export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const id = formData.get("id") as string | null;

    if (!file || !id) return NextResponse.json({ error: "file and id required" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Only JPEG, PNG, and WebP images allowed" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max file size is 5 MB" }, { status: 400 });

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const buffer = Buffer.from(await file.arrayBuffer());
    let imageUrl: string;

    if (hasBlob) {
      // Production / Vercel: persist to Blob storage (survives deploys, served over CDN)
      const blob = await put(`menu-images/${id}.${ext}`, buffer, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      imageUrl = blob.url;
    } else {
      // Local dev fallback: write into the admin app's own public folder
      const { writeFile, mkdir } = await import("fs/promises");
      const path = await import("path");
      const dir = path.join(process.cwd(), "public", "menu-images");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `${id}.${ext}`), buffer);
      imageUrl = `/menu-images/${id}.${ext}`;
    }

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

    const item = await prisma.menuItem.findUnique({ where: { id }, select: { image: true } });
    await prisma.menuItem.update({ where: { id }, data: { image: null } });

    // Best-effort cleanup of the stored file
    if (item?.image) {
      if (hasBlob && item.image.startsWith("http")) {
        await del(item.image).catch(() => {});
      } else {
        const { unlink } = await import("fs/promises");
        const path = await import("path");
        for (const ext of ["jpg", "png", "webp"]) {
          await unlink(path.join(process.cwd(), "public", "menu-images", `${id}.${ext}`)).catch(() => {});
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

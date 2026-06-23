export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: "gift_voucher_presets" } });
  const raw = setting?.value ?? "10,20,25,50,100";
  const presets = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));
  return NextResponse.json({ presets });
}

export async function PUT(req: Request) {
  const { presets } = await req.json() as { presets: number[] };
  if (!Array.isArray(presets) || presets.some(p => typeof p !== "number" || p <= 0))
    return NextResponse.json({ error: "presets must be a non-empty array of positive numbers" }, { status: 400 });
  await prisma.siteSetting.upsert({
    where: { key: "gift_voucher_presets" },
    update: { value: presets.join(",") },
    create: { key: "gift_voucher_presets", value: presets.join(",") },
  });
  return NextResponse.json({ presets });
}

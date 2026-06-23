export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const KEYS = [
  "name", "tagline", "address", "phone", "email", "openingHours",
  "minOrder", "deliveryCharge", "freeDeliveryThreshold",
  "delivery_zones", "auto_print", "sms_alerts",
];

export async function GET() {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: KEYS } } });
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const updates = Object.entries(body).filter(([k]) => KEYS.includes(k));

  await Promise.all(
    updates.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  return NextResponse.json({ ok: true });
}

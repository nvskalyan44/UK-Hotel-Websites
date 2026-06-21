export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface DeliveryZone {
  prefix: string;   // e.g. "S10"
  label: string;    // e.g. "Nether Edge"
  fee: number;      // e.g. 2.99
}

export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "delivery_zones" },
    });

    if (!setting?.value) {
      return NextResponse.json([]);
    }

    const zones: DeliveryZone[] = JSON.parse(setting.value);
    return NextResponse.json(zones);
  } catch {
    return NextResponse.json([]);
  }
}

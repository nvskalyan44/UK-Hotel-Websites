export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const KEYS = [
  "name",
  "tagline",
  "address",
  "phone",
  "email",
  "openingHours",
  "minOrder",
  "deliveryCharge",
  "freeDeliveryThreshold",
];

const DEFAULTS: Record<string, string> = {
  name: "Abhiruchi",
  tagline: "Authentic Indian Cuisine",
  address: "123 High Street, London, UK",
  phone: "+44 20 0000 0000",
  email: "info@abhiruchi.co.uk",
  openingHours: "12:00 - 22:00",
  minOrder: "15",
  deliveryCharge: "2.50",
  freeDeliveryThreshold: "30",
};

export async function GET() {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: KEYS } },
    });

    const settings: Record<string, string> = { ...DEFAULTS };
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

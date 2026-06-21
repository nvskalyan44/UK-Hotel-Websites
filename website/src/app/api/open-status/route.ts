export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DayHours = { open: string; close: string; closed: boolean };
type OpeningHours = Record<string, DayHours>;

function checkOpen(hours: OpeningHours): { isOpen: boolean; reason: string } {
  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const day = hours[dayKey];

  if (!day || day.closed) {
    // Find next open day
    for (let i = 1; i <= 7; i++) {
      const nextIdx = (now.getDay() + i) % 7;
      const nextDay = hours[DAY_KEYS[nextIdx]];
      if (nextDay && !nextDay.closed) {
        return { isOpen: false, reason: DAY_NAMES[nextIdx] };
      }
    }
    return { isOpen: false, reason: "" };
  }

  const [openH, openM] = day.open.split(":").map(Number);
  const [closeH, closeM] = day.close.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  if (nowMins < openMins) {
    return { isOpen: false, reason: `opens today at ${day.open}` };
  }
  if (nowMins >= closeMins) {
    // Find next open day
    for (let i = 1; i <= 7; i++) {
      const nextIdx = (now.getDay() + i) % 7;
      const nextDay = hours[DAY_KEYS[nextIdx]];
      if (nextDay && !nextDay.closed) {
        return { isOpen: false, reason: DAY_NAMES[nextIdx] };
      }
    }
    return { isOpen: false, reason: "" };
  }

  return { isOpen: true, reason: day.close };
}

export async function GET() {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: "openingHours" } });
    if (!row) return NextResponse.json({ isOpen: true, closingTime: "", nextOpen: "" });

    const hours: OpeningHours = JSON.parse(row.value);
    const { isOpen, reason } = checkOpen(hours);

    return NextResponse.json({ isOpen, closingTime: isOpen ? reason : "", nextOpen: isOpen ? "" : reason });
  } catch {
    // Default to open if we can't read settings
    return NextResponse.json({ isOpen: true, closingTime: "", nextOpen: "" });
  }
}

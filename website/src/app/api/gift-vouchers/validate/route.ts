import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.toUpperCase().trim();

  if (!code) return NextResponse.json({ valid: false, error: "No code provided" });

  try {
    const voucher = await prisma.giftVoucher.findUnique({ where: { code } });

    if (!voucher) {
      return NextResponse.json({ valid: false, error: "Voucher not found" });
    }
    if (!voucher.isActive) {
      return NextResponse.json({ valid: false, error: "Voucher is no longer active" });
    }
    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, error: "Voucher has expired" });
    }
    if (voucher.balance <= 0) {
      return NextResponse.json({ valid: false, error: "Voucher has no remaining balance" });
    }

    return NextResponse.json({ valid: true, balance: voucher.balance, code: voucher.code });
  } catch (error) {
    return NextResponse.json({ valid: false, error: String(error) });
  }
}

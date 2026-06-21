import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GIFT-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, purchaserName, purchaserEmail, recipientEmail, customMessage } = body;

    if (!amount || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (!purchaserEmail) {
      return NextResponse.json({ error: "Purchaser email is required" }, { status: 400 });
    }

    // Generate a unique code (retry on collision)
    let code = generateVoucherCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.giftVoucher.findUnique({ where: { code } });
      if (!existing) break;
      code = generateVoucherCode();
      attempts++;
    }

    const voucher = await prisma.giftVoucher.create({
      data: {
        code,
        initialAmount: amount,
        balance: amount,
        purchaserName: purchaserName ?? "",
        purchaserEmail,
        recipientEmail: recipientEmail ?? null,
        customMessage: customMessage ?? null,
      },
    });

    return NextResponse.json({ code: voucher.code, amount: voucher.initialAmount }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

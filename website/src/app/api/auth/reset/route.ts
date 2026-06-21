import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, sha256 } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { action, email, otp, newPassword } = await req.json() as {
      action: "request" | "confirm";
      email?: string;
      otp?: string;
      newPassword?: string;
    };

    if (action === "request") {
      if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

      const customer = await prisma.customer.findUnique({ where: { email } });
      if (!customer) {
        return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
      }

      const code = generateOtp();
      const expiry = new Date(Date.now() + 1000 * 60 * 15);

      await prisma.customer.update({
        where: { email },
        data: { otpCode: code, otpExpiry: expiry },
      });

      return NextResponse.json({ ok: true, demo_otp: code });
    }

    if (action === "confirm") {
      if (!email || !otp || !newPassword) {
        return NextResponse.json({ error: "Email, OTP and new password are required" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }

      const customer = await prisma.customer.findUnique({ where: { email } });
      if (!customer) return NextResponse.json({ error: "Account not found" }, { status: 404 });

      if (!customer.otpCode || customer.otpCode !== otp) {
        return NextResponse.json({ error: "Invalid reset code" }, { status: 400 });
      }
      if (!customer.otpExpiry || customer.otpExpiry < new Date()) {
        return NextResponse.json({ error: "Reset code has expired" }, { status: 400 });
      }

      await prisma.customer.update({
        where: { email },
        data: {
          passwordHash: sha256(newPassword),
          otpCode: null,
          otpExpiry: null,
        },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

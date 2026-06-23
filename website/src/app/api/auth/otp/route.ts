import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOtp, createSession, SESSION_COOKIE, COOKIE_OPTS } from "@/lib/auth";

async function sendSms(to: string, body: string) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) return false;
  const twilio = (await import("twilio")).default;
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  await client.messages.create({ from: TWILIO_PHONE_NUMBER, to, body });
  return true;
}

// POST /api/auth/otp  body: { action: "send", phone } | { action: "verify", phone, otp }
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "send") {
      const { phone } = body;
      if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

      const otp = generateOtp();
      const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Upsert customer by phone
      const existing = await prisma.customer.findFirst({ where: { phone } });
      if (existing) {
        await prisma.customer.update({ where: { id: existing.id }, data: { otpCode: otp, otpExpiry: expiry } });
      } else {
        await prisma.customer.create({
          data: { id: `CUST-${Date.now()}`, name: "Customer", email: `${phone.replace(/\D/g, "")}@phone.local`, phone, otpCode: otp, otpExpiry: expiry },
        });
      }

      const smsSent = await sendSms(phone, `Your Abhiruchi verification code is: ${otp}. Valid for 5 minutes.`).catch(() => false);
      if (smsSent) {
        return NextResponse.json({ ok: true, message: "OTP sent via SMS" });
      }
      // Demo mode fallback when Twilio not configured
      return NextResponse.json({ ok: true, demo_otp: otp, message: "OTP sent (demo mode — use the code shown)" });
    }

    if (body.action === "verify") {
      const { phone, otp } = body;
      const customer = await prisma.customer.findFirst({ where: { phone } });

      if (!customer || customer.otpCode !== otp || !customer.otpExpiry || customer.otpExpiry < new Date()) {
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
      }

      // Clear OTP
      await prisma.customer.update({ where: { id: customer.id }, data: { otpCode: null, otpExpiry: null } });

      const token = await createSession(customer.id);
      const res = NextResponse.json({ ok: true, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, loyaltyPoints: customer.loyaltyPoints } });
      res.cookies.set(SESSION_COOKIE, token, COOKIE_OPTS);
      return res;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

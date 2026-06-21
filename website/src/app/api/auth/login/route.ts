import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256, createSession, SESSION_COOKIE, COOKIE_OPTS } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const customer = await prisma.customer.findUnique({ where: { email } });

    if (!customer || !customer.passwordHash || customer.passwordHash !== sha256(password)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSession(customer.id);
    const res = NextResponse.json({ ok: true, customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, loyaltyPoints: customer.loyaltyPoints } });
    res.cookies.set(SESSION_COOKIE, token, COOKIE_OPTS);
    return res;
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

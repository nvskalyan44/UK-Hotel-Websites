import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sha256, createSession, SESSION_COOKIE, COOKIE_OPTS } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password, phone } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: "All fields required" }, { status: 400 });

    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      // If they previously ordered as a guest, upgrade to full account
      if (!existing.passwordHash) {
        const updated = await prisma.customer.update({
          where: { email },
          data: { name, passwordHash: sha256(password), phone: phone || existing.phone },
        });
        const token = await createSession(updated.id);
        const res = NextResponse.json({ ok: true, customer: { id: updated.id, name: updated.name, email: updated.email } });
        res.cookies.set(SESSION_COOKIE, token, COOKIE_OPTS);
        return res;
      }
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const customer = await prisma.customer.create({
      data: {
        id: `CUST-${Date.now()}`,
        name,
        email,
        phone: phone || null,
        passwordHash: sha256(password),
      },
    });

    const token = await createSession(customer.id);
    const res = NextResponse.json({ ok: true, customer: { id: customer.id, name: customer.name, email: customer.email } });
    res.cookies.set(SESSION_COOKIE, token, COOKIE_OPTS);
    return res;
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

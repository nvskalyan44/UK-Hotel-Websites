export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

export async function GET() {
  try {
    const accounts = await prisma.adminAccount.findMany({ orderBy: { id: "asc" }, select: { id: true, username: true, updatedAt: true } });
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json() as { username: string; password: string };
    if (!username?.trim() || !password?.trim())
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

    const existing = await prisma.adminAccount.findUnique({ where: { username: username.trim() } });
    if (existing) return NextResponse.json({ error: "Username already exists" }, { status: 400 });

    const account = await prisma.adminAccount.create({
      data: { username: username.trim(), password: sha256(password) },
      select: { id: true, username: true, updatedAt: true },
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json() as { id: number };
    const total = await prisma.adminAccount.count();
    if (total <= 1) return NextResponse.json({ error: "Cannot delete the last admin account" }, { status: 400 });
    await prisma.adminAccount.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

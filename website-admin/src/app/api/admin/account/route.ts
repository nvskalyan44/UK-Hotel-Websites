export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

export async function GET() {
  try {
    const account = await prisma.adminAccount.findFirst();
    return NextResponse.json({ username: account?.username ?? "admin" });
  } catch {
    return NextResponse.json({ username: "admin" });
  }
}

export async function PATCH(req: Request) {
  try {
    const { currentPassword, newUsername, newPassword } = await req.json();

    const account = await prisma.adminAccount.findFirst();
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    if (account.password !== sha256(currentPassword)) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const data: { username?: string; password?: string } = {};
    if (newUsername?.trim()) data.username = newUsername.trim();
    if (newPassword?.trim()) data.password = sha256(newPassword.trim());

    const updated = await prisma.adminAccount.update({ where: { id: account.id }, data });
    return NextResponse.json({ ok: true, username: updated.username });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

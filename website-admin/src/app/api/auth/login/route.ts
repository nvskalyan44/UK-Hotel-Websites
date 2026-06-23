export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

const ENV_USER = process.env.ADMIN_USERNAME ?? "admin";
const ENV_PASS = process.env.ADMIN_PASSWORD ?? "admin123";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  let valid = false;

  try {
    const account = await prisma.adminAccount.findFirst({ where: { username } });
    if (account) {
      valid = account.password === sha256(password);
    } else {
      valid = username === ENV_USER && password === ENV_PASS;
    }
  } catch {
    valid = username === ENV_USER && password === ENV_PASS;
  }

  if (valid) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("admin_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  }
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}

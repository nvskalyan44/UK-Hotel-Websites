export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// ── Base32 helpers ─────────────────────────────────────────────────────────
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_CHARS[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(encoded: string): Buffer {
  const str = encoded.toUpperCase().replace(/=+$/, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of str) {
    const idx = BASE32_CHARS.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

// ── TOTP ──────────────────────────────────────────────────────────────────
function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  // Write counter as big-endian uint64
  const hi = Math.floor(counter / 0x100000000);
  const lo = counter >>> 0;
  buf.writeUInt32BE(hi, 0);
  buf.writeUInt32BE(lo, 4);
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

function verifyTotp(secret: string, token: string): boolean {
  const key = base32Decode(secret);
  const t = Math.floor(Date.now() / 1000 / 30);
  for (const window of [-1, 0, 1]) {
    if (hotp(key, t + window) === token) return true;
  }
  return false;
}

// ── Handlers ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") ?? "setup";

    if (action === "setup") {
      const secretBytes = randomBytes(20);
      const secret = base32Encode(secretBytes);
      const issuer = "Abhiruchi";
      const label = encodeURIComponent(`${issuer}:admin`);
      const qrUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
      return NextResponse.json({ secret, qrUrl });
    }

    if (action === "verify") {
      const { code, secret } = await req.json();
      if (!code || !secret) return NextResponse.json({ error: "code and secret required" }, { status: 400 });
      const valid = verifyTotp(String(secret), String(code));
      if (!valid) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

      // Save to the first admin account
      const account = await prisma.adminAccount.findFirst();
      if (!account) return NextResponse.json({ error: "No admin account found" }, { status: 404 });

      await prisma.adminAccount.update({
        where: { id: account.id },
        data: { totpSecret: String(secret), totpEnabled: true },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "disable") {
      const account = await prisma.adminAccount.findFirst();
      if (!account) return NextResponse.json({ error: "No admin account found" }, { status: 404 });
      await prisma.adminAccount.update({
        where: { id: account.id },
        data: { totpSecret: null, totpEnabled: false },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "status") {
      const account = await prisma.adminAccount.findFirst();
      return NextResponse.json({ enabled: account?.totpEnabled ?? false });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { createHash } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createSession(customerId: string): Promise<string> {
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
  await prisma.customerSession.create({ data: { id, customerId, expiresAt } });
  return id;
}

export async function getSessionCustomer() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;
    if (!token) return null;
    const session = await prisma.customerSession.findUnique({
      where: { id: token },
      include: { customer: true },
    });
    if (!session || session.expiresAt < new Date()) return null;
    return session.customer;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string, res: Response) {
  return token;
}

export const SESSION_COOKIE = "customer_token";
export const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
};

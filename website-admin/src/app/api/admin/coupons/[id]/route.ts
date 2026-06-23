export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function mapCoupon(c: any) {
  return {
    id: String(c.id),
    code: c.code,
    title: c.title,
    type: c.discountType === "fixed" ? "flat" : "percent",
    discount: c.discountValue,
    minOrder: c.minOrderAmount,
    maxUses: c.maxUses ?? undefined,
    uses: c.currentUses,
    active: c.isActive,
    expiry: c.expiresAt ? c.expiresAt.toISOString().split("T")[0] : "",
    startsAt: c.startsAt ? c.startsAt.toISOString().split("T")[0] : "",
    firstOrderOnly: c.firstOrderOnly ?? false,
    usageLimitPerUser: c.usageLimitPerUser ?? undefined,
    applicableCategories: JSON.parse(c.applicableCategories || "[]"),
    applicableItems: JSON.parse(c.applicableItems || "[]"),
    orderType: c.orderType ?? "",
  };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: any = {};
  if (body.active !== undefined) data.isActive = body.active;
  if (body.code !== undefined) data.code = (body.code as string).toUpperCase();
  if (body.title !== undefined) data.title = body.title;
  if (body.type !== undefined) data.discountType = body.type === "flat" ? "fixed" : "percent";
  if (body.discount !== undefined) data.discountValue = parseFloat(body.discount);
  if (body.minOrder !== undefined) data.minOrderAmount = parseFloat(body.minOrder);
  if (body.maxUses !== undefined) data.maxUses = body.maxUses ? parseInt(body.maxUses) : null;
  if (body.expiry !== undefined) data.expiresAt = body.expiry ? new Date(body.expiry) : null;
  if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
  if (body.firstOrderOnly !== undefined) data.firstOrderOnly = body.firstOrderOnly === true;
  if (body.usageLimitPerUser !== undefined) data.usageLimitPerUser = body.usageLimitPerUser ? parseInt(body.usageLimitPerUser) : null;
  if (body.applicableCategories !== undefined) data.applicableCategories = JSON.stringify(body.applicableCategories ?? []);
  if (body.applicableItems !== undefined) data.applicableItems = JSON.stringify(body.applicableItems ?? []);
  if (body.orderType !== undefined) data.orderType = body.orderType || null;

  const coupon = await prisma.coupon.update({ where: { id: parseInt(id) }, data });
  return NextResponse.json(mapCoupon(coupon));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.coupon.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}

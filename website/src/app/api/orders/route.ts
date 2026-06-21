import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation, sendNewOrderAlert } from "@/lib/email";
import { sendSmsAlert } from "@/lib/sms";

interface CartItem { id: string; name: string; price: number; emoji: string; qty: number; notes?: string; }
interface OrderDetails { type: string; name: string; phone?: string; email: string; address?: string; postcode?: string; instructions?: string; loyaltyPointsUsed?: number; scheduledTime?: string; time?: string; }

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
type DayHours = { open: string; close: string; closed: boolean };

function isRestaurantOpen(hoursJson: string): boolean {
  try {
    const hours: Record<string, DayHours> = JSON.parse(hoursJson);
    const now = new Date();
    const day = hours[DAY_KEYS[now.getDay()]];
    if (!day || day.closed) return false;
    const [openH, openM] = day.open.split(":").map(Number);
    const [closeH, closeM] = day.close.split(":").map(Number);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return nowMins >= openH * 60 + openM && nowMins < closeH * 60 + closeM;
  } catch { return true; }
}

export async function POST(req: Request) {
  try {
    // Check if restaurant is accepting orders
    const hoursRow = await prisma.siteSetting.findUnique({ where: { key: "openingHours" } });
    if (hoursRow && !isRestaurantOpen(hoursRow.value)) {
      return NextResponse.json({ error: "We are not currently accepting orders. Please try again during opening hours." }, { status: 503 });
    }

    const body = await req.json();
    const { items, subtotal, discount, couponCode, deliveryFee, total, paymentMethod, details } = body as {
      items: CartItem[]; subtotal: number; discount: number; couponCode?: string;
      deliveryFee: number; total: number; paymentMethod: string; details: OrderDetails;
    };

    const loyaltyPointsUsed = details.loyaltyPointsUsed ?? 0;
    const loyaltyDiscount = loyaltyPointsUsed > 0 ? Math.floor(loyaltyPointsUsed / 100) : 0;
    const adjustedTotal = Math.max(0, total - loyaltyDiscount);

    // Server-side coupon restriction re-validation
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode.toUpperCase(), isActive: true },
      });
      if (coupon) {
        const now = new Date();
        if ((coupon.startsAt && now < coupon.startsAt) || (coupon.expiresAt && now > coupon.expiresAt)) {
          return NextResponse.json({ error: "Coupon is no longer valid" }, { status: 400 });
        }
        if (coupon.orderType && coupon.orderType !== details.type) {
          return NextResponse.json({ error: `This coupon is only valid for ${coupon.orderType} orders` }, { status: 400 });
        }
        if (coupon.firstOrderOnly) {
          const existing = await prisma.customer.findUnique({ where: { email: details.email }, select: { totalOrders: true } });
          if (existing && existing.totalOrders > 0) {
            return NextResponse.json({ error: "This coupon is for first-time customers only" }, { status: 400 });
          }
        }
        if (coupon.usageLimitPerUser) {
          const existing = await prisma.customer.findUnique({ where: { email: details.email }, select: { id: true } });
          if (existing) {
            const usageCount = await prisma.couponRedemption.count({ where: { couponId: coupon.id, order: { customerId: existing.id } } });
            if (usageCount >= coupon.usageLimitPerUser) {
              return NextResponse.json({ error: "You have already used this coupon the maximum number of times" }, { status: 400 });
            }
          }
        }
      }
    }

    // Upsert customer record — creates on first order, updates stats on repeat orders
    const customer = await prisma.customer.upsert({
      where: { email: details.email },
      create: {
        id: `CUST-${Date.now()}`,
        name: details.name,
        email: details.email,
        phone: details.phone || null,
        totalOrders: 1,
        totalSpent: adjustedTotal,
        loyaltyPoints: Math.floor(adjustedTotal * 10),
        lastOrderAt: new Date(),
        status: "active",
      },
      update: {
        name: details.name,
        phone: details.phone || undefined,
        totalOrders: { increment: 1 },
        totalSpent: { increment: adjustedTotal },
        loyaltyPoints: { increment: Math.floor(adjustedTotal * 10) - loyaltyPointsUsed },
        lastOrderAt: new Date(),
        status: "active",
      },
    });

    const orderId = "ABH-" + Math.floor(100000 + Math.random() * 900000);

    const order = await prisma.order.create({
      data: {
        id: orderId,
        customerId: customer.id,
        orderType: details.type,
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod,
        subtotal,
        discountAmount: discount + loyaltyDiscount,
        deliveryFee,
        total: adjustedTotal,
        customerName: details.name,
        customerEmail: details.email,
        customerPhone: details.phone || null,
        deliveryAddress: details.type === "delivery" ? details.address ?? null : null,
        deliveryPostcode: details.type === "delivery" ? details.postcode ?? null : null,
        specialInstructions: details.instructions || null,
        timePreference: details.time ?? "asap",
        scheduledTime: details.scheduledTime ? new Date(details.scheduledTime) : null,
        items: {
          create: items.map((item) => ({
            menuItemId: null,
            itemName: item.name,
            itemEmoji: item.emoji,
            unitPrice: item.price,
            quantity: item.qty,
            lineTotal: item.price * item.qty,
            notes: item.notes ?? null,
          })),
        },
      },
    });

    if (couponCode) {
      await prisma.coupon.updateMany({
        where: { code: couponCode.toUpperCase() },
        data: { currentUses: { increment: 1 } },
      });
    }

    const eta = Math.floor(35 + Math.random() * 10);

    // Send emails non-blocking — don't fail the order if email fails
    const emailPayload = {
      id: order.id,
      customerName: details.name,
      customerEmail: details.email,
      orderType: details.type,
      items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      subtotal,
      discountAmount: discount + loyaltyDiscount,
      deliveryFee,
      total: adjustedTotal,
      paymentMethod,
      deliveryAddress: details.type === "delivery" ? `${details.address ?? ""}, ${details.postcode ?? ""}`.trim().replace(/^,\s*/, "") : undefined,
      specialInstructions: details.instructions || undefined,
      estimatedMinutes: eta,
    };
    Promise.all([
      sendOrderConfirmation(emailPayload),
      sendNewOrderAlert(emailPayload),
    ]).catch(e => console.error("[email]", e));

    // Notify restaurant via SMS if configured
    prisma.siteSetting.findUnique({ where: { key: "sms_alerts" } })
      .then(row => {
        if (row?.value && row.value !== "false") {
          return sendSmsAlert(row.value, order.id, details.name, adjustedTotal);
        }
      })
      .catch(e => console.error("[sms]", e));

    return NextResponse.json({ id: order.id, eta });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

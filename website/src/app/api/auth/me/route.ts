import { NextResponse } from "next/server";
import { getSessionCustomer } from "@/lib/auth";

export async function GET() {
  try {
    const customer = await getSessionCustomer();
    if (!customer) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        loyaltyPoints: customer.loyaltyPoints,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        joinedAt: customer.joinedAt,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}

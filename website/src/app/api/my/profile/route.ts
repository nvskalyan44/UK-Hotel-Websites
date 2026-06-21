import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionCustomer } from "@/lib/auth";

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

export async function PATCH(req: Request) {
  try {
    const customer = await getSessionCustomer();
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      name?: string;
      phone?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    // Password change branch
    if (body.currentPassword !== undefined || body.newPassword !== undefined) {
      const { currentPassword, newPassword } = body;
      if (!currentPassword || !newPassword)
        return NextResponse.json({ error: "Both current and new password are required" }, { status: 400 });
      if (newPassword.length < 8)
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });

      const record = await prisma.customer.findUnique({ where: { id: customer.id }, select: { passwordHash: true } });
      if (!record?.passwordHash)
        return NextResponse.json({ error: "No password set — use OTP login" }, { status: 400 });
      if (record.passwordHash !== sha256(currentPassword))
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

      await prisma.customer.update({ where: { id: customer.id }, data: { passwordHash: sha256(newPassword) } });
      return NextResponse.json({ success: true });
    }

    // Profile update branch
    const { name, phone } = body;
    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

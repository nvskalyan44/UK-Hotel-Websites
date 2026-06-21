import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionCustomer } from "@/lib/auth";

type SavedAddress = { id: string; label: string; address: string; postcode: string };

export async function GET() {
  try {
    const customer = await getSessionCustomer();
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const record = await prisma.customer.findUnique({ where: { id: customer.id }, select: { savedAddresses: true } });
    const addresses: SavedAddress[] = JSON.parse(record?.savedAddresses ?? "[]");
    return NextResponse.json(addresses);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const customer = await getSessionCustomer();
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { label, address, postcode } = await req.json() as { label?: string; address: string; postcode: string };
    if (!address?.trim() || !postcode?.trim())
      return NextResponse.json({ error: "Address and postcode are required" }, { status: 400 });

    const record = await prisma.customer.findUnique({ where: { id: customer.id }, select: { savedAddresses: true } });
    const addresses: SavedAddress[] = JSON.parse(record?.savedAddresses ?? "[]");

    if (addresses.length >= 5)
      return NextResponse.json({ error: "Maximum 5 saved addresses" }, { status: 400 });

    const newAddr: SavedAddress = {
      id: Date.now().toString(),
      label: label?.trim() || "Home",
      address: address.trim(),
      postcode: postcode.trim().toUpperCase(),
    };
    addresses.push(newAddr);

    await prisma.customer.update({ where: { id: customer.id }, data: { savedAddresses: JSON.stringify(addresses) } });
    return NextResponse.json(newAddr, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const customer = await getSessionCustomer();
    if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json() as { id: string };
    const record = await prisma.customer.findUnique({ where: { id: customer.id }, select: { savedAddresses: true } });
    const addresses: SavedAddress[] = JSON.parse(record?.savedAddresses ?? "[]");
    const filtered = addresses.filter(a => a.id !== id);

    await prisma.customer.update({ where: { id: customer.id }, data: { savedAddresses: JSON.stringify(filtered) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

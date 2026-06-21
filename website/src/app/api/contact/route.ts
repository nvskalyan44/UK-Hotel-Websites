import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      name: string; email: string; subject: string; message: string;
      reservationDate?: string; reservationTime?: string; partySize?: number;
      eventDate?: string; eventGuests?: number; eventType?: string;
    };

    const { name, email, subject, message } = body;
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        status: "unread",
        reservationDate: body.reservationDate || null,
        reservationTime: body.reservationTime || null,
        partySize: body.partySize ? Number(body.partySize) : null,
        eventDate: body.eventDate || null,
        eventGuests: body.eventGuests ? Number(body.eventGuests) : null,
        eventType: body.eventType || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

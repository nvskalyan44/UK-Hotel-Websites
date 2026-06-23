export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

async function getRecipients(targetGroup: string): Promise<{ email: string; name: string }[]> {
  const now = new Date();

  if (targetGroup === "all") {
    const customers = await prisma.customer.findMany({
      where: { status: "active" },
      select: { email: true, name: true },
    });
    return customers;
  }

  if (targetGroup === "active_last_30d") {
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const customers = await prisma.customer.findMany({
      where: { lastOrderAt: { gte: cutoff }, status: "active" },
      select: { email: true, name: true },
    });
    return customers;
  }

  if (targetGroup === "top_spenders") {
    const customers = await prisma.customer.findMany({
      where: { totalSpent: { gte: 100 }, status: "active" },
      orderBy: { totalSpent: "desc" },
      select: { email: true, name: true },
    });
    return customers;
  }

  if (targetGroup === "new_customers") {
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const customers = await prisma.customer.findMany({
      where: { joinedAt: { gte: cutoff }, status: "active" },
      select: { email: true, name: true },
    });
    return customers;
  }

  return [];
}

export async function GET() {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subject, body: emailBody, targetGroup, action } = body as {
      subject: string;
      body: string;
      targetGroup: string;
      action: "draft" | "send";
    };

    if (!subject || !emailBody || !targetGroup) {
      return NextResponse.json({ error: "subject, body and targetGroup are required" }, { status: 400 });
    }

    if (action === "draft" || action !== "send") {
      const campaign = await prisma.emailCampaign.create({
        data: {
          subject,
          body: emailBody,
          targetGroup,
          status: "draft",
        },
      });
      return NextResponse.json(campaign);
    }

    // Send now
    const recipients = await getRecipients(targetGroup);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT ?? "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let sentCount = 0;
    for (const recipient of recipients) {
      try {
        await transporter.sendMail({
          from: `Abhiruchulu Sheffield <${process.env.SMTP_USER}>`,
          to: recipient.email,
          subject,
          html: emailBody,
        });
        sentCount++;
      } catch {
        // continue sending to remaining recipients
      }
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        subject,
        body: emailBody,
        targetGroup,
        status: "sent",
        sentCount,
        sentAt: new Date(),
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        action: "email_campaign",
        detail: `Campaign "${subject}" sent to ${sentCount} recipients (target: ${targetGroup})`,
        entityId: String(campaign.id),
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

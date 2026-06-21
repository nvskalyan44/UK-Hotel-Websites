export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [settings, hours] = await Promise.all([
      prisma.siteSetting.findMany(),
      prisma.openingHours.findMany({ orderBy: { displayOrder: "asc" } }),
    ]);

    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;

    return NextResponse.json({
      name:                 map["restaurant_name"]          ?? "Abhiruchulu",
      tagline:              map["restaurant_tagline"]       ?? "Authentic South Indian Cuisine in the Heart of Sheffield",
      est:                  parseInt(map["restaurant_est"]  ?? "2000", 10),
      address:              map["restaurant_address"]       ?? "142 Ecclesall Road, Sheffield, S11 8JD",
      phone:                map["restaurant_phone"]         ?? "+44 114 267 8899",
      email:                map["restaurant_email"]         ?? "hello@abhiruchulu.co.uk",
      minOrder:             parseFloat(map["restaurant_min_order"]          ?? "15"),
      deliveryCharge:       parseFloat(map["restaurant_delivery_charge"]    ?? "2.99"),
      freeDeliveryThreshold: parseFloat(map["restaurant_free_delivery_min"] ?? "35"),
      hours: hours.map((h) => ({
        day:    h.dayLabel,
        time:   h.timeLabel,
        isOpen: h.isOpen,
      })),
      deliveryEstimateMinutes:   parseInt(map["delivery_estimate_minutes"]   ?? "35"),
      collectionEstimateMinutes: parseInt(map["collection_estimate_minutes"] ?? "20"),
      loyaltyPointsPerPound:     parseInt(map["loyalty_points_per_pound"]    ?? "100"),
      maxPartySize:              parseInt(map["max_party_size"]              ?? "10"),
      orderRecentHours:          parseInt(map["order_recent_hours"]          ?? "3"),
      orderCancelWindowMinutes:  parseInt(map["order_cancel_window_minutes"] ?? "15"),
      passwordMinLength:         parseInt(map["password_min_length"]         ?? "8"),
      contactAddressNote: map["contact_address_note"] ?? "Bus 65 stops outside · 2 mins walk from Sheffield Botanical Gardens",
      contactEmailNote:   map["contact_email_note"]   ?? "Replies within 4 hours",
      contactPhoneNote:   map["contact_phone_note"]   ?? "Lines open through service hours",
      mapsEmbedUrl:       map["maps_embed_url"]       ?? "",
      mapsLinkUrl:        map["maps_link_url"]        ?? "https://maps.google.com/?q=142+Ecclesall+Road+Sheffield+S11+8JD",
      contactIntroText:   map["contact_intro_text"]   ?? "Walk-ins welcome. Reservations recommended for Friday and Saturday evenings.",
      giftVoucherPresets: (map["gift_voucher_presets"] ?? "10,20,25,50,100")
        .split(",")
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n)),
    });
  } catch (err) {
    console.error("[api/config]", err);
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}

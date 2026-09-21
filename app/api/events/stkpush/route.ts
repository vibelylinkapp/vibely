import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stkPush, normalizeKePhone, mpesaConfigured } from "@/lib/mpesa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Buy a ticket for a paid event with M-Pesa.
 *
 * Mirrors /api/mpesa/stkpush (subscriptions) rather than inventing a second
 * payment path: same Daraja helper, same payments table, same callback.
 * The difference is that the payment carries an event_id, and the booking is
 * written here as pending_payment and only flipped to confirmed by the
 * callback once Safaricom reports success.
 */
export async function POST(req: Request) {
  if (!mpesaConfigured()) {
    return NextResponse.json(
      { ok: false, reason: "not_configured" },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { eventId?: string; phone?: string };
  try {
    body = (await req.json()) as { eventId?: string; phone?: string };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const eventId = (body.eventId || "").trim();
  if (!eventId) {
    return NextResponse.json({ ok: false, reason: "bad_event" }, { status: 400 });
  }

  const phone = normalizeKePhone(body.phone || "");
  if (!phone) {
    return NextResponse.json({ ok: false, reason: "bad_phone" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: ev } = await admin
    .from("events")
    .select("id, title, price_kes, capacity, going_base, status")
    .eq("id", eventId)
    .maybeSingle();

  if (!ev || ev.status !== "published") {
    return NextResponse.json({ ok: false, reason: "bad_event" }, { status: 404 });
  }

  const price = ev.price_kes ?? 0;
  if (price <= 0) {
    // Free events do not go through M-Pesa; the client books them directly.
    return NextResponse.json({ ok: false, reason: "free_event" }, { status: 400 });
  }

  // Already holding a ticket?
  const { data: existing } = await admin
    .from("event_bookings")
    .select("status")
    .eq("event_id", eventId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existing?.status === "confirmed") {
    return NextResponse.json({ ok: false, reason: "already_booked" }, { status: 409 });
  }

  // Capacity is checked server-side; the client cannot be trusted for this.
  if (ev.capacity) {
    const { count } = await admin
      .from("event_bookings")
      .select("event_id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "confirmed");
    const going = (count ?? 0) + (ev.going_base ?? 0);
    if (going >= ev.capacity) {
      return NextResponse.json({ ok: false, reason: "sold_out" }, { status: 409 });
    }
  }

  const baseCallback =
    process.env.MPESA_CALLBACK_URL ||
    `${new URL(req.url).origin}/api/mpesa/callback`;
  const callbackSecret = process.env.MPESA_CALLBACK_SECRET;
  const callbackUrl = callbackSecret
    ? `${baseCallback}${
        baseCallback.includes("?") ? "&" : "?"
      }t=${encodeURIComponent(callbackSecret)}`
    : baseCallback;

  try {
    const res = await stkPush({
      phone,
      amount: price,
      accountRef: "Vibely",
      description: `Ticket: ${ev.title}`.slice(0, 60),
      callbackUrl,
    });

    const { data: pay } = await admin
      .from("payments")
      .insert({
        profile_id: user.id,
        provider: "mpesa",
        amount_kes: price,
        event_id: eventId,
        mpesa_checkout_id: res.checkoutRequestId,
        phone,
        status: "pending",
      })
      .select("id")
      .single();

    // Hold the seat as pending until the callback confirms payment.
    await admin.from("event_bookings").upsert(
      {
        event_id: eventId,
        profile_id: user.id,
        status: "pending_payment",
        payment_id: pay?.id ?? null,
      },
      { onConflict: "event_id,profile_id" }
    );

    return NextResponse.json({
      ok: true,
      checkoutId: res.checkoutRequestId,
      message: res.customerMessage,
      amount: price,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, reason: e instanceof Error ? e.message : "stk_failed" },
      { status: 502 }
    );
  }
}

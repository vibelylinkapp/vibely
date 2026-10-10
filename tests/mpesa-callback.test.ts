import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * End-to-end behaviour of /api/mpesa/callback against an in-memory fake of
 * the Supabase service-role client. Covers: valid success, wrong secret,
 * missing secret, failed payment, and a replayed callback.
 */

type Row = Record<string, unknown>;
const db: Record<string, Row[]> = {};

function table(name: string) {
  db[name] ??= [];
  const filters: Array<[string, unknown]> = [];
  let op: "select" | "update" | "delete" = "select";
  let patch: Row = {};
  const rows = () =>
    db[name].filter((r) => filters.every(([k, v]) => r[k] === v));
  const builder = {
    select: () => builder,
    update: (p: Row) => ((op = "update"), (patch = p), builder),
    delete: () => ((op = "delete"), builder),
    eq: (k: string, v: unknown) => (filters.push([k, v]), builder),
    maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
    then: (resolve: (v: unknown) => void) => {
      if (op === "update") rows().forEach((r) => Object.assign(r, patch));
      if (op === "delete") {
        const kill = new Set(rows());
        db[name] = db[name].filter((r) => !kill.has(r));
      }
      resolve({ data: null, error: null });
    },
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: table }),
}));

const { POST } = await import("@/app/api/mpesa/callback/route");

function callback(token: string | null, resultCode: number) {
  const url = new URL("https://vibely.test/api/mpesa/callback");
  if (token !== null) url.searchParams.set("t", token);
  return new Request(url, {
    method: "POST",
    body: JSON.stringify({
      Body: {
        stkCallback: {
          CheckoutRequestID: "ws_CO_1",
          ResultCode: resultCode,
          CallbackMetadata: {
            Item: [{ Name: "MpesaReceiptNumber", Value: "QAB123" }],
          },
        },
      },
    }),
  });
}

beforeEach(() => {
  process.env.MPESA_CALLBACK_SECRET = "cb-secret";
  db.payments = [
    {
      id: "p1",
      profile_id: "u1",
      tier: null,
      event_id: "ev1",
      status: "pending",
      mpesa_checkout_id: "ws_CO_1",
    },
  ];
  db.event_bookings = [
    { event_id: "ev1", profile_id: "u1", status: "pending_payment" },
  ];
  db.subscriptions = [];
});

describe("M-Pesa callback", () => {
  it("confirms the booking on a genuine success", async () => {
    const res = await POST(callback("cb-secret", 0));
    expect(res.status).toBe(200);
    expect(db.payments[0].status).toBe("success");
    expect(db.payments[0].mpesa_receipt).toBe("QAB123");
    expect(db.event_bookings[0].status).toBe("confirmed");
  });

  it("refuses a forged callback with the wrong secret", async () => {
    const res = await POST(callback("guess", 0));
    expect(res.status).toBe(401);
    expect(db.payments[0].status).toBe("pending");
    expect(db.event_bookings[0].status).toBe("pending_payment");
  });

  it("fails closed when the secret is not configured", async () => {
    delete process.env.MPESA_CALLBACK_SECRET;
    const res = await POST(callback("", 0));
    expect(res.status).toBe(401);
    expect(db.payments[0].status).toBe("pending");
  });

  it("releases the held seat when payment fails", async () => {
    await POST(callback("cb-secret", 1032));
    expect(db.payments[0].status).toBe("failed");
    expect(db.event_bookings).toHaveLength(0);
  });

  it("ignores a replayed callback once resolved", async () => {
    await POST(callback("cb-secret", 1032));
    await POST(callback("cb-secret", 0));
    expect(db.payments[0].status).toBe("failed");
    expect(db.event_bookings).toHaveLength(0);
  });
});

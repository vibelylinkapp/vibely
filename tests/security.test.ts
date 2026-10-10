import { describe, expect, it } from "vitest";
import {
  asUuid,
  cleanLine,
  cleanText,
  escapeLike,
  isEmail,
  safeLink,
} from "@/lib/security/sanitize";
import { hasBearer, safeEqual } from "@/lib/security/crypto";
import { passwordProblem } from "@/lib/security/password";
import { safeNextPath } from "@/lib/nav/next-path";
import { hit } from "@/lib/security/rate-limit-edge";
import { extFor } from "@/lib/upload";

describe("sanitize", () => {
  it("accepts only canonical UUIDs", () => {
    expect(asUuid("e7e10001-0000-4000-8000-000000000001")).toBe(
      "e7e10001-0000-4000-8000-000000000001"
    );
    expect(asUuid("1 or 1=1")).toBeNull();
    expect(asUuid("e7e10001-0000-4000-8000-00000000000")).toBeNull();
    expect(asUuid(42)).toBeNull();
  });

  it("strips control and invisible characters and caps length", () => {
    expect(cleanText("  hi\u0000\u202Ethere  ")).toBe("hithere");
    expect(cleanText("a".repeat(50), 10)).toHaveLength(10);
    expect(cleanText(undefined)).toBe("");
    expect(cleanLine("one\ntwo")).toBe("one two");
  });

  it("blocks script and protocol-relative links", () => {
    expect(safeLink("javascript:alert(1)")).toBeNull();
    expect(safeLink("JaVaScRiPt:alert(1)")).toBeNull();
    expect(safeLink("data:text/html,x")).toBeNull();
    expect(safeLink("//evil.example")).toBeNull();
    expect(safeLink("/events/1")).toBe("/events/1");
    expect(safeLink("https://vibely.co.ke/x")).toBe("https://vibely.co.ke/x");
  });

  it("escapes LIKE wildcards", () => {
    expect(escapeLike("50%_off")).toBe("50\\%\\_off");
  });

  it("validates email shape", () => {
    expect(isEmail("a@b.co")).toBe(true);
    expect(isEmail("not-an-email")).toBe(false);
  });
});

describe("crypto", () => {
  it("compares secrets safely", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("", "")).toBe(false);
    expect(safeEqual(null, "abc")).toBe(false);
  });

  it("checks bearer tokens", () => {
    const req = new Request("https://x", {
      headers: { authorization: "Bearer s3cret" },
    });
    expect(hasBearer(req, "s3cret")).toBe(true);
    expect(hasBearer(req, "other")).toBe(false);
    expect(hasBearer(req, undefined)).toBe(false);
  });
});

describe("password policy", () => {
  it("rejects weak passwords", () => {
    expect(passwordProblem("short1")).not.toBeNull();
    expect(passwordProblem("1234567890")).not.toBeNull();
    expect(passwordProblem("abcdefghijk")).not.toBeNull();
    expect(passwordProblem("moseslanto99", "moseslanto@x.com")).not.toBeNull();
    expect(passwordProblem("x".repeat(80) + "1")).not.toBeNull();
  });

  it("accepts a reasonable password", () => {
    expect(passwordProblem("Nairobi-sunset-42", "a@b.co")).toBeNull();
  });
});

describe("post-login redirect", () => {
  it("allows only local paths", () => {
    expect(safeNextPath("/home")).toBe("/home");
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("https://evil.example")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
  });
});

describe("edge rate limiter", () => {
  it("blocks after the budget is spent", () => {
    const rule = { max: 3, windowMs: 60_000 };
    const key = `test:${Math.random()}`;
    expect(hit(key, rule)).toBe(0);
    expect(hit(key, rule)).toBe(0);
    expect(hit(key, rule)).toBe(0);
    expect(hit(key, rule)).toBeGreaterThan(0);
  });
});

describe("upload extension", () => {
  it("derives the extension from MIME, not the file name", () => {
    const file = new File(["x"], "photo.html", { type: "image/png" });
    expect(extFor(file)).toBe("png");
    expect(extFor(new Blob(["x"], { type: "text/html" }))).toBe("jpg");
  });
});

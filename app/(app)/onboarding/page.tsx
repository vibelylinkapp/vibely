"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KENYA_COUNTIES } from "@/lib/counties";
import type { Database } from "@/lib/database.types";
import { INTERESTS, MAX_INTERESTS, type Interest } from "@/lib/interests";

type Intent = Database["public"]["Enums"]["intent_t"];
type Gender = Database["public"]["Enums"]["gender_t"];

/** The four core connection types, shown first with a one-line explainer. */
const PRIMARY_INTENTS: { id: Intent; label: string; hint: string }[] = [
  { id: "dating", label: "Dating", hint: "Meet someone special" },
  { id: "friendship", label: "Friendship", hint: "Make new friends" },
  { id: "hangout", label: "Hangouts", hint: "Plans, outings, company" },
  { id: "networking", label: "Networking", hint: "Career and business" },
];

/** Optional, more specific things to do together. */
const MORE_INTENTS: { id: Intent; label: string }[] = [
  { id: "weekend", label: "Weekend plans" },
  { id: "gym", label: "Gym partner" },
  { id: "hiking", label: "Hiking" },
  { id: "coffee", label: "Coffee" },
  { id: "business", label: "Business" },
  { id: "travel", label: "Travel" },
  { id: "movies", label: "Movies" },
  { id: "nightlife", label: "Nightlife" },
];

function ageFrom(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [county, setCounty] = useState("Nairobi");
  const [area, setArea] = useState("");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState("");
  const [intents, setIntents] = useState<Intent[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/sign-in");
      else setReady(true);
    });
  }, [router]);

  function toggleIntent(id: Intent) {
    setIntents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleInterest(id: Interest) {
    setInterests((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_INTERESTS
          ? prev
          : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!displayName.trim()) return setMsg("Please add your name.");
    if (!birthdate || ageFrom(birthdate) < 18)
      return setMsg("You must be at least 18 to use Vibely.");
    if (intents.length === 0)
      return setMsg("Pick at least one thing you're looking for.");

    setSaving(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.replace("/sign-in");
      return;
    }

    const langs = languages
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        birthdate,
        gender: gender ? gender : null,
        county,
        area: area.trim() || null,
        bio: bio.trim() || null,
        languages: langs,
        onboarding_done: true,
      })
      .eq("id", user.id);

    if (pErr) {
      setMsg("We could not save your profile. Please try again.");
      setSaving(false);
      return;
    }

    // Best-effort: interests live in their own update so onboarding still
    // completes on a database where migration 0048 has not run yet.
    if (interests.length > 0) {
      await supabase.from("profiles").update({ interests }).eq("id", user.id);
    }

    await supabase.from("profile_intents").delete().eq("profile_id", user.id);
    const { error: iErr } = await supabase
      .from("profile_intents")
      .insert(intents.map((intent) => ({ profile_id: user.id, intent })));

    if (iErr) {
      setMsg("We could not save what you are looking for. Please try again.");
      setSaving(false);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  if (!ready) {
    return (
      <main className="wrap">
        <p className="sub">Loading...</p>
      </main>
    );
  }

  return (
    <main className="wrap onboard-wrap">
      <div className="glow" />
      <section className="onboard-card">
        <h1 className="auth-title">Set up your profile</h1>
        <p className="auth-sub">
          Takes about a minute. Only your name, age and what you are looking
          for are required; you can change everything later in Profile.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span>Name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should people call you?"
              required
            />
          </label>

          <label className="field">
            <span>Date of birth</span>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              required
            />
            <small className="onboard-hint">
              Only your age is shown, never your date of birth. You must be 18
              or older.
            </small>
          </label>

          <label className="field">
            <span>Gender</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender | "")}
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="nonbinary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="field">
            <span>County</span>
            <select value={county} onChange={(e) => setCounty(e.target.value)}>
              {KENYA_COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Area / neighbourhood</span>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Westlands"
            />
          </label>

          <label className="field">
            <span>Languages</span>
            <input
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Swahili"
            />
          </label>

          <label className="field">
            <span>About you</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="A short bio..."
            />
          </label>

          <div className="field">
            <span>What are you looking for?</span>
            <small className="onboard-hint">
              Pick one or more. People see this on your card, and Discover
              uses it to show you the right people.
            </small>
            <div className="onboard-intents">
              {PRIMARY_INTENTS.map((it) => (
                <button
                  type="button"
                  key={it.id}
                  className={
                    "onboard-intent" + (intents.includes(it.id) ? " on" : "")
                  }
                  aria-pressed={intents.includes(it.id)}
                  onClick={() => toggleIntent(it.id)}
                >
                  <b>{it.label}</b>
                  <small>{it.hint}</small>
                </button>
              ))}
            </div>
            <div className="chips">
              {MORE_INTENTS.map((it) => (
                <button
                  type="button"
                  key={it.id}
                  className={"chip" + (intents.includes(it.id) ? " chip-on" : "")}
                  aria-pressed={intents.includes(it.id)}
                  onClick={() => toggleIntent(it.id)}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>
              Interests <em>optional, up to {MAX_INTERESTS}</em>
            </span>
            <div className="chips">
              {INTERESTS.map((it) => (
                <button
                  type="button"
                  key={it}
                  className={"chip" + (interests.includes(it) ? " chip-on" : "")}
                  aria-pressed={interests.includes(it)}
                  disabled={
                    !interests.includes(it) && interests.length >= MAX_INTERESTS
                  }
                  onClick={() => toggleInterest(it)}
                >
                  {it}
                </button>
              ))}
            </div>
          </div>

          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Finish and continue"}
          </button>
        </form>

        {msg && <p className="auth-msg">{msg}</p>}
      </section>
    </main>
  );
}

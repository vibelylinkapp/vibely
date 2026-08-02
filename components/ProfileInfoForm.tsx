"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KENYA_COUNTIES } from "@/lib/counties";
import type { Database } from "@/lib/database.types";

type Intent = Database["public"]["Enums"]["intent_t"];
type Gender = Database["public"]["Enums"]["gender_t"];

const INTENTS: { id: Intent; label: string }[] = [
  { id: "dating", label: "Dating" },
  { id: "friendship", label: "Friendship" },
  { id: "hangout", label: "Hangout" },
  { id: "weekend", label: "Weekend plans" },
  { id: "gym", label: "Gym partner" },
  { id: "hiking", label: "Hiking" },
  { id: "coffee", label: "Coffee" },
  { id: "networking", label: "Networking" },
  { id: "business", label: "Business" },
  { id: "travel", label: "Travel" },
  { id: "movies", label: "Movies" },
  { id: "nightlife", label: "Nightlife" },
];

export type ProfileInfoInitial = {
  displayName: string;
  handle: string;
  birthdate: string;
  gender: Gender | "";
  county: string;
  area: string;
  bio: string;
  occupation: string;
  education: string;
  languages: string;
  intents: Intent[];
};

// A real, prefilled "edit your information" form. Saves straight to the
// profiles row + profile_intents (client-side, RLS lets you edit your own),
// then refreshes in place — no bounce to the onboarding flow.
export default function ProfileInfoForm({
  userId,
  initial,
}: {
  userId: string;
  initial: ProfileInfoInitial;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [handle, setHandle] = useState(initial.handle);
  const [birthdate, setBirthdate] = useState(initial.birthdate);
  const [gender, setGender] = useState<Gender | "">(initial.gender);
  const [county, setCounty] = useState(initial.county || "Nairobi");
  const [area, setArea] = useState(initial.area);
  const [bio, setBio] = useState(initial.bio);
  const [occupation, setOccupation] = useState(initial.occupation);
  const [education, setEducation] = useState(initial.education);
  const [languages, setLanguages] = useState(initial.languages);
  const [intents, setIntents] = useState<Intent[]>(initial.intents);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleIntent(id: Intent) {
    setOk(false);
    setIntents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setOk(false);

    if (!displayName.trim()) {
      setMsg("Please add your name.");
      return;
    }
    if (intents.length === 0) {
      setMsg("Pick at least one thing you're looking for.");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const langs = languages
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const update: Record<string, unknown> = {
      display_name: displayName.trim(),
      gender: gender ? gender : null,
      county,
      area: area.trim() || null,
      bio: bio.trim() || null,
      occupation: occupation.trim() || null,
      education: education.trim() || null,
      languages: langs,
    };
    if (handle.trim()) update.handle = handle.trim().toLowerCase();
    if (birthdate) update.birthdate = birthdate;

    const { error: pErr } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", userId);
    if (pErr) {
      setMsg(pErr.message);
      setSaving(false);
      return;
    }

    // Replace the interest set with the current selection.
    await supabase.from("profile_intents").delete().eq("profile_id", userId);
    const { error: iErr } = await supabase
      .from("profile_intents")
      .insert(intents.map((intent) => ({ profile_id: userId, intent })));
    if (iErr) {
      setMsg(iErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="pf4-infoform">
      <label className="pf4-if-field">
        <span>Name</span>
        <input
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            setOk(false);
          }}
          placeholder="What should people call you?"
          required
        />
      </label>

      <label className="pf4-if-field">
        <span>Username</span>
        <input
          value={handle}
          onChange={(e) => {
            setHandle(e.target.value);
            setOk(false);
          }}
          placeholder="your_handle"
          autoCapitalize="none"
          autoCorrect="off"
        />
      </label>

      <div className="pf4-if-row">
        <label className="pf4-if-field">
          <span>Work</span>
          <input
            value={occupation}
            onChange={(e) => {
              setOccupation(e.target.value);
              setOk(false);
            }}
            placeholder="e.g. Product Designer"
          />
        </label>
        <label className="pf4-if-field">
          <span>Education</span>
          <input
            value={education}
            onChange={(e) => {
              setEducation(e.target.value);
              setOk(false);
            }}
            placeholder="e.g. BSc Design, UoN"
          />
        </label>
      </div>

      <div className="pf4-if-row">
        <label className="pf4-if-field">
          <span>County</span>
          <select
            value={county}
            onChange={(e) => {
              setCounty(e.target.value);
              setOk(false);
            }}
          >
            {KENYA_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="pf4-if-field">
          <span>Area / neighbourhood</span>
          <input
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setOk(false);
            }}
            placeholder="e.g. Westlands"
          />
        </label>
      </div>

      <div className="pf4-if-row">
        <label className="pf4-if-field">
          <span>Date of birth</span>
          <input
            type="date"
            value={birthdate}
            onChange={(e) => {
              setBirthdate(e.target.value);
              setOk(false);
            }}
          />
        </label>
        <label className="pf4-if-field">
          <span>Gender</span>
          <select
            value={gender}
            onChange={(e) => {
              setGender(e.target.value as Gender | "");
              setOk(false);
            }}
          >
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="nonbinary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <label className="pf4-if-field">
        <span>Languages</span>
        <input
          value={languages}
          onChange={(e) => {
            setLanguages(e.target.value);
            setOk(false);
          }}
          placeholder="English, Swahili"
        />
      </label>

      <label className="pf4-if-field">
        <span>About you</span>
        <textarea
          value={bio}
          onChange={(e) => {
            setBio(e.target.value);
            setOk(false);
          }}
          rows={3}
          placeholder="A short bio..."
        />
      </label>

      <div className="pf4-if-field">
        <span>Looking for</span>
        <div className="pf4-if-chips">
          {INTENTS.map((it) => (
            <button
              type="button"
              key={it.id}
              className={"pf4-if-chip" + (intents.includes(it.id) ? " on" : "")}
              onClick={() => toggleIntent(it.id)}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pf4-if-actions">
        <button className="pf4-if-save" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
        {ok && <span className="pf4-saved">Saved</span>}
      </div>

      {msg && <p className="auth-msg">{msg}</p>}
    </form>
  );
}

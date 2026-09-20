"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "Coffee",
  "Hiking",
  "Movie",
  "Road trip",
  "Nightlife",
  "Sports",
  "Food",
  "Study",
  "Networking",
  "Other",
];

export default function CreatePlan({
  triggerClass,
  triggerContent,
}: {
  triggerClass?: string;
  triggerContent?: React.ReactNode;
} = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [county, setCounty] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [maxPeople, setMaxPeople] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) {
      setError("Give your plan a title.");
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const me = auth.user?.id;
    if (!me) {
      setBusy(false);
      return;
    }
    const { data: plan, error: insErr } = await supabase
      .from("plans")
      .insert({
        host_id: me,
        title: title.trim(),
        category,
        description: description.trim() || null,
        county: county.trim() || null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        max_people: maxPeople ? Number(maxPeople) : null,
      })
      .select("id")
      .single();
    if (insErr || !plan) {
      setError(insErr?.message ?? "Could not create the plan.");
      setBusy(false);
      return;
    }
    // host auto-joins so they're counted as attending
    await supabase
      .from("plan_participants")
      .insert({ plan_id: plan.id, profile_id: me });

    setBusy(false);
    setOpen(false);
    setTitle("");
    setDescription("");
    setCounty("");
    setStartsAt("");
    setMaxPeople("");
    setCategory(CATEGORIES[0]);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={triggerClass ?? "btn"}
        onClick={() => setOpen(true)}
      >
        {triggerContent ?? "Create a plan"}
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create a plan</h3>

            <div className="fld-sec">Basics</div>
            <label className="fld">
              <span className="fld-l">Plan name</span>
              <input
                className="modal-input"
                placeholder="e.g. Saturday hike at Karura"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="fld">
              <span className="fld-l">Category</span>
              <select
                className="modal-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <div className="fld-sec">When</div>
            <label className="fld">
              <span className="fld-l">
                Starts <em>optional</em>
              </span>
              <input
                className="modal-input"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
              <span className="fld-hint">
                Leave empty if the time is still flexible.
              </span>
            </label>

            <div className="fld-sec">Where</div>
            <label className="fld">
              <span className="fld-l">
                County / area <em>optional</em>
              </span>
              <input
                className="modal-input"
                placeholder="e.g. Westlands, Nairobi"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
              />
            </label>

            <div className="fld-sec">Details</div>
            <label className="fld">
              <span className="fld-l">
                Max people <em>optional</em>
              </span>
              <input
                className="modal-input"
                type="number"
                min={2}
                placeholder="No limit"
                value={maxPeople}
                onChange={(e) => setMaxPeople(e.target.value)}
              />
            </label>
            <label className="fld">
              <span className="fld-l">
                What is the plan? <em>optional</em>
              </span>
              <textarea
                className="modal-input"
                rows={3}
                placeholder="Where to meet, what to bring, anything else."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={submit}
                disabled={busy}
              >
                {busy ? "Creating..." : "Create"}
              </button>
            </div>
            {error && <p className="auth-msg">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}

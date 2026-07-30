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

export default function CreatePlan() {
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
      <button type="button" className="btn" onClick={() => setOpen(true)}>
        Create a plan
      </button>

      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create a plan</h3>
            <input
              className="modal-input"
              placeholder="Title (e.g. Saturday hike at Karura)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
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
            <input
              className="modal-input"
              placeholder="County / area (optional)"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
            />
            <input
              className="modal-input"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
            <input
              className="modal-input"
              type="number"
              min={2}
              placeholder="Max people (optional)"
              value={maxPeople}
              onChange={(e) => setMaxPeople(e.target.value)}
            />
            <textarea
              className="modal-input"
              rows={3}
              placeholder="What is the plan? (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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

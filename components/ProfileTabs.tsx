"use client";

import "@/app/profile-plus.css";
import { useState } from "react";

type Photo = { id: string; url: string };

export default function ProfileTabs({
  photos,
  intents,
  bio,
  name,
  place,
  joined,
  isVerified,
  isOnline,
  age,
}: {
  photos: Photo[];
  intents: string[];
  bio: string | null;
  name: string;
  place: string;
  joined: string | null;
  isVerified: boolean;
  isOnline: boolean;
  age: number | null;
}) {
  const tabs: { id: "photos" | "interests" | "about"; label: string }[] = [
    { id: "photos", label: "Photos" },
    { id: "interests", label: "Interests" },
    { id: "about", label: "About" },
  ];
  const [tab, setTab] = useState<"photos" | "interests" | "about">("photos");

  return (
    <div className="pf2-tabs">
      <div className="pf2-tabbar" role="tablist" aria-label="Profile content">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={"pf2-tab" + (tab === t.id ? " on" : "")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "photos" && (
        <div className="pf2-panel" role="tabpanel">
          {photos.length > 0 ? (
            <div className="pf2-grid">
              {photos.map((ph) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={ph.id}
                  src={ph.url}
                  alt=""
                  className="pf2-grid-img"
                  loading="lazy"
                />
              ))}
            </div>
          ) : (
            <p className="pf2-empty">No photos yet.</p>
          )}
        </div>
      )}

      {tab === "interests" && (
        <div className="pf2-panel" role="tabpanel">
          {intents.length > 0 ? (
            <div className="pf2-chips">
              {intents.map((i) => (
                <span className="mini" key={i}>
                  {i}
                </span>
              ))}
            </div>
          ) : (
            <p className="pf2-empty">No interests shared yet.</p>
          )}
        </div>
      )}

      {tab === "about" && (
        <div className="pf2-panel" role="tabpanel">
          {bio ? (
            <p className="pf2-bio">{bio}</p>
          ) : (
            <p className="pf2-empty">{name} has not added a bio yet.</p>
          )}
          <ul className="pf2-facts">
            {age !== null && (
              <li>
                <span>Age</span>
                <b>{age}</b>
              </li>
            )}
            {place && (
              <li>
                <span>Location</span>
                <b>{place}</b>
              </li>
            )}
            <li>
              <span>Status</span>
              <b>{isOnline ? "Online now" : "Offline"}</b>
            </li>
            <li>
              <span>Verified</span>
              <b>{isVerified ? "Yes" : "Not yet"}</b>
            </li>
            {joined && (
              <li>
                <span>Member since</span>
                <b>{joined}</b>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

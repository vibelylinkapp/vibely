"use client";

import "@/app/profile-plus.css";
import { useState } from "react";
import Link from "next/link";

type Media = { id: string; url: string | null; caption: string | null };
type Ev = {
  id: string;
  title: string;
  image_url: string | null;
  category: string | null;
  place: string;
  starts_at: string | null;
  going: number;
};
type About = {
  name: string;
  bio: string | null;
  place: string;
  age: number | null;
  joined: string | null;
  isVerified: boolean;
  isOnline: boolean;
  occupation: string | null;
  education: string | null;
  languages: string[] | null;
};

type TabId = "posts" | "events" | "stories" | "about";

function eventDay(iso: string | null): string {
  if (!iso) return "Date TBA";
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function MediaTile({ m }: { m: Media }) {
  if (m.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.url} alt={m.caption ?? ""} className="pf2-grid-img" loading="lazy" />
    );
  }
  return (
    <span className="pf2-grid-img pf3-text-tile">
      {m.caption ? m.caption.slice(0, 80) : "Post"}
    </span>
  );
}

export default function ProfileFeed({
  posts,
  events,
  stories,
  about,
}: {
  posts: Media[];
  events: Ev[];
  stories: Media[];
  about: About;
}) {
  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "posts", label: "Posts", count: posts.length },
    { id: "events", label: "Events", count: events.length },
    { id: "stories", label: "Stories", count: stories.length },
    { id: "about", label: "About", count: 0 },
  ];
  const [tab, setTab] = useState<TabId>("posts");

  return (
    <div className="pf2-tabs pf3-tabs">
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

      {tab === "posts" && (
        <div className="pf2-panel" role="tabpanel">
          {posts.length > 0 ? (
            <div className="pf2-grid">
              {posts.map((p) => (
                <Link key={p.id} href={`/posts/${p.id}`} className="pf3-tile">
                  <MediaTile m={p} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="pf2-empty">No posts yet.</p>
          )}
        </div>
      )}

      {tab === "events" && (
        <div className="pf2-panel" role="tabpanel">
          {events.length > 0 ? (
            <div className="pf3-evlist">
              {events.map((e) => (
                <Link key={e.id} href={`/events/${e.id}`} className="pf3-ev">
                  <span
                    className="pf3-ev-ph"
                    style={
                      e.image_url
                        ? { backgroundImage: `url('${e.image_url}')` }
                        : undefined
                    }
                  >
                    {e.category && <span className="pf3-ev-cat">{e.category}</span>}
                  </span>
                  <span className="pf3-ev-main">
                    <b className="pf3-ev-title">{e.title}</b>
                    <span className="pf3-ev-sub">
                      {eventDay(e.starts_at)}
                      {e.place ? ` \u00b7 ${e.place}` : ""}
                    </span>
                    <span className="pf3-ev-going">{e.going} going</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="pf2-empty">No events hosted yet.</p>
          )}
        </div>
      )}

      {tab === "stories" && (
        <div className="pf2-panel" role="tabpanel">
          {stories.length > 0 ? (
            <div className="pf2-grid">
              {stories.map((s) => (
                <span key={s.id} className="pf3-tile">
                  <MediaTile m={s} />
                </span>
              ))}
            </div>
          ) : (
            <p className="pf2-empty">No active stories.</p>
          )}
        </div>
      )}

      {tab === "about" && (
        <div className="pf2-panel" role="tabpanel">
          {about.bio ? (
            <p className="pf2-bio">{about.bio}</p>
          ) : (
            <p className="pf2-empty">{about.name} has not added a bio yet.</p>
          )}
          <ul className="pf2-facts">
            {about.age !== null && (
              <li>
                <span>Age</span>
                <b>{about.age}</b>
              </li>
            )}
            {about.place && (
              <li>
                <span>Location</span>
                <b>{about.place}</b>
              </li>
            )}
            {about.occupation && (
              <li>
                <span>Work</span>
                <b>{about.occupation}</b>
              </li>
            )}
            {about.education && (
              <li>
                <span>Education</span>
                <b>{about.education}</b>
              </li>
            )}
            {about.languages && about.languages.length > 0 && (
              <li>
                <span>Languages</span>
                <b>{about.languages.join(", ")}</b>
              </li>
            )}
            <li>
              <span>Status</span>
              <b>{about.isOnline ? "Online now" : "Offline"}</b>
            </li>
            <li>
              <span>Verified</span>
              <b>{about.isVerified ? "Yes" : "Not yet"}</b>
            </li>
            {about.joined && (
              <li>
                <span>Member since</span>
                <b>{about.joined}</b>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

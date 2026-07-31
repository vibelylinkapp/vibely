import Link from "next/link";

export type EventCardData = {
  id: string;
  title: string;
  image_url: string | null;
  category: string | null;
  venue: string | null;
  area: string | null;
  city: string;
  country: string;
  price_kes: number;
  starts_at: string | null;
  going: number;
};

function fmtWhen(iso: string | null): string {
  if (!iso) return "Date TBA";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }) +
    " \u00b7 " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

function fmtPrice(kes: number): string {
  return kes > 0 ? `KSh ${kes.toLocaleString("en-KE")}` : "Free";
}

function place(e: EventCardData): string {
  const base = [e.area, e.city].filter(Boolean).join(", ") || e.city;
  return e.country && e.country !== "Kenya" ? `${base}, ${e.country}` : base;
}

export default function EventCard({
  e,
  variant = "list",
}: {
  e: EventCardData;
  variant?: "list" | "rail";
}) {
  const bg = e.image_url ? { backgroundImage: `url('${e.image_url}')` } : undefined;

  if (variant === "rail") {
    return (
      <Link className="placecard" href={`/events/${e.id}`}>
        <div className="ph" style={bg}>
          {e.category && <span className="badge">{e.category}</span>}
          <span className="live">{e.going} going</span>
        </div>
        <div className="body">
          <b>{e.title}</b>
          <small>
            {place(e)} &middot; {fmtWhen(e.starts_at)}
          </small>
        </div>
      </Link>
    );
  }

  return (
    <Link className="eventcard" href={`/events/${e.id}`}>
      <div className="ph" style={bg}>
        <div className="price">{fmtPrice(e.price_kes)}</div>
        {e.category && <span className="badge">{e.category}</span>}
      </div>
      <div className="b">
        <b>{e.title}</b>
        <div className="meta">
          <span>&#128205; {place(e)}</span>
          <span>&#128336; {fmtWhen(e.starts_at)}</span>
        </div>
        <div className="going">
          <small>{e.going} going</small>
        </div>
      </div>
    </Link>
  );
}

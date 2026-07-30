import ProfileActions from "@/components/ProfileActions";
import LikeButton from "@/components/LikeButton";

type P = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  county: string | null;
  area: string | null;
  birthdate: string | null;
  is_online: boolean;
  is_verified: boolean | null;
};

function ageFrom(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

export default function ProfileCard({
  p,
  intents,
}: {
  p: P;
  intents: string[];
}) {
  const age = p.birthdate ? ageFrom(p.birthdate) : null;
  const meta = [age ? String(age) : null, p.county].filter(Boolean).join(" · ");

  return (
    <div className="pcard">
      <div className="pcard-photo">
        {p.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.avatar_url} alt={p.display_name} />
        ) : (
          <span className="pcard-initial">
            {p.display_name.charAt(0).toUpperCase()}
          </span>
        )}
        {p.is_online && <span className="pcard-dot" />}
      </div>
      <div className="pcard-body">
        <div className="pcard-name">
          {p.display_name}
          {p.is_verified && (
            <svg width="14" height="14" viewBox="0 0 24 24" aria-label="Verified">
              <circle cx="12" cy="12" r="12" fill="#FFB020" />
              <path
                d="M7 12.5l3 3 7-7"
                fill="none"
                stroke="#12151D"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        {meta && <div className="pcard-meta">{meta}</div>}
        {intents.length > 0 && (
          <div className="pcard-intents">
            {intents.slice(0, 3).map((i) => (
              <span className="mini" key={i}>
                {i}
              </span>
            ))}
          </div>
        )}
        <LikeButton targetId={p.id} targetName={p.display_name} />
        <ProfileActions targetId={p.id} targetName={p.display_name} />
      </div>
    </div>
  );
}

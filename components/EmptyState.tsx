import type { ReactNode } from "react";

// Shared empty state. The Events tab got a proper one in #54; Nearby and
// Plans were still single lines of grey text. With the seeded demo data
// purged these are the screens a new member is most likely to land on, so
// they need to explain the situation rather than look broken.
export default function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="emp">
      {icon && (
        <div className="emp-ic" aria-hidden="true">
          {icon}
        </div>
      )}
      <h4>{title}</h4>
      <p>{body}</p>
      {action}
    </div>
  );
}

type Datum = { label: string; value: number };

// Lightweight CSS bar chart (no external chart dependency).
export default function BarChart({
  data,
  horizontal = false,
}: {
  data: Datum[];
  horizontal?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (horizontal) {
    return (
      <div className="hbars">
        {data.map((d, i) => (
          <div className="hbar-row" key={i}>
            <span className="hbar-label">{d.label}</span>
            <div className="hbar-track">
              <div
                className="hbar-fill"
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
            <span className="hbar-val">{d.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="vbars">
      {data.map((d, i) => (
        <div className="vbar-col" key={i}>
          <div
            className="vbar"
            style={{ height: `${(d.value / max) * 100}%` }}
            title={String(d.value)}
          />
          <span className="vbar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

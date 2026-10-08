// Short safety reminder shown when someone asks for a WhatsApp number,
// reveals one, or opens a chat. Kept in one place so the wording stays
// consistent everywhere it appears.
export default function SafetyNotice({ className }: { className?: string }) {
  return (
    <p className={"safety-note" + (className ? " " + className : "")} role="note">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <span>
        <b>Stay safe.</b> Never share passwords, financial information, or send
        money to someone you just met.
      </span>
    </p>
  );
}

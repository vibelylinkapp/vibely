/**
 * Renders schema.org structured data.
 *
 * `<` is escaped as \\u003c so no string inside the data can ever close the
 * script tag early (the classic JSON-in-HTML XSS). The data itself is static,
 * built in lib/seo.ts, never from user input.
 */
export default function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

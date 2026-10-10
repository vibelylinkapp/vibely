import type { Metadata } from "next";
import { SITE } from "@/lib/site";
import { SITE_URL } from "@/lib/env";

/**
 * SEO source of truth: keywords, page metadata helpers and schema.org
 * structured data. Keep copy here in step with what the pages actually say -
 * Google ignores (and can penalise) structured data that is not visible.
 */

export const SEO_TITLE = "Vibely - Dating App in Kenya | Meet Singles & Friends Near You";
export const SEO_DESCRIPTION =
  "Vibely is the Kenyan dating and social app to meet real, verified people near you in Nairobi, Mombasa, Kisumu, Nakuru and across East Africa. Date, make friends, join events and hangouts. Free to join, pay with M-Pesa.";

/** Researched around how people in Kenya actually search (Google Trends KE). */
export const SEO_KEYWORDS = [
  "dating app Kenya",
  "Kenyan dating site",
  "best dating app in Kenya",
  "free dating app Kenya",
  "Nairobi dating",
  "dating in Nairobi",
  "meet singles in Nairobi",
  "Nairobi singles",
  "Mombasa dating",
  "Kisumu dating",
  "Nakuru dating",
  "Eldoret dating",
  "meet people near me Kenya",
  "make friends in Nairobi",
  "friendship app Kenya",
  "hookup app Kenya alternative",
  "serious relationships Kenya",
  "verified dating app Kenya",
  "safe dating Kenya",
  "events in Nairobi this weekend",
  "things to do in Nairobi",
  "Nairobi hangouts",
  "networking events Nairobi",
  "East Africa dating app",
  "Uganda dating app",
  "Tanzania dating app",
  "M-Pesa dating app",
  "African dating app",
  "Vibely",
  "Vibely Kenya",
];

export const FAQS: Array<{ q: string; a: string }> = [
  {
    q: "Is Vibely free to use?",
    a: "Yes. Creating an account, building your profile, discovering people near you, matching and chatting are free. Optional Plus, Gold and VIP plans unlock extras such as unlimited likes and profile boosts, and can be paid with M-Pesa.",
  },
  {
    q: "Which cities in Kenya does Vibely work in?",
    a: "Vibely works across all 47 counties, with the most members in Nairobi, Mombasa, Kisumu, Nakuru and Eldoret. It is also open to members in Uganda, Tanzania and Rwanda.",
  },
  {
    q: "Is Vibely only for dating?",
    a: "No. You choose what you are looking for: dating, friendship, hangouts or professional networking. You can also discover and book local events and join group plans.",
  },
  {
    q: "How does Vibely keep members safe?",
    a: "Members can verify their profile with a selfie, block and report anyone, and control who sees their location. Messaging opens only after a mutual match, and our team reviews every report.",
  },
  {
    q: "Can I pay with M-Pesa?",
    a: "Yes. Memberships and paid event tickets are paid with M-Pesa through a secure STK push prompt on your phone. Vibely never sees or stores your M-Pesa PIN.",
  },
  {
    q: "How old do I need to be to join Vibely?",
    a: `You must be at least ${SITE.minAge} years old to create a Vibely account.`,
  },
];

/** Build page metadata with a canonical URL and matching OG/Twitter tags. */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE.name,
      locale: "en_KE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
    },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
  };
}

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

/** Site-wide graph: Organization + WebSite + the app itself. */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: SITE.name,
        legalName: SITE.legalEntity,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icons/icon-512.png`,
          width: 512,
          height: 512,
        },
        email: SITE.contactEmail,
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE.city,
          addressCountry: "KE",
        },
        areaServed: ["KE", "UG", "TZ", "RW"],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: SITE.supportEmail,
          areaServed: "KE",
          availableLanguage: ["English", "Swahili"],
        },
      },
      {
        "@type": "WebSite",
        "@id": SITE_ID,
        url: SITE_URL,
        name: SITE.name,
        alternateName: ["Vibely Kenya", "Vibely Dating App"],
        description: SEO_DESCRIPTION,
        inLanguage: "en-KE",
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE.name,
        url: SITE_URL,
        applicationCategory: "SocialNetworkingApplication",
        applicationSubCategory: "Dating",
        operatingSystem: "Web, Android, iOS",
        browserRequirements: "Requires JavaScript. Works in any modern browser.",
        description: SEO_DESCRIPTION,
        inLanguage: "en-KE",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "KES",
          category: "free",
        },
        featureList: [
          "Meet verified people near you",
          "Dating, friendship, hangouts and networking modes",
          "Nearby discovery by distance",
          "Local events and ticket booking with M-Pesa",
          "Group plans and hangouts",
          "Private chat after a mutual match",
          "Selfie verification, blocking and reporting",
        ],
        audience: {
          "@type": "PeopleAudience",
          suggestedMinAge: SITE.minAge,
          geographicArea: { "@type": "Country", name: "Kenya" },
        },
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

/** FAQPage schema - mirrors the FAQ section rendered on the landing page. */
export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Breadcrumbs for the content pages (about, safety, privacy, terms). */
export function breadcrumbJsonLd(name: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE.name, item: SITE_URL },
      { "@type": "ListItem", position: 2, name, item: `${SITE_URL}${path}` },
    ],
  };
}

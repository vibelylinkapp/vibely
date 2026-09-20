import type { Metadata } from "next";
import DocPage from "@/components/DocPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — Vibely",
  description:
    "Exactly what personal data Vibely stores, why, who it is shared with, how long it is kept, and the rights you have under Kenya's Data Protection Act, 2019.",
};

export default function Privacy() {
  return (
    <DocPage
      title="Privacy Policy"
      intro={`This describes what ${SITE.name} actually stores about you, and what you can do about it. Where something is still a gap, we say so rather than promising it.`}
      updated={SITE.lastUpdated}
    >
      <h2>1. Who we are</h2>
      <p>
        {SITE.legalEntity} operates the {SITE.name} app and website from{" "}
        {SITE.city}, {SITE.country}, and is the data controller for the personal
        data described here. Reach us at{" "}
        <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a> for
        anything on this page.
      </p>

      <h2>2. What we collect</h2>

      <h3>Sign-in details</h3>
      <p>
        You sign up with a phone number or with Google. Your phone number or
        email address and your authentication records are held by Supabase Auth,
        our authentication provider. They are not stored on your public profile
        and are never shown to other members.
      </p>

      <h3>Your profile</h3>
      <p>
        Whatever you choose to fill in: display name, handle, bio, date of
        birth, gender, occupation, education, languages, religion, height,
        county and area, profile photo, cover photo, gallery photos,
        highlights, and the intents you select (dating, friendship, hangout,
        networking and so on).
      </p>

      <h3>Location</h3>
      <p>
        If you allow it, we store a precise geographic point for your profile.
        We use it to rank people, events and plans by distance and to build the
        area heatmap. Other members are shown an approximate distance to you,
        never your coordinates. Turning off &ldquo;Show my location&rdquo; in
        your privacy settings removes you from People Nearby and the map
        entirely.
      </p>

      <h3>What you do in the app</h3>
      <p>
        Likes, passes, matches, follows, profile views (we record who viewed
        whose profile, so the feature that shows you can work), messages
        including voice notes and media, message reactions, read receipts,
        posts, comments, post likes, stories, plans you host or join, events you
        create or book, and check-ins.
      </p>

      <h3>Verification</h3>
      <p>
        If you verify your profile you submit a selfie, and for the higher
        verification levels a national ID or passport image. These are stored in
        a private storage bucket that other members cannot read, and are
        reviewed by our admin team, who record an approval or rejection and an
        internal note.
      </p>

      <h3>Your WhatsApp number</h3>
      <p>
        Held separately from your profile, readable only by you. If you signed
        up with a phone number, that number was used to pre-fill this field. It
        is revealed to another member only after you have matched and you have
        explicitly approved their request for it.
      </p>

      <h3>Payments</h3>
      <p>
        When you pay through M-Pesa we store the amount in KES, the phone number
        that paid, the Safaricom checkout request ID, the M-Pesa receipt number,
        the status, the tier purchased, and the full callback payload Safaricom
        sends us. We never see or store your M-Pesa PIN.
      </p>

      <h3>Notifications and technical data</h3>
      <p>
        If you enable push notifications we store your browser push endpoint and
        keys. Our hosting and database providers process IP addresses, device
        and browser information and server logs in the ordinary course of
        serving the site.
      </p>

      <h3>Safety and support records</h3>
      <p>
        Reports you make or that are made about you, including the reason and
        any detail you add; moderation decisions and the admin actions log;
        blocks; automated flags on messages; and any feedback or rating you
        submit through the in-app feedback form.
      </p>

      <h2>3. Why we use it</h2>
      <ul>
        <li>To run your account and show your profile to other members.</li>
        <li>To rank people, events and plans by distance.</li>
        <li>To deliver matches, messages and notifications.</li>
        <li>To verify accounts and review reports.</li>
        <li>To take payment for subscriptions and boosts through M-Pesa.</li>
        <li>To enforce free-tier limits and paid-tier entitlements.</li>
        <li>To fix problems and improve the product.</li>
        <li>To meet legal obligations and respond to lawful requests.</li>
      </ul>
      <p>
        Under the Data Protection Act, 2019 we rely on your consent (location,
        photos, verification documents, push notifications), performance of our
        contract with you (running the service and taking payment), our
        legitimate interests (safety, moderation, fraud prevention and product
        improvement), and legal obligation where it applies. You can withdraw
        consent at any time, in your settings or by emailing us.
      </p>

      <h2>4. What other members can see</h2>
      <p>
        Your profile content, photos, highlights, stories, posts and an
        approximate distance, subject to your settings. Two toggles are in your
        control today: whether your location is shown at all, and whether your
        verified badge is displayed.
      </p>
      <p>
        Never visible to other members: your exact coordinates, your sign-in
        phone number or email, your payment records, your verification selfie or
        ID documents, and your WhatsApp number unless you have approved a
        specific request for it.
      </p>

      <h2>5. Who we share data with</h2>
      <p>
        We do not sell your personal data and we do not share it for
        advertising. Our processors are:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — database, authentication, file storage and
          realtime messaging.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting, delivery and logs.
        </li>
        <li>
          <strong>Safaricom (M-Pesa Daraja)</strong> — payment processing.
        </li>
        <li>
          <strong>Browser push services</strong> operated by Google, Apple and
          Mozilla — delivery of the notifications you opted into.
        </li>
      </ul>
      <p>
        We also disclose data to law enforcement or regulators where we are
        legally required to, or where it is necessary to protect someone from
        serious harm.
      </p>

      <h2>6. Transfers outside Kenya</h2>
      <p>
        Supabase and Vercel may store or process data on servers outside Kenya.
        Where that happens we rely on the safeguards permitted by the Data
        Protection Act, 2019, including the contractual protections in each
        provider&apos;s data processing terms.
      </p>

      <h2>7. How long we keep it</h2>
      <p>Being straightforward about this, because some of it may surprise you:</p>
      <ul>
        <li>
          <strong>Profile and activity</strong> are kept for as long as your
          account exists.
        </li>
        <li>
          <strong>Stories</strong> stop being shown to other members 24 hours
          after posting, but the record and the uploaded file are retained until
          the account is deleted. They are hidden, not erased.
        </li>
        <li>
          <strong>Deleted messages</strong> are marked as deleted and hidden
          from the conversation. The underlying row is retained.
        </li>
        <li>
          <strong>Payment records</strong> are kept for tax and accounting
          purposes even after an account is closed.
        </li>
        <li>
          <strong>Reports and moderation records</strong> are kept after an
          account is removed, so that the same person cannot immediately return.
        </li>
      </ul>
      <p>
        We do not currently run automated jobs that purge old data on a
        schedule. Adding scheduled deletion for expired stories and closed
        accounts is on our roadmap.
      </p>

      <h2>8. Deleting your account</h2>
      <p>
        You can delete your account yourself, at any time, from{" "}
        <strong>Account &amp; settings</strong> on your profile. You type
        DELETE to confirm, and it happens immediately — we do not queue it,
        hold it for a cooling-off period, or ask you to email anyone.
      </p>
      <p>
        Deleting removes your profile, photos, cover image, gallery,
        highlights, stories, posts, comments, messages and voice notes, likes,
        matches, follows, plans, event bookings, check-ins, verification
        documents, push subscriptions and your saved WhatsApp number. The
        uploaded files themselves are removed from storage, not just the
        database rows pointing at them. You cannot sign back in afterwards and
        we cannot restore it.
      </p>
      <p>Two things survive, and only these:</p>
      <ul>
        <li>
          <strong>Payment records</strong>, which are detached from your
          profile but kept for tax and accounting purposes.
        </li>
        <li>
          <strong>Reports made about your account</strong>, reduced to your
          display name, handle, county and the date of deletion, so that
          someone removed for abusing others cannot immediately return with a
          clean record.
        </li>
      </ul>
      <p>
        We also keep a deletion log entry: an internal record that a deletion
        happened, when, and a one-way hash of your sign-in identifier. The hash
        cannot be reversed into your phone number or email.
      </p>
      <p>
        If you would rather we did it for you, email{" "}
        <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a> from the
        address or phone number on the account and we will action it within{" "}
        {SITE.dataRequestDays} days.
      </p>

      <h2>9. Your rights</h2>
      <p>Under the Data Protection Act, 2019 you have the right to:</p>
      <ul>
        <li>be told how your data is used, which is the purpose of this page;</li>
        <li>access a copy of the data we hold about you;</li>
        <li>have inaccurate or incomplete data corrected;</li>
        <li>have your data deleted;</li>
        <li>object to or restrict certain processing;</li>
        <li>withdraw consent at any time;</li>
        <li>receive your data in a portable format.</li>
      </ul>
      <p>
        Email <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a>{" "}
        and we will respond within {SITE.dataRequestDays} days. If you are not
        satisfied with our response you can complain to the Office of the Data
        Protection Commissioner of Kenya.
      </p>

      <h2>10. Security</h2>
      <p>
        Traffic is encrypted in transit. Access to your data is enforced in the
        database itself through row-level security policies, so one member
        cannot read another member&apos;s private records. Verification
        documents sit in a private storage bucket rather than a public one.
        Administrative access is restricted and the moderation panel is not
        reachable at a guessable address.
      </p>
      <p>
        No system is perfectly secure. Tell us immediately if you think someone
        else has access to your account.
      </p>

      <h2>11. Children</h2>
      <p>
        {SITE.name} is for people aged {SITE.minAge} and over. The age limit is
        enforced in our database, which rejects any profile with a date of birth
        under {SITE.minAge}. If you believe an under-age person holds an
        account, report it and we will remove it.
      </p>

      <h2>12. Cookies</h2>
      <p>
        We use cookies only to keep you signed in and to remember your
        preferences. We do not use advertising cookies and we do not run
        third-party analytics or tracking scripts.
      </p>

      <h2>13. Automated decisions</h2>
      <p>
        Messages may be automatically flagged for review by a moderator. No
        account is suspended or removed purely by an automated process — a
        person reviews it first.
      </p>

      <h2>14. Changes to this policy</h2>
      <p>
        If we make a material change we will tell you in the app or by email
        before it takes effect. The date at the top of this page always shows
        the current version.
      </p>

      <h2>15. Contact</h2>
      <p>
        <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a> —{" "}
        {SITE.legalEntity}, {SITE.city}, {SITE.country}.
      </p>
    </DocPage>
  );
}

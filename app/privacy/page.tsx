import type { Metadata } from "next";
import DocPage from "@/components/DocPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — Vibely",
  description:
    "What personal data Vibely collects, why we collect it, who we share it with, and the rights you have under Kenya's Data Protection Act.",
};

export default function Privacy() {
  return (
    <DocPage
      title="Privacy Policy"
      intro={`This policy explains what ${SITE.name} collects about you, why, and what you can do about it.`}
      updated={SITE.lastUpdated}
    >
      <h2>1. Who we are</h2>
      <p>
        {SITE.legalEntity} operates the {SITE.name} app and website from{" "}
        {SITE.city}, {SITE.country}, and is the data controller for the personal
        data described here. You can reach our privacy contact at{" "}
        <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a>.
      </p>

      <h2>2. What we collect</h2>
      <ul>
        <li>
          <strong>Account details.</strong> Your phone number or email address,
          and authentication records, so you can sign in.
        </li>
        <li>
          <strong>Profile content.</strong> Your name or display name, age or
          date of birth, gender, what you are looking for, bio, interests,
          photos, stories and highlights. You choose what to put here.
        </li>
        <li>
          <strong>Location.</strong> Approximate location, used to show you
          people, events and plans nearby and to show others an approximate
          distance to you. We never show your exact coordinates to other users.
        </li>
        <li>
          <strong>Activity.</strong> Likes, passes, matches, follows, messages,
          voice notes, posts, comments, event bookings, plans you join, and
          check-ins.
        </li>
        <li>
          <strong>Verification data.</strong> Material you submit to verify your
          profile, such as a selfie, used to confirm you are a real person.
        </li>
        <li>
          <strong>Payments.</strong> When you subscribe or buy a boost through
          M-Pesa, we receive the transaction reference, amount, status and the
          paying phone number from Safaricom. We never see or store your M-Pesa
          PIN.
        </li>
        <li>
          <strong>Device and technical data.</strong> IP address, device and
          browser type, push notification tokens, and log data such as error
          reports and access times.
        </li>
        <li>
          <strong>Reports and moderation records.</strong> Reports you make or
          that are made about you, and the outcome.
        </li>
      </ul>

      <h2>3. Why we use it</h2>
      <ul>
        <li>To create and run your account and show your profile to other users.</li>
        <li>To show you relevant people, events and plans near you.</li>
        <li>To deliver messages, matches and notifications.</li>
        <li>To verify accounts, detect fraud, and moderate abuse.</li>
        <li>To process subscriptions and boosts through M-Pesa.</li>
        <li>To fix problems, measure what works, and improve the product.</li>
        <li>To meet legal obligations and respond to lawful requests.</li>
      </ul>
      <p>
        Under the Data Protection Act, 2019, we rely on your consent (for
        location, photos and notifications), the performance of our contract
        with you (running the service), our legitimate interests (safety,
        moderation and improving the product), and legal obligation where
        applicable.
      </p>

      <h2>4. What other people can see</h2>
      <p>
        Your profile content, photos and approximate distance are visible to
        other {SITE.name} users in line with your privacy settings. Your exact
        location, phone number, email address and payment details are never
        shown to other users. You can restrict distance and visibility at any
        time in your privacy settings.
      </p>

      <h2>5. Who we share data with</h2>
      <p>We do not sell your personal data. We share it only with:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — database, authentication, file storage and
          realtime messaging infrastructure.
        </li>
        <li>
          <strong>Vercel</strong> — application hosting and delivery.
        </li>
        <li>
          <strong>Safaricom (M-Pesa Daraja)</strong> — payment processing for
          subscriptions and boosts.
        </li>
        <li>
          <strong>Push notification services</strong> — to deliver the
          notifications you have opted into.
        </li>
        <li>
          <strong>Law enforcement or regulators</strong> — where we are legally
          required to, or where it is necessary to protect someone from harm.
        </li>
      </ul>

      <h2>6. Transfers outside Kenya</h2>
      <p>
        Some of these providers store or process data on servers outside Kenya.
        Where that happens we rely on the safeguards permitted by the Data
        Protection Act, 2019, including contractual protections with each
        provider.
      </p>

      <h2>7. How long we keep it</h2>
      <p>
        We keep your profile and activity for as long as your account is open.
        When you delete your account we delete or anonymise your profile,
        photos and posts within 30 days, except where we must keep records
        longer — payment records for tax and accounting purposes, and
        moderation records where an account was removed for abuse, which we
        retain to stop the same person returning.
      </p>

      <h2>8. Your rights</h2>
      <p>Under the Data Protection Act, 2019 you have the right to:</p>
      <ul>
        <li>be told how your data is used, which is what this page is for;</li>
        <li>access a copy of the data we hold about you;</li>
        <li>correct data that is wrong or incomplete;</li>
        <li>ask us to delete your data;</li>
        <li>object to or restrict certain processing;</li>
        <li>withdraw consent at any time, including for location and notifications;</li>
        <li>receive your data in a portable format.</li>
      </ul>
      <p>
        Email <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a> to
        exercise any of these. We respond within 30 days. If you are not
        satisfied, you can complain to the Office of the Data Protection
        Commissioner of Kenya.
      </p>

      <h2>9. Deleting your account</h2>
      <p>
        You can delete your account from your profile settings in the app, or by
        emailing <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a>{" "}
        from the address on the account.
      </p>

      <h2>10. Security</h2>
      <p>
        Data is encrypted in transit, access to production systems is
        restricted, and database access is governed by row-level security rules.
        No system is perfectly secure, so please use a strong sign-in method and
        tell us immediately if you think your account has been accessed by
        someone else.
      </p>

      <h2>11. Children</h2>
      <p>
        {SITE.name} is strictly for people aged {SITE.minAge} and over. We do
        not knowingly collect data from anyone younger. If you believe an
        under-age person has an account, report it and we will remove it.
      </p>

      <h2>12. Cookies and similar technology</h2>
      <p>
        We use cookies and local storage to keep you signed in and to remember
        your preferences. We do not use third-party advertising cookies.
      </p>

      <h2>13. Changes to this policy</h2>
      <p>
        If we make a material change we will tell you in the app or by email
        before it takes effect. The date at the top of this page always shows
        the current version.
      </p>

      <h2>14. Contact</h2>
      <p>
        <a href={`mailto:${SITE.privacyEmail}`}>{SITE.privacyEmail}</a> —{" "}
        {SITE.legalEntity}, {SITE.city}, {SITE.country}.
      </p>
    </DocPage>
  );
}

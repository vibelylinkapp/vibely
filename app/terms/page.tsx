import type { Metadata } from "next";
import DocPage from "@/components/DocPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service — Vibely",
  description:
    "The rules for using Vibely: eligibility, acceptable use, subscriptions and payments, and how accounts can be ended.",
};

export default function Terms() {
  return (
    <DocPage
      title="Terms of Service"
      intro={`These terms are the agreement between you and ${SITE.legalEntity} when you use ${SITE.name}.`}
      updated={SITE.lastUpdated}
    >
      <h2>1. Agreeing to these terms</h2>
      <p>
        By creating an account or using {SITE.name} you accept these terms. If
        you do not accept them, do not use the service.
      </p>

      <h2>2. Who can use Vibely</h2>
      <p>
        You must be at least {SITE.minAge} years old, legally able to enter a
        contract, and not previously removed from {SITE.name}. You must not be
        subject to any court order or registry restricting your contact with
        others. Accounts found to belong to under-age users are removed without
        notice.
      </p>

      <h2>3. Your account</h2>
      <p>
        One account per person. Your information must be accurate and about you
        — real photos, your real age. Keep your sign-in details private; you are
        responsible for activity on your account. Tell us at once if you think
        someone else has access.
      </p>

      <h2>4. How you must behave</h2>
      <p>You agree not to:</p>
      <ul>
        <li>impersonate anyone, or use photos of a person who is not you;</li>
        <li>harass, threaten, stalk, bully or intimidate anyone;</li>
        <li>post or send sexual content involving minors, or content that sexualises minors in any way;</li>
        <li>send unsolicited sexual images;</li>
        <li>post content that is hateful, violent, or incites harm against any group;</li>
        <li>solicit money, investment, donations, or use the service for commercial promotion, prostitution or trafficking;</li>
        <li>run scams of any kind, including romance, crypto, forex and betting scams;</li>
        <li>share other people&apos;s private information without their consent;</li>
        <li>scrape, reverse engineer, overload or attempt to break the service;</li>
        <li>use bots, or create accounts by automated means.</li>
      </ul>
      <p>
        Breaking these rules can end your account immediately and without a
        refund. Serious cases are reported to the authorities.
      </p>

      <h2>5. Your content</h2>
      <p>
        You keep ownership of everything you post. You grant us a
        non-exclusive, worldwide, royalty-free licence to host, store, display
        and distribute that content for the purpose of operating {SITE.name}.
        This licence ends when you delete the content or your account, except
        for copies we must keep for legal or moderation reasons, and for content
        others have already shared onward.
      </p>
      <p>
        We may remove content that breaks these terms, and we may limit or
        suspend accounts while we investigate a report.
      </p>

      <h2>6. Meeting people is at your own risk</h2>
      <p>
        {SITE.name} does not conduct criminal background checks on users. Profile
        verification confirms that an account belongs to a real person; it is
        not a guarantee of anyone&apos;s character, intentions or identity
        claims. You are solely responsible for your interactions with other
        users, online and in person. Please read our{" "}
        <a href="/safety">safety guidance</a> before meeting anyone.
      </p>

      <h2>7. Subscriptions, boosts and payments</h2>
      <ul>
        <li>
          {SITE.name} is free to join. Some features are paid, and prices are
          shown in Kenyan Shillings before you pay.
        </li>
        <li>
          Payments are processed through M-Pesa. By paying you authorise the
          charge to the phone number you provide.
        </li>
        <li>
          Subscriptions run for the period you buy and do not auto-renew unless
          we tell you clearly at the point of purchase.
        </li>
        <li>
          Digital purchases are generally non-refundable once the benefit has
          been delivered. If you were charged in error or a paid feature did not
          work, email{" "}
          <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> within
          14 days and we will put it right.
        </li>
        <li>
          Benefits are tied to your account. If your account is ended for
          breaking these terms, unused paid time is forfeited.
        </li>
        <li>We may change prices, with notice before your next purchase.</li>
      </ul>

      <h2>8. Ending your account</h2>
      <p>
        You can delete your account at any time from your settings. We may
        suspend or end your account if you break these terms, if we are required
        to by law, or if continuing would create a risk to other users. Where it
        is reasonable and lawful to do so, we will tell you why.
      </p>

      <h2>9. Service availability</h2>
      <p>
        {SITE.name} is provided as is. We work to keep it running but we do not
        promise uninterrupted or error-free service, and we may change or
        discontinue features.
      </p>

      <h2>10. Our liability</h2>
      <p>
        To the fullest extent permitted by Kenyan law, {SITE.legalEntity} is not
        liable for indirect or consequential loss, for the conduct of other
        users whether online or offline, or for loss of data or profit. Nothing
        in these terms excludes liability that cannot lawfully be excluded. Where
        liability cannot be excluded, it is limited to the amount you paid us in
        the twelve months before the claim.
      </p>

      <h2>11. Disputes and governing law</h2>
      <p>
        These terms are governed by the laws of Kenya, and the courts of Kenya
        have jurisdiction. Before starting a formal dispute, please contact us
        at <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> — most
        things are resolved faster that way.
      </p>

      <h2>12. Changes to these terms</h2>
      <p>
        We may update these terms. If a change is material we will notify you in
        the app or by email before it takes effect. Continuing to use{" "}
        {SITE.name} after that means you accept the new terms.
      </p>

      <h2>13. Contact</h2>
      <p>
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> —{" "}
        {SITE.legalEntity}, {SITE.city}, {SITE.country}.
      </p>
    </DocPage>
  );
}

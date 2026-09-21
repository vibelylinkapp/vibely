import type { Metadata } from "next";
import DocPage from "@/components/DocPage";
import { SITE } from "@/lib/site";
import { TIER_PRICES, SUBSCRIPTION_DAYS } from "@/lib/tiers";
import { FREE_DAILY_LIKE_LIMIT, BOOST_QUOTA } from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "Terms of Service — Vibely",
  description:
    "The rules for using Vibely: eligibility, acceptable use, what the free and paid tiers include, how M-Pesa payments work, and how accounts end.",
};

export default function Terms() {
  return (
    <DocPage
      title="Terms of Service"
      intro={`These terms are the agreement between you and ${SITE.legalEntity} when you use ${SITE.name}.`}
      updated={SITE.lastUpdated}
    >
      <p>
        <em>
          These terms were drafted in plain language and have not been reviewed
          by a lawyer. The event and refund sections in particular deal with
          money and liability under Kenyan law, and should be checked by a
          qualified advocate before you rely on them.
        </em>
      </p>

      <h2>1. Agreeing to these terms</h2>
      <p>
        By creating an account or using {SITE.name} you accept these terms. If
        you do not accept them, do not use the service.
      </p>

      <h2>2. Who can use Vibely</h2>
      <p>
        You must be at least {SITE.minAge} years old and legally able to enter a
        contract. The age limit is enforced by our database, which rejects any
        profile with a date of birth under {SITE.minAge}. You must not use{" "}
        {SITE.name} if we have previously removed your account, or if you are
        subject to a court order restricting your contact with others.
      </p>

      <h2>3. Your account</h2>
      <p>
        One account per person. You sign in with a phone number or with Google.
        Your information must be accurate and about you — your real photos and
        your real age. Keep your sign-in method secure; you are responsible for
        activity on your account, and you should tell us at once if you think
        someone else has access.
      </p>

      <h2>4. How you must behave</h2>
      <p>You agree not to:</p>
      <ul>
        <li>impersonate anyone, or use photos of a person who is not you;</li>
        <li>harass, threaten, stalk, bully or intimidate anyone;</li>
        <li>post or send sexual content involving minors, or sexualise minors in any way;</li>
        <li>send unsolicited sexual images;</li>
        <li>post content that is hateful or incites violence against any group;</li>
        <li>solicit money, investment or donations from other members;</li>
        <li>use the service for commercial promotion, prostitution or trafficking;</li>
        <li>run scams of any kind, including romance, crypto, forex and betting scams;</li>
        <li>share another person&apos;s private information without their consent;</li>
        <li>scrape, reverse engineer, overload or attempt to break the service;</li>
        <li>use bots, or create accounts by automated means.</li>
      </ul>
      <p>
        Members can report a profile, post or message for spam, harassment,
        nudity, hate speech, fraud, or anything else, and can block another
        member at any time. Reports go to our moderation team, who can remove
        content and accounts. Serious cases are reported to the authorities.
      </p>

      <h2>5. Moderation of what you post</h2>
      <p>
        Photos, stories and events may require approval before they are shown
        to other members, and messages may be automatically flagged for a
        moderator to review. We may remove content that breaks these terms, and
        we may restrict an account while we investigate a report. A person makes
        the final decision in every case.
      </p>

      <h2>6. Your content</h2>
      <p>
        You keep ownership of everything you post. You grant us a
        non-exclusive, worldwide, royalty-free licence to host, store, display
        and distribute it for the purpose of operating {SITE.name}. That licence
        ends when you delete the content or your account, except for copies we
        retain for legal or moderation reasons, and for anything other members
        have already shared onward.
      </p>

      <h2>7. Meeting people is at your own risk</h2>
      <p>
        {SITE.name} does not run criminal background checks on members. Our
        verified badge means a person submitted a selfie, or a selfie and an
        identity document, and our team reviewed it. It confirms the account
        belongs to a real person. It is not a guarantee of anyone&apos;s
        character, intentions, or any claim they make about themselves. You are
        solely responsible for your interactions with other members, online and
        in person. Please read our <a href="/safety">safety guidance</a> before
        meeting anyone.
      </p>

      <h2>8. Free and paid features</h2>
      <p>
        {SITE.name} is free to join. Free accounts can send up to{" "}
        {FREE_DAILY_LIKE_LIMIT} likes a day. Paid tiers, priced per month in
        Kenyan Shillings, are:
      </p>
      <ul>
        <li>
          <strong>Vibely Plus — KES {TIER_PRICES.plus}.</strong> See who liked
          you, and unlimited likes.
        </li>
        <li>
          <strong>Vibely Gold — KES {TIER_PRICES.gold}.</strong> Everything in
          Plus, plus {BOOST_QUOTA.gold} profile boosts a month and priority
          placement while boosted.
        </li>
        <li>
          <strong>Vibely VIP — KES {TIER_PRICES.vip}.</strong> Everything in
          Gold, plus a VIP badge, unlimited boosts, and direct intros to top
          matches.
        </li>
      </ul>
      <p>
        A boost lifts your profile to the top of Discover for 30 minutes. Boost
        quotas are enforced by our servers, and unused boosts do not carry over.
      </p>

      <h2>9. Payment and renewal</h2>
      <ul>
        <li>
          Payment is by M-Pesa. When you choose a tier we send an STK push to
          the phone number you give us, and you approve it on your handset. We
          never ask for, see or store your M-Pesa PIN.
        </li>
        <li>
          <strong>Nothing auto-renews.</strong> One successful payment gives you{" "}
          {SUBSCRIPTION_DAYS} days of that tier. When those days run out your
          account returns to the free tier until you choose to pay again. We
          take no standing order or recurring authority over your M-Pesa
          account.
        </li>
        <li>
          Your paid benefits start when Safaricom confirms the payment to us,
          which is usually immediate. If a payment is confirmed but the tier
          does not activate, email us and we will fix it.
        </li>
        <li>
          Prices may change. Any change applies to your next purchase, never to
          a period you have already paid for.
        </li>
        <li>
          Benefits are tied to your account and cannot be transferred.
        </li>
      </ul>

      <h2>10. Refunds</h2>
      <p>
        Because access is delivered immediately, paid time is generally
        non-refundable once it has started. We will refund you if you were
        charged more than once for the same period, if a payment succeeded but
        the tier was never activated, or if a paid feature did not work for a
        substantial part of the period you paid for. Email{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> within
        14 days with your M-Pesa receipt number.
      </p>
      <p>
        If we end your account because you broke these terms, remaining paid
        time is forfeited.
      </p>

      <h2>11. Events: what Vibely does and does not do</h2>
      <p>
        Events on {SITE.name} are created and run by their organizers, not by
        us. We list the event, take the payment, and pass the organizer their
        share. We are not the organizer, promoter, or venue, and we do not
        check that an event will go ahead as described.
      </p>
      <p>
        This section, and the four that follow, are the terms that apply when
        money changes hands for an event. Read them before you buy a ticket.
      </p>

      <h2>12. If you host an event</h2>
      <p>By publishing an event you agree that:</p>
      <ul>
        <li>
          the event is real, you have the right to run it, and the date, time,
          venue, price and capacity you enter are accurate;
        </li>
        <li>
          you will provide a working email address and phone number, which we
          release to anyone holding a confirmed ticket so they can reach you;
        </li>
        <li>
          you will honour every ticket sold, or refund it yourself in full;
        </li>
        <li>
          you are responsible for any licence, permit or insurance the event
          needs, and for the safety of people who attend;
        </li>
        <li>
          you will tell ticket holders as soon as you know that the event is
          cancelled, moved or materially changed.
        </li>
      </ul>
      <p>
        Paid events are not published until an organizer email and phone
        number are on file. We may also ask you to verify your identity before
        you can sell tickets.
      </p>

      <h2>13. If you buy a ticket</h2>
      <p>
        A ticket exists only once payment succeeds. Until then your place is
        held as pending and is not a booking. When payment succeeds you get a
        confirmed ticket and, with it, the organizer&rsquo;s email address and
        phone number.
      </p>
      <p>
        Your contract for the event itself is with the organizer. Ours is for
        the platform and the payment.
      </p>

      <h2>14. Cancellations, postponements and no-shows</h2>
      <p>
        <strong>If you cancel.</strong> You can cancel a free RSVP at any time.
        A paid ticket is refundable only if the organizer says it is; their
        stated policy governs, and if they have not stated one you should
        assume tickets are non-refundable and ask before paying.
      </p>
      <p>
        <strong>If the organizer cancels or the event does not happen.</strong>{" "}
        The organizer must refund you in full. That includes an event that is
        cancelled, one that never takes place, and one that is so different
        from its description that it is not the event you paid for.
      </p>
      <p>
        <strong>If the organizer moves it.</strong> If the date, time or venue
        changes materially and the new arrangement does not suit you, you may
        ask the organizer for a full refund.
      </p>

      <h2>15. Event refunds: who holds the money</h2>
      <p>
        This is the most important thing to understand about paying for an
        event on {SITE.name}, so we state it plainly.
      </p>
      <p>
        Ticket payments are split at the moment you pay. We keep our
        commission and the rest settles directly into the organizer&rsquo;s
        M-Pesa account. <strong>We never hold the organizer&rsquo;s share, so
        we cannot refund it to you.</strong> Only the organizer can.
      </p>
      <p>What we will do when an event does not happen:</p>
      <ul>
        <li>
          give you the organizer&rsquo;s email address and phone number so you
          can claim your refund directly;
        </li>
        <li>
          refund our own commission on your ticket, because that is the part we
          do hold;
        </li>
        <li>record the dispute against that organizer;</li>
        <li>
          suspend the organizer, remove their events, and withhold any future
          payouts we have not yet released, where we judge a complaint to be
          well founded.
        </li>
      </ul>
      <p>
        What we cannot do is pay you the organizer&rsquo;s share out of our own
        funds. If that risk is not acceptable to you, do not buy a ticket for
        an event whose organizer you have no reason to trust.
      </p>

      <h2>16. Reporting an organizer and how we investigate</h2>
      <p>
        Report the event in the app or email{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> with
        the event name, the date you paid, and what happened. Contact the
        organizer first if you can, and keep the messages: a refusal or silence
        from them is the clearest evidence we can act on.
      </p>
      <p>
        We review the organizer&rsquo;s identity verification, their contact
        details, their event history, and the payment record for your ticket.
        We aim to reach a decision within {SITE.dataRequestDays} days. We
        decide whether an organizer may keep using {SITE.name}; we do not
        arbitrate the contract between you and them, and nothing we decide
        affects your right to pursue the organizer yourself.
      </p>

      <h2>17. Ending your account</h2>
      <p>
        You can delete your account at any time from{" "}
        <strong>Account &amp; settings</strong> on your profile. It takes
        effect immediately and cannot be undone. Deleting while you have paid
        time remaining forfeits that time; there is no refund for unused days.
        What we delete and the two things we retain are set out in the{" "}
        <a href="/privacy">privacy policy</a>.
      </p>
      <p>
        If you would rather we closed it for you, email{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> from the
        address or phone number on the account and we will action it within{" "}
        {SITE.dataRequestDays} days.
      </p>
      <p>
        We may suspend or end your account if you break these terms, if the law
        requires it, or if allowing you to continue would put other members at
        risk. Where it is reasonable and lawful, we will tell you why.
      </p>

      <h2>18. Service availability</h2>
      <p>
        {SITE.name} is provided as is. We are an early-stage product and we
        change it often. We do not promise uninterrupted or error-free service,
        and we may add, change or withdraw features.
      </p>

      <h2>19. Our liability</h2>
      <p>
        To the fullest extent permitted by Kenyan law, {SITE.legalEntity} is not
        liable for indirect or consequential loss, for the conduct of other
        members whether online or offline, or for loss of data or profit.
        Nothing here excludes liability that cannot lawfully be excluded, and
        nothing here affects your rights under the Consumer Protection Act,
        2012. Where liability cannot be excluded, it is limited to the amount
        you paid us in the twelve months before the claim.
      </p>

      <h2>20. Disputes and governing law</h2>
      <p>
        These terms are governed by the laws of Kenya and the courts of Kenya
        have jurisdiction. Before starting a formal dispute, please email{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> — almost
        everything is resolved faster that way.
      </p>

      <h2>21. Changes to these terms</h2>
      <p>
        We may update these terms. If a change is material we will notify you in
        the app or by email before it takes effect. Continuing to use{" "}
        {SITE.name} after that means you accept the new terms.
      </p>

      <h2>22. Contact</h2>
      <p>
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> —{" "}
        {SITE.legalEntity}, {SITE.city}, {SITE.country}.
      </p>
    </DocPage>
  );
}

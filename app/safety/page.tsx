import type { Metadata } from "next";
import DocPage from "@/components/DocPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Safety on Vibely",
  description:
    "How to stay safe meeting people from Vibely, how to spot a scam, and how to report or block someone.",
};

export default function Safety() {
  return (
    <DocPage
      title="Staying safe on Vibely"
      intro="Most people you meet here are exactly who they say they are. These habits protect you from the ones who are not."
      updated={SITE.lastUpdated}
    >
      <h2>Before you meet</h2>
      <ul>
        <li>
          <strong>Chat inside Vibely first.</strong> Someone who pushes you onto
          WhatsApp or Telegram within minutes is usually trying to get away from
          our reporting tools.
        </li>
        <li>
          <strong>Do a quick search.</strong> Reverse-image search their photos.
          Check whether their name and photos show up elsewhere.
        </li>
        <li>
          <strong>Have a video call.</strong> A short call before meeting
          confirms the person matches the profile.
        </li>
        <li>
          <strong>Look for the verification badge.</strong> Verified profiles
          have confirmed they are a real person. It is not a background check,
          but it filters out most fakes.
        </li>
      </ul>

      <h2>Money is the biggest red flag</h2>
      <p>
        No genuine match will ask you for money. Treat every one of these as a
        scam, no matter how convincing the story is:
      </p>
      <ul>
        <li>An emergency — hospital bill, stranded, phone cut off — needing an M-Pesa transfer.</li>
        <li>Fare or transport money so they can come and meet you.</li>
        <li>An investment, crypto, forex or betting tip they want to help you with.</li>
        <li>Anyone asking for your M-Pesa PIN, an OTP, or a code sent to your phone.</li>
        <li>A request to receive money and forward it on. That makes you part of a fraud.</li>
      </ul>
      <p>
        Vibely will never ask for your PIN or a one-time code. Never share them
        with anyone, including someone claiming to be from Vibely or from
        Safaricom.
      </p>

      <h2>Meeting for the first time</h2>
      <ul>
        <li>
          <strong>Meet in public.</strong> A cafe, a mall, a busy restaurant.
          Not their place, not yours, not a quiet area at night.
        </li>
        <li>
          <strong>Tell someone.</strong> Share who you are meeting, where, and
          when you expect to be home. Share your live location with a friend.
        </li>
        <li>
          <strong>Arrange your own transport.</strong> Get there and leave on
          your own terms so you are never dependent on them for a ride.
        </li>
        <li>
          <strong>Watch your drink.</strong> Order it yourself, keep it with
          you, and do not accept a drink you did not see poured.
        </li>
        <li>
          <strong>Leave if it feels wrong.</strong> You owe no one an
          explanation, an apology, or the rest of the evening.
        </li>
      </ul>

      <h2>Protect your information</h2>
      <p>
        Hold back your home address, your workplace, your ID number and your
        financial details until you genuinely trust someone. Check the
        background of your photos for anything that gives away where you live.
        Vibely shows an approximate distance, never your exact location, and you
        can turn distance off in your privacy settings.
      </p>

      <h2>Report and block</h2>
      <p>
        Every profile, message and post has a report option, and blocking is
        immediate — they lose the ability to see you or contact you. Report
        anyone who asks for money, sends unsolicited sexual images, threatens or
        harasses you, appears to be under {SITE.minAge}, or is impersonating
        someone else. Reports are reviewed by our moderation team and we remove
        accounts that break the rules.
      </p>
      <p>
        You can report someone even after you have blocked them, and reporting
        is never revealed to the person you reported.
      </p>

      <h2>If something has happened</h2>
      <p>
        If you are in immediate danger, call the police on 999 or 112. For
        gender-based violence support in Kenya, the national GBV helpline is
        1195 (toll free, 24 hours). Then report the account to us at{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a> — we
        will preserve the account records and cooperate with law enforcement
        where we are legally required to.
      </p>

      <h2>What we do on our side</h2>
      <ul>
        <li>Profile verification, so accounts can be tied to a real person.</li>
        <li>Moderation of reports, with removal of accounts that break the rules.</li>
        <li>Privacy controls over distance, visibility and who can contact you.</li>
        <li>An {SITE.minAge}+ policy, with under-age accounts removed on sight.</li>
      </ul>
      <p>
        None of this replaces your own judgement. If a person or a situation
        feels off, trust that feeling.
      </p>
    </DocPage>
  );
}

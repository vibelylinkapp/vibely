import type { Metadata } from "next";
import DocPage from "@/components/DocPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Safety on Vibely",
  description:
    "How to stay safe meeting people from Vibely, how to spot a scam, and how to use the blocking, reporting and privacy tools built into the app.",
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
          WhatsApp or Telegram within minutes is often trying to get away from
          our reporting tools. Your WhatsApp number is only ever shared when you
          approve a specific request for it, so there is no rush.
        </li>
        <li>
          <strong>Do a quick search.</strong> Reverse-image search their photos
          and check whether their name and pictures appear elsewhere.
        </li>
        <li>
          <strong>Have a video call.</strong> A short call before meeting
          confirms the person matches the profile.
        </li>
        <li>
          <strong>Understand the verified badge.</strong> It means the person
          submitted a selfie — or a selfie and an identity document — and our
          team reviewed it. A phone number alone does not earn the badge. It
          confirms a real person is behind the account. It is not a background
          check and it says nothing about their character.
        </li>
      </ul>

      <h2>Money is the biggest red flag</h2>
      <p>
        No genuine match will ask you for money. Treat every one of these as a
        scam, however convincing the story:
      </p>
      <ul>
        <li>An emergency — hospital bill, stranded, phone cut off — needing an M-Pesa transfer.</li>
        <li>Fare or transport money so they can come and meet you.</li>
        <li>An investment, crypto, forex or betting tip they want to help you with.</li>
        <li>Anyone asking for your M-Pesa PIN, an OTP, or any code sent to your phone.</li>
        <li>A request to receive money and forward it on. That makes you part of a fraud.</li>
      </ul>
      <p>
        Vibely will never ask for your PIN or a one-time code. When you buy a
        subscription or a boost we send an M-Pesa STK push and you approve it on
        your own handset — we never ask you to read a code out to anyone. Never
        share these with anyone, including someone claiming to be from Vibely or
        from Safaricom.
      </p>

      <h2>Meeting for the first time</h2>
      <ul>
        <li>
          <strong>Meet in public.</strong> A cafe, a mall, a busy restaurant.
          Not their place, not yours, not somewhere quiet at night.
        </li>
        <li>
          <strong>Tell someone.</strong> Share who you are meeting, where, and
          when you expect to be home. Share your live location with a friend.
        </li>
        <li>
          <strong>Arrange your own transport.</strong> Get there and leave on
          your own terms, so you are never dependent on them for a ride.
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

      <h2>The controls you have</h2>
      <ul>
        <li>
          <strong>Block.</strong> Available from any profile. It takes effect
          immediately.
        </li>
        <li>
          <strong>Report.</strong> Profiles, posts and messages can be reported
          for spam or misleading content, harassment or bullying, nudity or
          sexual content, hate speech, scam or fraud, or anything else you
          describe. Reports go to our moderation team, and the person you
          reported is not told it was you.
        </li>
        <li>
          <strong>Hide your location.</strong> One switch in your privacy
          settings removes you from People Nearby and from the map completely.
          Other members only ever see an approximate distance, never your exact
          position.
        </li>
        <li>
          <strong>Hide your verified badge</strong> if you would rather not
          display it.
        </li>
        <li>
          <strong>Control your WhatsApp number.</strong> It stays private until
          you match with someone, they ask for it, and you approve.
        </li>
      </ul>

      <h2>Protect your information</h2>
      <p>
        Hold back your home address, your workplace, your ID number and your
        financial details until you genuinely trust someone. Check the
        backgrounds of your photos for anything that reveals where you live —
        a gate number, a landmark, a uniform.
      </p>

      <h2>Report anyone who</h2>
      <ul>
        <li>asks you for money, in any form, for any reason;</li>
        <li>sends unsolicited sexual images;</li>
        <li>threatens, harasses or will not take no for an answer;</li>
        <li>appears to be under {SITE.minAge};</li>
        <li>is using someone else&apos;s photos or identity.</li>
      </ul>
      <p>
        You can still report someone after blocking them.
      </p>

      <h2>If something has happened</h2>
      <p>
        If you are in immediate danger, call the police on 999 or 112. For
        gender-based violence support in Kenya, the national GBV helpline is
        1195, toll free and staffed 24 hours. For online fraud, report to the
        DCI Cybercrime Unit.
      </p>
      <p>
        Then tell us at{" "}
        <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>. We will
        preserve the account records and cooperate with law enforcement where we
        are lawfully required to.
      </p>

      <h2>What we do on our side</h2>
      <ul>
        <li>Review verification submissions by hand before granting a badge.</li>
        <li>Review every report, and remove content and accounts that break the rules.</li>
        <li>Require approval for photos, stories and events before they are shown widely.</li>
        <li>Automatically flag suspicious messages for a moderator to look at.</li>
        <li>
          Enforce an {SITE.minAge}+ age limit in the database itself, not just
          in the sign-up form.
        </li>
        <li>Keep a record of every moderation decision.</li>
      </ul>
      <p>
        A person makes the final call on every suspension or removal. None of
        this replaces your own judgement: if a person or a situation feels off,
        trust that feeling.
      </p>
    </DocPage>
  );
}

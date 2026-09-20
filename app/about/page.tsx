import type { Metadata } from "next";
import DocPage from "@/components/DocPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Vibely",
  description:
    "Vibely is a social discovery app built in Nairobi for Kenya and East Africa — dating, friends, hangouts and networking in one place.",
};

export default function About() {
  return (
    <DocPage
      title="About Vibely"
      intro="We are building the app we wanted when we moved to a new city."
    >
      <h2>Why we built it</h2>
      <p>
        In Nairobi, meeting new people still mostly happens through friends of
        friends. That works fine if you grew up here. It works badly if you have
        just moved, just graduated, just come out of a long relationship, or
        just want a wider circle than the one you inherited.
      </p>
      <p>
        The apps that do exist were mostly designed somewhere else, for somebody
        else. They assume card payments, they assume a dating-only intent, and
        they assume a city laid out nothing like ours. Vibely is our attempt at
        something that fits: local, verified, and honest about what it is.
      </p>

      <h2>What Vibely is</h2>
      <p>
        One app for four things people actually use it for — dating, making
        friends, finding a hangout tonight, and meeting people in your field.
        You say what you are here for, and Vibely shows you people and plans
        that match.
      </p>
      <ul>
        <li>
          <strong>People nearby.</strong> Discover people around you, filtered
          by what you are both looking for.
        </li>
        <li>
          <strong>Events and plans.</strong> See what is happening, or post a
          plan and see who joins.
        </li>
        <li>
          <strong>Chat.</strong> Real conversations, not a queue of unanswered
          openers.
        </li>
        <li>
          <strong>Verification and moderation.</strong> Profile verification,
          reporting, and blocking built in from the start.
        </li>
      </ul>

      <h2>Where we are</h2>
      <p>
        Vibely is early. We are live on the web and growing city by city,
        starting in {SITE.city}. The Android and iOS apps are in progress. If
        something is broken or missing, telling us is genuinely useful — there
        is a feedback form inside the app, and the address below reaches us.
      </p>

      <h2>Built here</h2>
      <p>
        Vibely is made in {SITE.city}, {SITE.country}, for Kenya and East
        Africa. That shows up in small decisions: M-Pesa rather than cards,
        distances that make sense for how people move around here, and safety
        guidance written for the scams that actually happen locally.
      </p>

      <h2>Talk to us</h2>
      <p>
        Email <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>.
        We read everything.
      </p>
    </DocPage>
  );
}

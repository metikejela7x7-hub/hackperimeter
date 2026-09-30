/**
 * Single source of truth for homepage content.
 * Edit copy here; components only render it.
 */

export const EVENT = {
  name: "HackPerimeter",
  theme: "Escape from Earth",
  slogan: "Winners are survivors.",
  description:
    "HackPerimeter is the first-ever Perimeter College hackathon: twelve hours, teams of two to four, and one survival scenario.",
  dateLabel: "Friday, November 6, 2026",
  timeLabel: "8:00 AM – 8:00 PM",
  durationLabel: "12 hours",
  venue: "Jim Cherry Auditorium",
  address: "555 Indian Creek Drive, Clarkston, GA",
  teamSize: "2–4",
  prize: "$1,000",
  prizeAmount: 1000,
  /**
   * Clarkston, GA is on Eastern Time; DST ends Nov 1, 2026, so Nov 6 is EST (UTC−5).
   * Fixed UTC instants keep the countdown identical for every viewer's timezone.
   */
  startsAt: Date.UTC(2026, 10, 6, 13, 0, 0), // 8:00 AM EST
  endsAt: Date.UTC(2026, 10, 7, 1, 0, 0), // 8:00 PM EST
} as const;

export const HOME_URL = "/";
export const APPLY_URL = "/apply";

export const NAV_LINKS = [
  { href: "#facts", label: "Facts" },
  { href: "#mission", label: "Mission" },
  { href: "#schedule", label: "Schedule" },
  { href: "#partners", label: "Partners" },
  { href: "#faq", label: "FAQ" },
] as const;

export const SCHEDULE_NOTE =
  "Preliminary schedule. Times may shift; the final run of show will be confirmed before the event.";

export interface ScheduleItem {
  time: string;
  title: string;
  detail: string;
  /** Marks the moments that anchor the day (start, finish). */
  milestone?: boolean;
}

export const SCHEDULE: readonly ScheduleItem[] = [
  {
    time: "8:00 AM",
    title: "Doors open",
    detail: "Check in, find your crew, claim a station.",
    milestone: true,
  },
  {
    time: "9:00 AM",
    title: "Mission briefing",
    detail: "The scenario is laid out and the rules of survival are set.",
  },
  {
    time: "9:30 AM",
    title: "Build begins",
    detail: "Clock is running. Teams design, code and iterate.",
  },
  {
    time: "1:00 PM",
    title: "Midpoint checkpoint",
    detail: "Take stock of what you have and what you still need.",
  },
  {
    time: "5:00 PM",
    title: "Submissions lock",
    detail: "Whatever is built is what gets judged.",
  },
  {
    time: "5:30 PM",
    title: "Demos",
    detail: "Teams present their work to the judges.",
  },
  {
    time: "7:00 PM",
    title: "Top-three interviews",
    detail: "The three strongest teams sit down for on-site interviews.",
  },
  {
    time: "8:00 PM",
    title: "Extraction",
    detail: "Winners announced. The perimeter closes.",
    milestone: true,
  },
];

export interface Partner {
  name: string;
  role: string;
  /**
   * Logo in /public/partners (e.g. "/partners/ibm-z.svg"), in its real colours.
   * Use the brand's version for dark backgrounds. Leave unset to show the name.
   */
  logo?: string;
  /**
   * Optional second layer drawn over the logo that tilts up on hover, with
   * its pivot point (CSS transform-origin). Same canvas size as `logo`.
   */
  accent?: { src: string; pivot: string };
  /** A branded ribbon drawn under the logo, in the partner's campaign colours. */
  ribbon?: "ibm-waves";
  /** A text wordmark set in the partner's own typeface, instead of an image. */
  wordmark?: "zoku";
  /** Show the name under the logo, for icon-only logos without lettering. */
  showName?: boolean;
  url?: string;
}

export const PARTNERS: readonly Partner[] = [
  { name: "IBM Z", role: "Partner", logo: "/partners/ibm-z.png", ribbon: "ibm-waves" },
  {
    name: "Accenture",
    role: "Partner",
    logo: "/partners/accenture-word.png",
    // The ">" lives in its own layer so it can tilt up on hover.
    accent: { src: "/partners/accenture-mark.png", pivot: "58% 41%" },
  },
  { name: "The Zoku App", role: "Partner", wordmark: "zoku" },
  { name: "Duwun", role: "Partner", logo: "/partners/duwun.png", showName: true },
];

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ: readonly FaqItem[] = [
  {
    id: "what",
    question: "What is HackPerimeter?",
    answer:
      "HackPerimeter is the first-ever Perimeter College hackathon. Teams have twelve hours to build something under the pressure of one survival scenario: Escape from Earth.",
  },
  {
    id: "when-where",
    question: "When and where does it happen?",
    answer:
      "Friday, November 6, 2026, from 8:00 AM to 8:00 PM at the Jim Cherry Auditorium, 555 Indian Creek Drive, Clarkston, GA.",
  },
  {
    id: "teams",
    question: "How big can a team be?",
    answer:
      "Teams are two to four people. Bring your own crew. Nobody survives alone.",
  },
  {
    id: "prizes",
    question: "What can we win?",
    answer:
      "There is a $1,000 cash-prize pool. The top three teams also get on-site interviews at the end of the day.",
  },
  {
    id: "theme",
    question: "What does “Escape from Earth” mean for what we build?",
    answer:
      "It is the scenario that frames the day: a zombie apocalypse on Earth and a crew trying to get off the planet. Specific challenge details will be shared closer to the event.",
  },
  {
    id: "partners",
    question: "Who is backing the event?",
    answer:
      "IBM Z, Accenture, The Zoku App and Duwun are partners of HackPerimeter. More partners are joining soon.",
  },
];

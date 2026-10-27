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
  dateLabel: "Friday, November 13, 2026",
  timeLabel: "8:00 AM – 8:30 PM",
  durationLabel: "12 hours",
  venue: "CL Jim Cherry Auditorium",
  address: "555 Indian Creek Drive, Clarkston, GA",
  teamSize: "2–4",
  /** Shown on the homepage as "100+ Participants". An estimate; update as applications come in. */
  expectedParticipants: 100,
  prize: "$1,000",
  prizeAmount: 1000,
  contactEmail: "risingtechsociety@gmail.com",
  /**
   * Clarkston, GA is on Eastern Time; DST ends Nov 1, 2026, so Nov 13 is EST (UTC−5).
   * Fixed UTC instants keep the countdown identical for every viewer's timezone.
   */
  startsAt: Date.UTC(2026, 10, 13, 13, 0, 0), // 8:00 AM EST
  endsAt: Date.UTC(2026, 10, 14, 1, 30, 0), // 8:30 PM EST
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

/** Rising Tech Society's channels, shown in the header and footer in this order, in each brand's colour. */
export const SOCIAL_LINKS = [
  {
    id: "discord",
    label: "Discord",
    href: "https://discord.com/invite/MxZrAQRBMP",
    color: "#5865f2",
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/rts_gsupc/",
    color: "#e4405f",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/rising-tech-society",
    color: "#0a66c2",
  },
] as const;

export const SCHEDULE_NOTE =
  "Preliminary schedule. Times may shift; the final run of show will be confirmed before the event.";

export interface ScheduleItem {
  time: string;
  title: string;
  /** The small line under the title. Left out when the title says it all. */
  detail?: string;
  /** Marks the moments that anchor the day (start, finish). */
  milestone?: boolean;
}

export const SCHEDULE: readonly ScheduleItem[] = [
  {
    time: "8:00 AM",
    title: "Doors open",
    milestone: true,
  },
  {
    time: "8:15 AM",
    title: "Check in",
    detail: "Check-in time for participants, volunteers, mentors and sponsors.",
  },
  {
    time: "9:00 AM",
    title: "Mission briefing",
    detail:
      "Your project isn't limited to the theme. Build whatever you'd like to fix about your campus, or anything education related.",
  },
  {
    time: "10:30 AM",
    title: "Hacking begins",
    detail: "Participants will be directed to the CL Building (Library, 3rd floor).",
  },
  {
    time: "1:30 PM",
    title: "Midpoint checkpoint",
    detail: "Lunch starts, and participants have to go back to CN Building.",
  },
  {
    time: "5:30 PM",
    title: "Presentation submission deadline",
    detail: "Teams submit their final presentations using the link on Discord, under Forms.",
  },
  {
    time: "7:00 PM",
    title: "Pitching starts",
    detail: "Held at the CL Jim Cherry Auditorium. Each team gets a 1 minute 30 second pitch.",
  },
  {
    time: "8:30 PM",
    title: "Extraction",
    detail: "Winners announced. The perimeter closes.",
    milestone: true,
  },
];

export interface Partner {
  name: string;
  /** Logo in /public/images, in its real colours. Shown at a fixed height, original aspect ratio. */
  logo: string;
  /** True when `logo` is an icon with no lettering, so its name is set beside it to read as one mark. */
  iconOnly?: boolean;
  /** True when `logo` is a tall, stacked mark (symbol above its lettering), shown larger so the lettering stays readable beside the wide logos. */
  stacked?: boolean;
  url?: string;
}

/**
 * Laid out four across, so the order matters: the first row is the Institute,
 * IBM, Zoku and DUWUN, and the rows below sit under it, left to right
 * (Accenture under the Institute, Sarah Donuts under IBM, Refuge Coffee Co.
 * under Zoku, A Better Way PAC under DUWUN, then Major League Hacking on its own row).
 */
export const PARTNERS: readonly Partner[] = [
  { name: "Entrepreneurship & Innovation Institute", logo: "/images/eii-logo.png" },
  { name: "IBM", logo: "/images/ibm-logo.png" },
  { name: "Zoku", logo: "/images/zoku-logo.png" },
  { name: "DUWUN", logo: "/images/duwun-logo.png", iconOnly: true },
  { name: "Accenture", logo: "/images/accenture-logo.png" },
  { name: "Sarah Donuts", logo: "/images/sarah-donuts-logo.png" },
  { name: "Refuge Coffee Co.", logo: "/images/refuge-coffee-logo.png", stacked: true },
  { name: "A Better Way PAC", logo: "/images/a-better-way-pac-logo.png", stacked: true },
  { name: "Major League Hacking", logo: "/images/mlh-logo.png" },
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
      "Friday, November 13, 2026, from 8:00 AM to 8:30 PM at CL Jim Cherry Auditorium, 555 Indian Creek Drive, Clarkston, GA.",
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

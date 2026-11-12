/**
 * The Hackperimeter Participant Agreement (v1.4, November 2026), shown on the
 * application's final step. Keep this in step with the PDF in /public
 * (AGREEMENT_URL in apply.ts) when either changes.
 */

export interface AgreementSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Extra labelled bullet lists, e.g. "Allowed" / "Not allowed". */
  lists?: { heading: string; items: string[] }[];
  after?: string[];
}

export const AGREEMENT_VERSION = "Version 1.4, last updated November 2026";

export const AGREEMENT_SUMMARY: readonly string[] = [
  "Hackperimeter is a software building event. It is not a hacking or cybersecurity competition.",
  "Be respectful to everyone, in person and online.",
  "Build with your own laptop and your own accounts. Your projects stay separate from university systems.",
  "Never scan, probe, or break into any network, system, or account that is not yours, and never use AI tools to do so.",
  "Never use real student, university, or private data in your project.",
  "Your registration information is used only for registration and event records, and it is deleted after the event.",
  "Follow the MLH Code of Conduct, Georgia State University's technology policies, and any instructions from event staff or university Cyber Security.",
];

export const AGREEMENT_SECTIONS: readonly AgreementSection[] = [
  {
    title: "1. About this agreement",
    paragraphs: [
      "This agreement explains how everyone behaves at Hackperimeter, a one day student hackathon on Friday, November 13, 2026, at the Clarkston campus of Georgia State University Perimeter College. It is hosted by Rising Tech Society, with support from the Entrepreneurship & Innovation Institute (ENI). Teams of 2 to 4 students build an app, website, or platform that solves a problem at our school, and pitch it to judges.",
      "Hackperimeter is not a cybersecurity competition, and there are no hacking or security testing challenges. The event plan has been shared with Georgia State University Cyber Security for review, and we follow their guidance. This agreement applies to participants, mentors, volunteers, judges, sponsors, and guests. Participants agree to it when they register.",
    ],
  },
  {
    title: "2. Code of conduct",
    paragraphs: [
      "Hackperimeter is an official Major League Hacking (MLH) Hack Days event, and we follow the MLH Code of Conduct. In plain words:",
    ],
    bullets: [
      "Treat everyone with respect. Harassment, discrimination, threats, and intimidation are not tolerated, in person, in Discord, or in project content.",
      "Keep your language and projects appropriate for a college campus. Give credit for other people's ideas, code, and images, and never tamper with another team's project.",
      "Follow instructions from organizers, mentors, volunteers, and campus safety staff, and leave the spaces we use clean.",
    ],
  },
  {
    title: "3. Acceptable use of technology",
    bullets: [
      "Use your own laptop, phone, and personal accounts. You may use the campus Wi-Fi for normal internet use, following Georgia State University's technology policies and the Student Code of Conduct. If university staff or Cyber Security ask you to use a different network, or to change or stop anything, follow their instructions right away.",
      "If your laptop dies or there is an emergency, you may use the campus library computers that are available to every student, under the normal university rules. Log out when you are done. No one at this event receives special access to any university system.",
      "Keep your passwords private. Do not share logins or use someone else's account.",
      "AI tools are welcome for building your own project. Do not enter passwords, student records, university data, or anyone's private information into them, and do not use them to scan or target any system. We follow Georgia State University's guidance on generative AI and data security.",
    ],
  },
  {
    title: "4. Rules of engagement",
    paragraphs: [
      "Hackperimeter is a building event, not a security event. Everything you make stays in your own accounts and on third party platforms that are separate from university systems, so the event stays isolated and controlled.",
    ],
    lists: [
      {
        heading: "Allowed",
        items: [
          "Building software projects on your own device",
          "Using public and open source tools, your own accounts, and AI tools to write, design, and test your own project",
          "Using sample, made up, or your own data",
          "Asking mentors and organizers for help",
        ],
      },
      {
        heading: "Not allowed",
        items: [
          "Reconnaissance, scanning, probing, or testing of any Georgia State University or third party network, website, or system, by hand or with AI tools",
          "Pointing AI tools or other software at any network, website, or system that is not your own",
          "Trying to get into accounts, devices, files, or data that are not yours",
          "Bypassing or turning off security controls",
          "Using real student, university, research, or other private data",
          "Creating, running, or sharing malware or anything meant to damage or disrupt a system",
          "Collecting, sharing, or guessing passwords",
        ],
      },
    ],
    after: [
      "If you find a security problem by accident, do not explore it. Stop, and tell an organizer right away so we can report it to the university.",
    ],
  },
  {
    title: "5. Your information and privacy",
    paragraphs: [
      "When you register, we collect your name, email, school, graduation year, and major. We use this information only to register you, to run the event, and to record attendance and event materials. We do not use it for any other purpose, and we do not sell it. We share registration information with Major League Hacking (MLH) to register you. All of the registration data is deleted after the event.",
      "A resume is not required. If your team places in the top three, we may ask whether you would like to share your resume with recruiters at the event. We introduce you to them so you can send it to them yourself, and we never share your resume without your permission.",
    ],
  },
  {
    title: "6. Accountability and reporting",
    paragraphs: [
      "Everyone is responsible for their own behavior and projects. Organizers may give a warning, remove someone from the event, or disqualify a team, and serious cases may be reported to Georgia State University staff, the Student Code of Conduct process, or campus police.",
      "If you see a problem, or feel uncomfortable or unsafe, tell any organizer, mentor, or volunteer wearing a Hackperimeter shirt, or email ngebru5@student.gsu.edu. For an emergency, call 911. Security related concerns are also reported to Georgia State University Cyber Security and campus police.",
    ],
  },
];

/** Section 7, "Your agreement": every box must be ticked to sign. */
export const AGREEMENT_CONFIRMATIONS: readonly string[] = [
  "I have read and understand this agreement.",
  "I will follow the MLH Code of Conduct, Georgia State University's technology policies, the Student Code of Conduct, and any instructions from event staff, university staff, or Cyber Security.",
  "I will not scan, probe, or attack any network, system, or account that is not mine, with or without AI tools, and I will not use real student, university, or private data.",
  "I understand that the information I give at registration is used only to register me and to record my participation in the event, that it is not used for any other purpose, and that it will be deleted after the event.",
  "I understand that organizers may remove me from the event or disqualify my team if I break these rules.",
];

import { Resend } from "resend";
import { googleCalendarUrl, outlookCalendarUrl } from "@/data/calendar";
import { EVENT } from "@/data/event";
import { optionalEnv, siteUrl } from "./env";

export interface Email {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Files Resend fetches from a public URL and attaches. */
  attachments?: { filename: string; path: string }[];
}

/**
 * Sends through Resend. Returns false (and logs) instead of throwing, so a
 * mail outage never fails an application. Without RESEND_API_KEY it only logs.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  const apiKey = optionalEnv("RESEND_API_KEY");
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set; skipped "${email.subject}" to ${email.to}`);
    return false;
  }
  const from = optionalEnv("EMAIL_FROM") ?? `${EVENT.name} <onboarding@resend.dev>`;
  const resend = new Resend(apiKey);
  let { error } = await resend.emails.send({ from, replyTo: EVENT.contactEmail, ...email });
  if (error && email.attachments?.length) {
    // An attachment Resend couldn't fetch shouldn't cost the person their email.
    console.error(`[email] "${email.subject}" failed with attachments; retrying without`, error);
    const { attachments: _skipped, ...plain } = email;
    ({ error } = await resend.emails.send({ from, replyTo: EVENT.contactEmail, ...plain }));
  }
  if (error) {
    console.error(`[email] failed to send "${email.subject}"`, error);
    return false;
  }
  return true;
}

/** Sends many emails in batches of 100 (Resend's batch limit). Returns how many were accepted. */
export async function sendEmails(emails: readonly Email[]): Promise<number> {
  const apiKey = optionalEnv("RESEND_API_KEY");
  if (!apiKey || emails.length === 0) return 0;
  const from = optionalEnv("EMAIL_FROM") ?? `${EVENT.name} <onboarding@resend.dev>`;
  const resend = new Resend(apiKey);
  let sent = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails
      .slice(i, i + 100)
      .map((email) => ({ from, replyTo: EVENT.contactEmail, ...email }));
    const { error } = await resend.batch.send(chunk);
    if (error) console.error(`[email] batch of ${chunk.length} failed`, error);
    else sent += chunk.length;
  }
  return sent;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] || "there";

/** "Add to your calendar" links: Google, Outlook, and an .ics file for Apple and others. */
function calendarLinks() {
  const site = siteUrl();
  const links = [
    { label: "Google Calendar", url: googleCalendarUrl(site) },
    { label: "Outlook", url: outlookCalendarUrl(site) },
    { label: "Apple / other (.ics)", url: `${site}/api/calendar` },
  ];
  return {
    text: `Add it to your calendar:\n${links.map((l) => `${l.label}: ${l.url}`).join("\n")}`,
    html: `<strong>Add it to your calendar:</strong><br>${links
      .map((l) => `<a href="${escapeHtml(l.url)}" style="color:#b47a12">${escapeHtml(l.label)}</a>`)
      .join(" &nbsp;·&nbsp; ")}`,
  };
}

/** Wraps paragraphs in a plain, dark-on-light layout that renders in every mail client. */
function layout(paragraphs: string[]): string {
  const body = paragraphs
    .map((p) => `<p style="margin:0 0 16px;line-height:1.55">${p}</p>`)
    .join("");
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f2ee;font-family:Arial,Helvetica,sans-serif;color:#121315"><div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px;border-top:4px solid #d99a2b">${body}<p style="margin:24px 0 0;font-size:13px;color:#6f6c65">${escapeHtml(EVENT.name)} · ${escapeHtml(EVENT.venue)}, ${escapeHtml(EVENT.address)}</p></div></body></html>`;
}

export function confirmationEmail(application: { fullName: string; email: string }): Email {
  const name = firstName(application.fullName);
  const when = `${EVENT.dateLabel}, ${EVENT.timeLabel}`;
  return {
    to: application.email,
    subject: `We got your ${EVENT.name} application`,
    text: [
      `Hi ${name},`,
      `Thanks for applying to ${EVENT.name}. Your application is in, and we'll email you once it has been reviewed.`,
      `When: ${when}\nWhere: ${EVENT.venue}, ${EVENT.address}`,
      `See you on the other side of the perimeter.`,
    ].join("\n\n"),
    html: layout([
      `Hi ${escapeHtml(name)},`,
      `Thanks for applying to <strong>${escapeHtml(EVENT.name)}</strong>. Your application is in, and we'll email you once it has been reviewed.`,
      `<strong>When:</strong> ${escapeHtml(when)}<br><strong>Where:</strong> ${escapeHtml(EVENT.venue)}, ${escapeHtml(EVENT.address)}`,
      `See you on the other side of the perimeter.`,
    ]),
  };
}

export function acceptanceEmail(application: { fullName: string; email: string }): Email {
  const name = firstName(application.fullName);
  const discord = optionalEnv("DISCORD_INVITE_URL");
  const when = `${EVENT.dateLabel}, ${EVENT.timeLabel}`;
  const calendar = calendarLinks();
  const discordText = discord
    ? `Join the ${EVENT.name} Discord now. It's where you'll get announcements, schedule updates and answers from the organizers: ${discord}`
    : `We'll send the Discord invite and day-of details soon.`;
  const discordHtml = discord
    ? `Join the ${escapeHtml(EVENT.name)} Discord now. It's where you'll get announcements, schedule updates and answers from the organizers:<br><a href="${escapeHtml(discord)}" style="color:#b47a12">${escapeHtml(discord)}</a>`
    : `We'll send the Discord invite and day-of details soon.`;
  return {
    to: application.email,
    subject: `You're in: ${EVENT.name} ${EVENT.dateLabel.replace(/^\w+, /, "")}`,
    text: [
      `Hi ${name},`,
      `You've been accepted to ${EVENT.name}!`,
      `When: ${when}\nWhere: ${EVENT.venue}, ${EVENT.address}`,
      discordText,
      calendar.text,
      `Bring a photo ID for check-in, plus your laptop and charger.`,
      `More details: ${siteUrl()}`,
    ].join("\n\n"),
    html: layout([
      `Hi ${escapeHtml(name)},`,
      `<strong>You've been accepted to ${escapeHtml(EVENT.name)}!</strong>`,
      `<strong>When:</strong> ${escapeHtml(when)}<br><strong>Where:</strong> ${escapeHtml(EVENT.venue)}, ${escapeHtml(EVENT.address)}`,
      discordHtml,
      calendar.html,
      `Bring a photo ID for check-in, plus your laptop and charger.`,
      `<a href="${escapeHtml(siteUrl())}" style="color:#b47a12">${escapeHtml(siteUrl())}</a>`,
    ]),
  };
}

/**
 * Sent once to a teammate someone listed who hasn't applied yet. The wording is
 * fixed; the only applicant-written parts are their name and team name, escaped.
 */
export function teammateInviteEmail(invite: {
  to: string;
  inviterName: string;
  teamName: string | null;
  link: string;
}): Email {
  const inviter = invite.inviterName.trim();
  const team = invite.teamName?.trim();
  const when = `${EVENT.dateLabel}, ${EVENT.timeLabel}`;
  const teamText = team ? ` on their team "${team}"` : "";
  const teamHtml = team ? ` on their team <strong>${escapeHtml(team)}</strong>` : "";
  return {
    to: invite.to,
    subject: `${inviter} listed you as a teammate for ${EVENT.name}`,
    text: [
      `Hi,`,
      `${inviter} applied to ${EVENT.name} and listed you as a teammate${teamText}.`,
      `When: ${when}\nWhere: ${EVENT.venue}, ${EVENT.address}`,
      `Each teammate applies separately. To join them, apply with this email address (${invite.to}). Your team details are already filled in:\n${invite.link}`,
      `Don't know ${inviter}, or not interested? Just ignore this email. We won't email you again.`,
    ].join("\n\n"),
    html: layout([
      `Hi,`,
      `<strong>${escapeHtml(inviter)}</strong> applied to ${escapeHtml(EVENT.name)} and listed you as a teammate${teamHtml}.`,
      `<strong>When:</strong> ${escapeHtml(when)}<br><strong>Where:</strong> ${escapeHtml(EVENT.venue)}, ${escapeHtml(EVENT.address)}`,
      `Each teammate applies separately. To join them, apply with this email address (${escapeHtml(invite.to)}). Your team details are already filled in.`,
      `<a href="${escapeHtml(invite.link)}" style="display:inline-block;padding:12px 20px;background:#d99a2b;color:#121315;text-decoration:none;font-weight:bold">Apply to join your team</a>`,
      `<span style="color:#6f6c65">Don't know ${escapeHtml(inviter)}, or not interested? Just ignore this email. We won't email you again.</span>`,
    ]),
  };
}

/**
 * Sent when an organizer teams someone up. Lists teammates by name only: no
 * contact details are shared. Teammates find each other on Discord; the invite
 * link is only included for accepted applicants, as in the acceptance email.
 */
export function teamMatchedEmail(match: {
  to: string;
  fullName: string;
  teammateNames: string[];
  teamName: string | null;
  accepted: boolean;
}): Email {
  const name = firstName(match.fullName);
  const discord = match.accepted ? optionalEnv("DISCORD_INVITE_URL") : undefined;
  const team = match.teamName?.trim();
  const names = match.teammateNames.map((n) => n.trim()).filter(Boolean);
  const list =
    names.length <= 1
      ? (names[0] ?? "")
      : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const teamText = team ? ` Your team is called "${team}".` : "";
  const teamHtml = team ? ` Your team is called <strong>${escapeHtml(team)}</strong>.` : "";
  const discordText = discord
    ? `Find each other on the ${EVENT.name} Discord and say hi before the event: ${discord}`
    : match.accepted
      ? `Look out for each other on the ${EVENT.name} Discord and say hi before the event.`
      : `Once you're accepted, you'll get the ${EVENT.name} Discord invite, where you can meet them.`;
  const discordHtml = discord
    ? `Find each other on the ${escapeHtml(EVENT.name)} Discord and say hi before the event:<br><a href="${escapeHtml(discord)}" style="color:#b47a12">${escapeHtml(discord)}</a>`
    : escapeHtml(discordText);
  const statusText = match.accepted
    ? `See you on ${EVENT.dateLabel}!`
    : `This doesn't change your application. We'll email you separately about acceptance.`;
  return {
    to: match.to,
    subject: `You've got a ${EVENT.name} team!`,
    text: [
      `Hi ${name},`,
      `Good news: we've matched you with a team for ${EVENT.name}. You're teamed up with ${list}.${teamText}`,
      discordText,
      statusText,
    ].join("\n\n"),
    html: layout([
      `Hi ${escapeHtml(name)},`,
      `Good news: we've matched you with a team for <strong>${escapeHtml(EVENT.name)}</strong>. You're teamed up with <strong>${escapeHtml(list)}</strong>.${teamHtml}`,
      discordHtml,
      `<span style="color:#6f6c65">${escapeHtml(statusText)}</span>`,
    ]),
  };
}

/** The weekly countdown sent to accepted applicants (see reminders.ts). */
export function weeklyReminderEmail(application: { fullName: string; email: string }, weeksLeft: number): Email {
  if (weeksLeft === 2) return twoWeeksToGoEmail(application);
  const name = firstName(application.fullName);
  const discord = optionalEnv("DISCORD_INVITE_URL");
  const when = `${EVENT.dateLabel}, ${EVENT.timeLabel}`;
  const countdown = weeksLeft === 1 ? "One week to go" : `${weeksLeft} weeks to go`;
  const calendar = calendarLinks();
  const discordText = discord
    ? `Haven't joined the Discord yet? It's where you'll get announcements, schedule updates and answers from the organizers: ${discord}`
    : "";
  const discordHtml = discord
    ? `Haven't joined the Discord yet? It's where you'll get announcements, schedule updates and answers from the organizers:<br><a href="${escapeHtml(discord)}" style="color:#b47a12">${escapeHtml(discord)}</a>`
    : "";
  return {
    to: application.email,
    subject: `${countdown}: ${EVENT.name} is ${EVENT.dateLabel.replace(/^\w+, /, "")}`,
    text: [
      `Hi ${name},`,
      `${countdown} until ${EVENT.name}!`,
      `When: ${when}\nWhere: ${EVENT.venue}, ${EVENT.address}`,
      calendar.text,
      ...(discordText ? [discordText] : []),
      `Bring a photo ID for check-in, plus your laptop and charger.`,
      `Can't make it any more? Reply to let us know, so we can give your spot to someone else.`,
    ].join("\n\n"),
    html: layout([
      `Hi ${escapeHtml(name)},`,
      `<strong>${escapeHtml(countdown)} until ${escapeHtml(EVENT.name)}!</strong>`,
      `<strong>When:</strong> ${escapeHtml(when)}<br><strong>Where:</strong> ${escapeHtml(EVENT.venue)}, ${escapeHtml(EVENT.address)}`,
      calendar.html,
      ...(discordHtml ? [discordHtml] : []),
      `Bring a photo ID for check-in, plus your laptop and charger.`,
      `<span style="color:#6f6c65">Can't make it any more? Reply to let us know, so we can give your spot to someone else.</span>`,
    ]),
  };
}

/** The "2 weeks to go" reminder, in Niguss's words: bring a friend, or come solo and we'll pair you up. */
function twoWeeksToGoEmail(application: { fullName: string; email: string }): Email {
  const name = firstName(application.fullName);
  const discord = optionalEnv("DISCORD_INVITE_URL");
  const when = `${EVENT.dateLabel}, ${EVENT.timeLabel}`;
  const calendar = calendarLinks();
  const apply = `${siteUrl()}/apply`;
  const soloText = discord
    ? `Coming solo? Don't worry. Join our Discord and we'll pair you with someone who shares your interests: ${discord}`
    : `Coming solo? Don't worry. We'll pair you with someone who shares your interests.`;
  const soloHtml = discord
    ? `<strong>Coming solo?</strong> Don't worry. Join our Discord and we'll pair you with someone who shares your interests:<br><a href="${escapeHtml(discord)}" style="color:#b47a12">${escapeHtml(discord)}</a>`
    : `<strong>Coming solo?</strong> Don't worry. We'll pair you with someone who shares your interests.`;
  return {
    to: application.email,
    subject: `Only 2 weeks left until ${EVENT.name}!`,
    text: [
      `Hi ${name},`,
      `We only have 2 weeks left until ${EVENT.name}, and it's going to be a blast!`,
      `Bring a friend! If they haven't applied yet, send them this link: ${apply}`,
      soloText,
      `When: ${when}\nWhere: ${EVENT.venue}, ${EVENT.address}`,
      calendar.text,
      `Bring a photo ID for check-in, plus your laptop and charger.`,
      `We're so excited to see you there!`,
      `Can't make it any more? Reply to let us know, so we can give your spot to someone else.`,
    ].join("\n\n"),
    html: layout([
      `Hi ${escapeHtml(name)},`,
      `<strong>We only have 2 weeks left until ${escapeHtml(EVENT.name)}, and it's going to be a blast!</strong>`,
      `<strong>Bring a friend!</strong> If they haven't applied yet, send them this link:<br><a href="${escapeHtml(apply)}" style="color:#b47a12">${escapeHtml(apply)}</a>`,
      soloHtml,
      `<strong>When:</strong> ${escapeHtml(when)}<br><strong>Where:</strong> ${escapeHtml(EVENT.venue)}, ${escapeHtml(EVENT.address)}`,
      calendar.html,
      `Bring a photo ID for check-in, plus your laptop and charger.`,
      `We're so excited to see you there!`,
      `<span style="color:#6f6c65">Can't make it any more? Reply to let us know, so we can give your spot to someone else.</span>`,
    ]),
  };
}

/**
 * The one reminder an organizer can send to a listed teammate who still
 * hasn't applied (after the invite). Same fixed wording rules as the invite.
 */
export function teammateReminderEmail(invite: {
  to: string;
  inviterName: string;
  teamName: string | null;
  link: string;
}): Email {
  const inviter = invite.inviterName.trim();
  const team = invite.teamName?.trim();
  const when = `${EVENT.dateLabel}, ${EVENT.timeLabel}`;
  const teamText = team ? ` on "${team}"` : "";
  const teamHtml = team ? ` on <strong>${escapeHtml(team)}</strong>` : "";
  return {
    to: invite.to,
    subject: `Reminder: ${inviter} is saving you a spot at ${EVENT.name}`,
    text: [
      `Hi,`,
      `${inviter} listed you as a teammate${teamText} for ${EVENT.name}, but we haven't received your application yet.`,
      `When: ${when}\nWhere: ${EVENT.venue}, ${EVENT.address}`,
      `Apply with this email address (${invite.to}) so we can put you on their team. Your team details are already filled in:\n${invite.link}`,
      `Not coming, or don't know ${inviter}? Just ignore this. This is the last email we'll send you about it.`,
    ].join("\n\n"),
    html: layout([
      `Hi,`,
      `<strong>${escapeHtml(inviter)}</strong> listed you as a teammate${teamHtml} for ${escapeHtml(EVENT.name)}, but we haven't received your application yet.`,
      `<strong>When:</strong> ${escapeHtml(when)}<br><strong>Where:</strong> ${escapeHtml(EVENT.venue)}, ${escapeHtml(EVENT.address)}`,
      `Apply with this email address (${escapeHtml(invite.to)}) so we can put you on their team. Your team details are already filled in.`,
      `<a href="${escapeHtml(invite.link)}" style="display:inline-block;padding:12px 20px;background:#d99a2b;color:#121315;text-decoration:none;font-weight:bold">Apply to join your team</a>`,
      `<span style="color:#6f6c65">Not coming, or don't know ${escapeHtml(inviter)}? Just ignore this. This is the last email we'll send you about it.</span>`,
    ]),
  };
}

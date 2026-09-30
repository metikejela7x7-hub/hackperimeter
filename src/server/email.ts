import { Resend } from "resend";
import { EVENT } from "@/data/event";
import { optionalEnv, siteUrl } from "./env";

export interface Email {
  to: string;
  subject: string;
  text: string;
  html: string;
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
  const { error } = await new Resend(apiKey).emails.send({ from, ...email });
  if (error) {
    console.error(`[email] failed to send "${email.subject}"`, error);
    return false;
  }
  return true;
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
  const discordText = discord
    ? `Join the ${EVENT.name} Discord now. Announcements, team-finding and day-of updates all happen there: ${discord}`
    : `We'll send the Discord invite and day-of details soon.`;
  const discordHtml = discord
    ? `Join the ${escapeHtml(EVENT.name)} Discord now. Announcements, team-finding and day-of updates all happen there:<br><a href="${escapeHtml(discord)}" style="color:#b47a12">${escapeHtml(discord)}</a>`
    : `We'll send the Discord invite and day-of details soon.`;
  return {
    to: application.email,
    subject: `You're in: ${EVENT.name} ${EVENT.dateLabel.replace(/^\w+, /, "")}`,
    text: [
      `Hi ${name},`,
      `You've been accepted to ${EVENT.name}!`,
      `When: ${when}\nWhere: ${EVENT.venue}, ${EVENT.address}`,
      discordText,
      `Bring a photo ID for check-in, plus your laptop and charger.`,
      `More details: ${siteUrl()}`,
    ].join("\n\n"),
    html: layout([
      `Hi ${escapeHtml(name)},`,
      `<strong>You've been accepted to ${escapeHtml(EVENT.name)}!</strong>`,
      `<strong>When:</strong> ${escapeHtml(when)}<br><strong>Where:</strong> ${escapeHtml(EVENT.venue)}, ${escapeHtml(EVENT.address)}`,
      discordHtml,
      `Bring a photo ID for check-in, plus your laptop and charger.`,
      `<a href="${escapeHtml(siteUrl())}" style="color:#b47a12">${escapeHtml(siteUrl())}</a>`,
    ]),
  };
}

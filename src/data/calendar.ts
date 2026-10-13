import { EVENT } from "./event";

/**
 * "Add to calendar" links for the event. Google and Outlook open a pre-filled
 * event; the .ics file (served at /api/calendar) works with Apple Calendar and
 * anything else.
 */

const TITLE = `${EVENT.name}: ${EVENT.theme}`;
const LOCATION = `${EVENT.venue}, ${EVENT.address}`;

function description(siteUrl: string) {
  return `${EVENT.description}\n\nBring a photo ID for check-in, plus your laptop and charger.\n\n${siteUrl}`;
}

/** 20261113T130000Z: the compact UTC form Google Calendar and .ics files use. */
const compact = (time: number) => new Date(time).toISOString().replace(/[-:]|\.\d{3}/g, "");

export function googleCalendarUrl(siteUrl: string): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: TITLE,
    dates: `${compact(EVENT.startsAt)}/${compact(EVENT.endsAt)}`,
    details: description(siteUrl),
    location: LOCATION,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function outlookCalendarUrl(siteUrl: string): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: TITLE,
    startdt: new Date(EVENT.startsAt).toISOString(),
    enddt: new Date(EVENT.endsAt).toISOString(),
    body: description(siteUrl),
    location: LOCATION,
  });
  return `https://outlook.live.com/calendar/0/action/compose?${params}`;
}

/** Escapes text for an .ics field (RFC 5545). */
const icsText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** Long .ics lines are wrapped at 75 characters, continuing with a leading space. */
function fold(line: string): string {
  const parts = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
  return parts.join("\r\n");
}

/** A one-event calendar file. Lines end in CRLF, as the format requires. */
export function icsFile(siteUrl: string, now = new Date()): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${EVENT.name}//Event//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${EVENT.startsAt}@hackperimeter.com`,
    `DTSTAMP:${compact(now.getTime())}`,
    `DTSTART:${compact(EVENT.startsAt)}`,
    `DTEND:${compact(EVENT.endsAt)}`,
    `SUMMARY:${icsText(TITLE)}`,
    `DESCRIPTION:${icsText(description(siteUrl))}`,
    `LOCATION:${icsText(LOCATION)}`,
    `URL:${siteUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n")
    .concat("\r\n");
}

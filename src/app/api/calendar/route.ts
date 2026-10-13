import { icsFile } from "@/data/calendar";
import { siteUrl } from "@/server/env";

/** GET /api/calendar: the event as an .ics file, for Apple Calendar and other apps. */
export function GET() {
  return new Response(icsFile(siteUrl()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="hackperimeter.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}

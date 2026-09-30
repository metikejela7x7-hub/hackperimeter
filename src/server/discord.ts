import { optionalEnv } from "./env";

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export const AMBER = 0xd99a2b;

/**
 * Posts to the exec-server channel's webhook. Returns false (and logs) rather
 * than throwing. Without DISCORD_WEBHOOK_URL it only logs.
 */
export async function postToDiscord(message: { content?: string; embeds?: DiscordEmbed[] }) {
  const url = optionalEnv("DISCORD_WEBHOOK_URL");
  if (!url) {
    console.warn("[discord] DISCORD_WEBHOOK_URL not set; skipped message");
    return false;
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Never let applicant-typed text ping @everyone or roles.
      body: JSON.stringify({ ...message, allowed_mentions: { parse: [] } }),
    });
    if (!response.ok) {
      console.error(`[discord] webhook returned ${response.status}: ${await response.text()}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[discord] webhook request failed", error);
    return false;
  }
}

/** Discord embed values max out at 1,024 characters and can't be blank. */
export function embedValue(value: string): string {
  const trimmed = value.trim() || "—";
  return trimmed.length > 1024 ? `${trimmed.slice(0, 1021)}…` : trimmed;
}

import { APPLICATION_STATUSES } from "@/data/apply";
import { EVENT } from "@/data/event";
import { AMBER, type DiscordEmbed } from "./discord";
import type { ApplicationStats, Count } from "./stats";

const DAY_MS = 24 * 60 * 60 * 1000;

const list = (counts: Count[]) =>
  counts.length > 0 ? counts.map(({ label, count }) => `${label}: **${count}**`).join("\n") : "—";

/** Whole days from `now` until the event starts (0 on the day itself). */
export function daysUntilEvent(now = new Date()): number {
  return Math.max(0, Math.ceil((EVENT.startsAt - now.getTime()) / DAY_MS));
}

export function recapEmbed(stats: ApplicationStats, now = new Date()): DiscordEmbed {
  const days = daysUntilEvent(now);
  return {
    title: `Daily recap: ${stats.last24h} new application${stats.last24h === 1 ? "" : "s"}`,
    description:
      days > 0
        ? `**${stats.total}** total so far. ${days} day${days === 1 ? "" : "s"} until ${EVENT.name}.`
        : `**${stats.total}** total.`,
    color: AMBER,
    fields: [
      {
        name: "Review status",
        value: list(
          APPLICATION_STATUSES.map(({ value, label }) => ({ label, count: stats.byStatus[value] })),
        ),
        inline: true,
      },
      { name: "Experience", value: list(stats.byExperience), inline: true },
      {
        name: "Teams",
        value: `Team: **${stats.team}**\nLooking for a team: **${stats.solo}**\nWith resume: **${stats.withResume}**`,
        inline: true,
      },
      { name: "Top schools", value: list(stats.topSchools) },
    ],
    timestamp: now.toISOString(),
  };
}

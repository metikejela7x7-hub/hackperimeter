import {
  APPLICATION_STATUSES,
  EXPERIENCE_LEVELS,
  type ApplicationStatus,
} from "@/data/apply";
import { EVENT } from "@/data/event";
import type { ApplicationRecord } from "./applications";
import { AMBER, type DiscordEmbed } from "./discord";

export interface Count {
  label: string;
  count: number;
}

export interface ApplicationStats {
  total: number;
  last24h: number;
  byStatus: Record<ApplicationStatus, number>;
  byExperience: Count[];
  topSchools: Count[];
  team: number;
  solo: number;
  withResume: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Most common schools, grouping spellings that differ only in case and spacing. */
function topSchools(applications: ApplicationRecord[], limit: number): Count[] {
  const groups = new Map<string, Count>();
  for (const { school } of applications) {
    const key = school.trim().replace(/\s+/g, " ").toLowerCase();
    const group = groups.get(key);
    if (group) group.count += 1;
    else groups.set(key, { label: school.trim(), count: 1 });
  }
  return [...groups.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function computeStats(applications: ApplicationRecord[], now = new Date()): ApplicationStats {
  const since = now.getTime() - DAY_MS;
  const byStatus = Object.fromEntries(
    APPLICATION_STATUSES.map(({ value }) => [value, 0]),
  ) as Record<ApplicationStatus, number>;
  for (const application of applications) byStatus[application.status] += 1;

  return {
    total: applications.length,
    last24h: applications.filter((a) => new Date(a.createdAt).getTime() >= since).length,
    byStatus,
    byExperience: EXPERIENCE_LEVELS.map(({ value, label }) => ({
      label,
      count: applications.filter((a) => a.experience === value).length,
    })),
    topSchools: topSchools(applications, 5),
    team: applications.filter((a) => a.teamMode === "team").length,
    solo: applications.filter((a) => a.teamMode === "solo").length,
    withResume: applications.filter((a) => a.hasResume).length,
  };
}

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
        value: list(APPLICATION_STATUSES.map(({ value, label }) => ({ label, count: stats.byStatus[value] }))),
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

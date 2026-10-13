import { EXPERIENCE_LEVELS, labelFor } from "@/data/apply";
import { type ApplicationRecord, countApplications } from "./applications";
import { AMBER, embedValue, postToDiscord } from "./discord";
import type { Team } from "@/components/Admin/teams";
import { confirmationEmail, sendEmail, teamMatchedEmail } from "./email";
import { sendTeammateInvites } from "./invites";

/** Runs after a new application is saved: applicant confirmation, teammate invites, exec-server ping. */
export async function notifyNewApplication(application: ApplicationRecord): Promise<void> {
  const total = await countApplications().catch(() => null);
  const team =
    application.teamMode === "team"
      ? `Team${application.teamName ? ` "${application.teamName}"` : ""} · ${
          application.teammates.length + 1
        } people listed`
      : "Looking for a team";

  await Promise.all([
    sendEmail(confirmationEmail(application)),
    sendTeammateInvites(application),
    postToDiscord({
      embeds: [
        {
          title: "New application",
          color: AMBER,
          fields: [
            { name: "Name", value: embedValue(application.fullName), inline: true },
            { name: "School", value: embedValue(application.school), inline: true },
            {
              name: "Experience",
              value: embedValue(labelFor(EXPERIENCE_LEVELS, application.experience)),
              inline: true,
            },
            { name: "Team", value: embedValue(team), inline: true },
            { name: "Resume", value: application.hasResume ? "Yes" : "No", inline: true },
          ],
          footer: total === null ? undefined : { text: `${total} applications total` },
          timestamp: application.createdAt,
        },
      ],
    }),
  ]);
}

/** Tells everyone on a team, by name only, who they've been teamed up with. */
export async function notifyTeamMatched(team: Team): Promise<void> {
  const members = team.members.map((m) => m.application);
  await Promise.all(
    members.map((member) =>
      sendEmail(
        teamMatchedEmail({
          to: member.email,
          fullName: member.fullName,
          teammateNames: members.filter((m) => m.id !== member.id).map((m) => m.fullName),
          teamName: team.name,
          accepted: member.status === "accepted",
        }),
      ),
    ),
  );
}

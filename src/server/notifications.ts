import { EXPERIENCE_LEVELS, labelFor } from "@/data/apply";
import { type ApplicationRecord, countApplications } from "./applications";
import { AMBER, embedValue, postToDiscord } from "./discord";
import { confirmationEmail, sendEmail } from "./email";

/** Runs after a new application is saved: applicant confirmation + exec-server ping. */
export async function notifyNewApplication(application: ApplicationRecord): Promise<void> {
  const total = await countApplications().catch(() => null);
  const team =
    application.teamMode === "team"
      ? `Team${application.teamName ? ` "${application.teamName}"` : ""} · ${
          application.teammates.length + 1
        } people listed`
      : "Solo";

  await Promise.all([
    sendEmail(confirmationEmail(application)),
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

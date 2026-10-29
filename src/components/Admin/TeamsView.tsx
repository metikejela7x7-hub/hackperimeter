"use client";

import { useEffect, useMemo, useState } from "react";
import {
  APPLICATION_STATUSES,
  EXPERIENCE_LEVELS,
  GRADUATION_YEARS,
  INTERESTS,
  labelFor,
  type ApplicationStatus,
} from "@/data/apply";
import type { ApplicationRecord } from "@/server/applications";
import styles from "./Admin.module.css";
import { TEAM_NAME_MAX, type TeamEdit } from "./teamEdits";
import { groupTeams, type Team } from "./teams";

/** Teams are 2–4 people (EVENT.teamSize). */
const MAX_TEAM_SIZE = 4;

type OnEdit = (application: ApplicationRecord, edit: TeamEdit, done: string) => Promise<boolean>;

interface TeamsViewProps {
  applications: readonly ApplicationRecord[];
  /** True while a team edit is saving. */
  busy: boolean;
  onEdit: OnEdit;
  /** The application whose status is saving, if any. */
  savingId: string | null;
  onStatus: (application: ApplicationRecord, status: ApplicationStatus) => void;
  onAcceptTeam: (members: readonly ApplicationRecord[], teamLabel: string) => void;
}

/** A member's review status, changeable right on the team card. */
function StatusSelect({
  application,
  saving,
  onStatus,
}: {
  application: ApplicationRecord;
  saving: boolean;
  onStatus: TeamsViewProps["onStatus"];
}) {
  return (
    <select
      className={styles.memberStatus}
      aria-label={`Status for ${application.fullName}`}
      value={application.status}
      disabled={saving}
      onChange={(event) => onStatus(application, event.target.value as ApplicationStatus)}
    >
      {APPLICATION_STATUSES.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

/** A dropdown of applicants; picking one runs `onPick` and resets. */
function PersonPicker({
  label,
  people,
  teamNames,
  disabled,
  onPick,
}: {
  label: string;
  people: readonly ApplicationRecord[];
  teamNames: ReadonlyMap<string, string>;
  disabled: boolean;
  onPick: (person: ApplicationRecord) => void;
}) {
  return (
    <select
      className={styles.picker}
      aria-label={label}
      value=""
      disabled={disabled || people.length === 0}
      onChange={(event) => {
        const person = people.find((p) => p.id === event.target.value);
        if (person) onPick(person);
      }}
    >
      <option value="">{label}</option>
      {people.map((person) => (
        <option key={person.id} value={person.id}>
          {person.fullName}
          {teamNames.has(person.id) ? ` (${teamNames.get(person.id)})` : " (looking)"}
        </option>
      ))}
    </select>
  );
}

function TeamName({ team, busy, onEdit }: { team: Team; busy: boolean; onEdit: OnEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(team.name ?? "");
  const anyone = team.members[0].application;

  if (!editing) {
    return (
      <>
        <h3 className={styles.teamName}>{team.name ?? "Unnamed team"}</h3>
        <button
          type="button"
          className={styles.linkButton}
          disabled={busy}
          onClick={() => {
            setDraft(team.name ?? "");
            setEditing(true);
          }}
        >
          {team.name ? "Rename" : "Add name"}
        </button>
      </>
    );
  }

  return (
    <form
      className={styles.renameForm}
      onSubmit={async (event) => {
        event.preventDefault();
        const name = draft.trim();
        const saved = await onEdit(
          anyone,
          { action: "rename", teamName: name },
          name ? `Team named “${name}”.` : "Team name cleared.",
        );
        if (saved) setEditing(false);
      }}
    >
      <input
        className={styles.input}
        aria-label="Team name"
        placeholder="Team name (optional)"
        maxLength={TEAM_NAME_MAX}
        value={draft}
        autoFocus
        onChange={(event) => setDraft(event.target.value)}
      />
      <button type="submit" className={styles.linkButton} disabled={busy}>
        Save
      </button>
      <button type="button" className={styles.linkButton} onClick={() => setEditing(false)}>
        Cancel
      </button>
    </form>
  );
}

/** Where an unapplied teammate stands (see GET /api/admin/teammates/remind). */
type ReminderStatus = "not-invited" | "invited" | { remindedAt: string };

const remindedFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

/** A member's application at a glance, with their resume. */
function MemberInfo({ application }: { application: ApplicationRecord }) {
  const rows: [string, React.ReactNode][] = [
    ["School", application.school],
    ["Major", application.major],
    ["Graduation", labelFor(GRADUATION_YEARS, application.graduationYear)],
    ["Experience", labelFor(EXPERIENCE_LEVELS, application.experience)],
    ["Interests", application.interests.map((v) => labelFor(INTERESTS, v)).join(", ")],
    [
      "Link",
      application.portfolioUrl ? (
        <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer nofollow">
          {application.portfolioUrl}
        </a>
      ) : (
        "—"
      ),
    ],
    ["Needs", application.needs ?? "—"],
  ];
  return (
    <details className={styles.memberMore}>
      <summary>Details</summary>
      <dl className={styles.memberInfo}>
        {rows.map(([term, value]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** Teams matched from applications, plus everyone still looking for one. Organizers can edit both. */
export function TeamsView({
  applications,
  busy,
  onEdit,
  savingId,
  onStatus,
  onAcceptTeam,
}: TeamsViewProps) {
  const { teams, lookingForTeam } = useMemo(() => groupTeams(applications), [applications]);
  const [statuses, setStatuses] = useState<Record<string, ReminderStatus>>({});
  const [remindingEmail, setRemindingEmail] = useState<string | null>(null);
  const [reminderMessage, setReminderMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);

  // Load who's been invited or reminded whenever the list of unapplied teammates changes.
  const missingKey = teams
    .flatMap((t) => t.missing.map((m) => m.email.toLowerCase()))
    .sort()
    .join(",");
  useEffect(() => {
    if (!missingKey) return;
    let cancelled = false;
    fetch("/api/admin/teammates/remind")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { statuses?: Record<string, ReminderStatus> } | null) => {
        if (!cancelled && body?.statuses) setStatuses(body.statuses);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [missingKey]);

  const remindOne = async (mate: { name: string; email: string }) => {
    const email = mate.email.toLowerCase();
    const status = statuses[email];
    const who = mate.name || mate.email;
    const again = typeof status === "object";
    const what = again
      ? `${who} was last reminded on ${remindedFormat.format(new Date(status.remindedAt))}. Send another reminder?`
      : status === "invited"
        ? `Send ${who} a reminder to apply?`
        : `Send ${who} an invite to apply, with their team details filled in?`;
    if (!window.confirm(what)) return;
    setRemindingEmail(email);
    setReminderMessage(null);
    try {
      const response = await fetch("/api/admin/teammates/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, again }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        invited?: number;
        reminded?: number;
      } | null;
      if (!response.ok || !body) throw new Error(body?.error ?? "Couldn't send that email.");
      if (body.invited) {
        setStatuses((current) => ({ ...current, [email]: "invited" }));
        setReminderMessage({ tone: "ok", text: `Invite sent to ${who}.` });
      } else if (body.reminded) {
        const remindedAt = new Date().toISOString();
        setStatuses((current) => ({ ...current, [email]: { remindedAt } }));
        setReminderMessage({ tone: "ok", text: `Reminder sent to ${who}.` });
      } else {
        setReminderMessage({ tone: "error", text: `Nothing was sent to ${who}.` });
      }
    } catch (error) {
      setReminderMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Couldn't send that email.",
      });
    } finally {
      setRemindingEmail(null);
    }
  };

  // Each applicant's team label, for the pickers.
  const teamNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const team of teams) {
      for (const { application } of team.members) {
        names.set(application.id, team.name ?? "unnamed team");
      }
    }
    return names;
  }, [teams]);
  const everyone = useMemo(
    () => [...applications].sort((p, q) => p.fullName.localeCompare(q.fullName)),
    [applications],
  );

  const remove = (application: ApplicationRecord, team: Team) => {
    const teamLabel = team.name ? `“${team.name}”` : "their team";
    if (
      !window.confirm(
        `Take ${application.fullName} off ${teamLabel}? They'll go back to looking for a team.`,
      )
    ) {
      return;
    }
    void onEdit(
      application,
      { action: "unlink" },
      `${application.fullName} is back to looking for a team.`,
    );
  };

  return (
    <>
      <section aria-labelledby="teams-title">
        <h2 id="teams-title" className={styles.panelTitle}>
          Teams ({teams.length})
        </h2>
        <p className={styles.muted}>
          Matched by teammate emails, then by team name. &ldquo;Name match&rdquo; means only the
          team name links that person, so double-check them. Team names are optional: add one
          whenever the team tells you.
        </p>
        {reminderMessage && (
          <p className={styles.message} role="status" data-tone={reminderMessage.tone}>
            {reminderMessage.text}
          </p>
        )}
        {teams.length === 0 ? (
          <p className={styles.muted}>No teams yet.</p>
        ) : (
          <ul className={styles.teams}>
            {teams.map((team) => {
              const size = team.members.length + team.missing.length;
              const memberIds = new Set(team.members.map((m) => m.application.id));
              return (
                <li key={team.key} className={styles.team}>
                  <div className={styles.teamHead}>
                    <TeamName team={team} busy={busy} onEdit={onEdit} />
                    <span className={styles.muted}>
                      {team.members.length} of {size} applied
                    </span>
                    {size > MAX_TEAM_SIZE && (
                      <span className={styles.flag}>Over {MAX_TEAM_SIZE} people</span>
                    )}
                    {(() => {
                      const toAccept = team.members.filter(
                        (m) => m.application.status !== "accepted",
                      ).length;
                      return toAccept === 0 ? (
                        <span className={styles.allAccepted}>All accepted</span>
                      ) : (
                        <button
                          type="button"
                          className={styles.acceptTeam}
                          disabled={savingId !== null}
                          onClick={() =>
                            onAcceptTeam(
                              team.members.map((m) => m.application),
                              team.name ?? "Unnamed team",
                            )
                          }
                        >
                          Accept team ({toAccept})
                        </button>
                      );
                    })()}
                  </div>
                  <ul className={styles.members}>
                    {team.members.map(({ application, matchedByName, alsoListedAs }) => (
                      <li
                        key={application.id}
                        className={styles.member}
                        data-status={application.status}
                      >
                        <span>
                          <strong>{application.fullName}</strong>{" "}
                          <a href={`mailto:${application.email}`}>{application.email}</a>
                          {application.hasResume && (
                            <>
                              {" · "}
                              <a
                                className={styles.resumeLink}
                                href={`/api/admin/applications/${application.id}/resume`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Resume
                              </a>
                            </>
                          )}
                        </span>
                        <span className={styles.memberTags}>
                          <StatusSelect
                            application={application}
                            saving={savingId === application.id}
                            onStatus={onStatus}
                          />
                          {matchedByName && <span className={styles.flag}>Name match</span>}
                          {alsoListedAs.length > 0 && (
                            <span title="A teammate listed this person under a different email">
                              Also listed as {alsoListedAs.join(", ")}
                            </span>
                          )}
                          {application.teamMode === "solo" && (
                            <span className={styles.flag}>Applied as looking for a team</span>
                          )}
                          <button
                            type="button"
                            className={styles.linkButton}
                            disabled={busy}
                            onClick={() => remove(application, team)}
                          >
                            Remove
                          </button>
                        </span>
                        <MemberInfo application={application} />
                      </li>
                    ))}
                    {team.missing.map((mate) => (
                      <li key={mate.email} className={styles.member} data-missing>
                        <span>
                          <strong>{mate.name || "Unnamed"}</strong>{" "}
                          <a href={`mailto:${mate.email}`}>{mate.email}</a>
                        </span>
                        <span className={styles.memberTags}>
                          <span>Hasn&rsquo;t applied · listed by {mate.listedBy.join(", ")}</span>
                          {(() => {
                            const status = statuses[mate.email.toLowerCase()];
                            const sending = remindingEmail === mate.email.toLowerCase();
                            const reminded = typeof status === "object";
                            return (
                              <>
                                {reminded && (
                                  <span className={styles.reminded}>
                                    Reminded {remindedFormat.format(new Date(status.remindedAt))} ✓
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className={styles.remindButton}
                                  disabled={remindingEmail !== null}
                                  onClick={() => void remindOne(mate)}
                                >
                                  {sending
                                    ? "Sending…"
                                    : reminded
                                      ? "Send again"
                                      : status === "invited"
                                        ? "Send reminder"
                                        : "Send invite"}
                                </button>
                              </>
                            );
                          })()}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <PersonPicker
                    label="Add someone to this team…"
                    people={everyone.filter((p) => !memberIds.has(p.id))}
                    teamNames={teamNames}
                    disabled={busy}
                    onPick={(person) =>
                      void onEdit(
                        person,
                        { action: "link", withId: team.members[0].application.id },
                        `${person.fullName} joined ${team.name ? `“${team.name}”` : "the team"}.`,
                      )
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="looking-title">
        <h2 id="looking-title" className={styles.panelTitle}>
          Looking for a team ({lookingForTeam.length})
        </h2>
        {lookingForTeam.length === 0 ? (
          <p className={styles.muted}>Nobody is looking for a team right now.</p>
        ) : (
          <ul className={styles.list}>
            {lookingForTeam.map((application) => (
              <li key={application.id} className={styles.row} data-status={application.status}>
                <div className={styles.who}>
                  <strong>{application.fullName}</strong>
                  <a href={`mailto:${application.email}`}>{application.email}</a>
                </div>
                <div className={styles.meta}>
                  <span>{application.school}</span>
                  <span>{labelFor(EXPERIENCE_LEVELS, application.experience)}</span>
                  <span>
                    {application.interests.map((value) => labelFor(INTERESTS, value)).join(", ")}
                  </span>
                  <span>{labelFor(APPLICATION_STATUSES, application.status)}</span>
                  {application.hasResume && (
                    <a
                      className={styles.resumeLink}
                      href={`/api/admin/applications/${application.id}/resume`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Resume
                    </a>
                  )}
                </div>
                <PersonPicker
                  label="Team up with…"
                  people={everyone.filter((p) => p.id !== application.id)}
                  teamNames={teamNames}
                  disabled={busy}
                  onPick={(person) =>
                    void onEdit(
                      application,
                      { action: "link", withId: person.id },
                      `${application.fullName} teamed up with ${person.fullName}.`,
                    )
                  }
                />
                <div className={styles.soloMore}>
                  <MemberInfo application={application} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

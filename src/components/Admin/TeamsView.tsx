"use client";

import { useMemo, useState } from "react";
import { APPLICATION_STATUSES, EXPERIENCE_LEVELS, INTERESTS, labelFor } from "@/data/apply";
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

/** Teams matched from applications, plus everyone still looking for one. Organizers can edit both. */
export function TeamsView({ applications, busy, onEdit }: TeamsViewProps) {
  const { teams, lookingForTeam } = useMemo(() => groupTeams(applications), [applications]);

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
                  </div>
                  <ul className={styles.members}>
                    {team.members.map(({ application, matchedByName }) => (
                      <li
                        key={application.id}
                        className={styles.member}
                        data-status={application.status}
                      >
                        <span>
                          <strong>{application.fullName}</strong>{" "}
                          <a href={`mailto:${application.email}`}>{application.email}</a>
                        </span>
                        <span className={styles.memberTags}>
                          <span>{labelFor(APPLICATION_STATUSES, application.status)}</span>
                          {matchedByName && <span className={styles.flag}>Name match</span>}
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

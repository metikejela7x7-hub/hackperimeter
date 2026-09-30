"use client";

import { useMemo, useState } from "react";
import {
  APPLICATION_STATUSES,
  EXPERIENCE_LEVELS,
  GRADUATION_YEARS,
  INTERESTS,
  labelFor,
  type ApplicationStatus,
} from "@/data/apply";
import type { ApplicationRecord } from "@/server/applications";
import type { ApplicationStats, Count } from "@/server/stats";
import styles from "./Admin.module.css";

interface DashboardProps {
  adminEmail: string;
  applications: ApplicationRecord[];
  stats: ApplicationStats;
}

const submittedFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <dt className={styles.statLabel}>{label}</dt>
      <dd className={styles.statValue}>{value}</dd>
    </div>
  );
}

function Breakdown({ title, counts }: { title: string; counts: Count[] }) {
  const max = Math.max(1, ...counts.map((c) => c.count));
  return (
    <section className={styles.panel} aria-labelledby={`breakdown-${title}`}>
      <h2 id={`breakdown-${title}`} className={styles.panelTitle}>
        {title}
      </h2>
      {counts.length === 0 ? (
        <p className={styles.muted}>No applications yet.</p>
      ) : (
        <ul className={styles.bars}>
          {counts.map(({ label, count }) => (
            <li key={label} className={styles.bar}>
              <span className={styles.barLabel}>{label}</span>
              <span className={styles.barTrack} aria-hidden="true">
                <span className={styles.barFill} style={{ width: `${(count / max) * 100}%` }} />
              </span>
              <span className={styles.barCount}>{count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Details({ application }: { application: ApplicationRecord }) {
  const mates = application.teammates.filter((mate) => mate.name || mate.email);
  return (
    <dl className={styles.details}>
      <div>
        <dt>Major</dt>
        <dd>{application.major}</dd>
      </div>
      <div>
        <dt>Graduation</dt>
        <dd>{labelFor(GRADUATION_YEARS, application.graduationYear)}</dd>
      </div>
      <div>
        <dt>Interests</dt>
        <dd>{application.interests.map((value) => labelFor(INTERESTS, value)).join(", ")}</dd>
      </div>
      <div>
        <dt>Link</dt>
        <dd>
          {application.portfolioUrl ? (
            <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer nofollow">
              {application.portfolioUrl}
            </a>
          ) : (
            "—"
          )}
        </dd>
      </div>
      {application.teamMode === "team" && (
        <div>
          <dt>Teammates</dt>
          <dd>
            {mates.length > 0
              ? mates.map((mate) => `${mate.name} (${mate.email})`).join(", ")
              : "None listed"}
          </dd>
        </div>
      )}
      <div>
        <dt>Needs</dt>
        <dd>{application.needs ?? "—"}</dd>
      </div>
    </dl>
  );
}

export function Dashboard({ adminEmail, applications: initial, stats }: DashboardProps) {
  const [applications, setApplications] = useState(initial);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>("all");
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return applications.filter(
      (a) =>
        (statusFilter === "all" || a.status === statusFilter) &&
        (!needle ||
          [a.fullName, a.email, a.school, a.teamName ?? ""].some((field) =>
            field.toLowerCase().includes(needle),
          )),
    );
  }, [applications, query, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(APPLICATION_STATUSES.map(({ value }) => [value, 0]));
    for (const a of applications) counts[a.status] += 1;
    return counts as Record<ApplicationStatus, number>;
  }, [applications]);

  const changeStatus = async (application: ApplicationRecord, status: ApplicationStatus) => {
    const previous = application.status;
    if (
      status === "accepted" &&
      !window.confirm(
        `Accept ${application.fullName}? The first acceptance emails them the Discord invite and event details.`,
      )
    ) {
      return;
    }
    setSaving(application.id);
    setMessage(null);
    setApplications((list) => list.map((a) => (a.id === application.id ? { ...a, status } : a)));
    try {
      const response = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
        acceptanceEmailQueued?: boolean;
      } | null;
      if (!response.ok) throw new Error(body?.error ?? "Couldn't save that change.");
      setMessage({
        tone: "ok",
        text: body?.acceptanceEmailQueued
          ? `${application.fullName} accepted. Acceptance email sent to ${application.email}.`
          : `${application.fullName} marked ${labelFor(APPLICATION_STATUSES, status).toLowerCase()}.`,
      });
    } catch (error) {
      setApplications((list) =>
        list.map((a) => (a.id === application.id ? { ...a, status: previous } : a)),
      );
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Couldn't save that change.",
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <main id="main" className={styles.dashboard}>
      <header className={styles.top}>
        <div>
          <p className={styles.kicker}>HackPerimeter exec</p>
          <h1 className={styles.heading}>Applications</h1>
        </div>
        <div className={styles.account}>
          <span className={styles.muted}>{adminEmail}</span>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className={styles.linkButton}>
              Sign out
            </button>
          </form>
        </div>
      </header>

      <dl className={styles.stats}>
        <Stat label="Total" value={applications.length} />
        <Stat label="Last 24 hours" value={stats.last24h} />
        {APPLICATION_STATUSES.map(({ value, label }) => (
          <Stat key={value} label={label} value={statusCounts[value]} />
        ))}
        <Stat label="With resume" value={stats.withResume} />
      </dl>

      <div className={styles.panels}>
        <Breakdown title="Experience" counts={stats.byExperience} />
        <Breakdown title="Top schools" counts={stats.topSchools} />
        <Breakdown
          title="Teams"
          counts={[
            { label: "Team", count: stats.team },
            { label: "Solo", count: stats.solo },
          ]}
        />
      </div>

      <section className={styles.panel} aria-labelledby="checkin-title">
        <h2 id="checkin-title" className={styles.panelTitle}>
          Check-in sheet
        </h2>
        <p className={styles.muted}>
          Excel file with ID-checked and joined-Discord boxes. A row turns green once both are
          ticked. Setup steps are on the file&rsquo;s &ldquo;How to use&rdquo; tab.
        </p>
        <div className={styles.downloads}>
          <a className={styles.download} href="/api/admin/checkin-sheet?status=accepted">
            Download accepted ({statusCounts.accepted})
          </a>
          <a className={styles.download} href="/api/admin/checkin-sheet?status=all">
            Download everyone ({applications.length})
          </a>
        </div>
      </section>

      <section aria-labelledby="list-title">
        <div className={styles.toolbar}>
          <h2 id="list-title" className={styles.panelTitle}>
            All applications
          </h2>
          <input
            type="search"
            className={styles.input}
            placeholder="Search name, email, school, team"
            aria-label="Search applications"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className={styles.input}
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          >
            <option value="all">All statuses</option>
            {APPLICATION_STATUSES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <p className={styles.message} role="status" data-tone={message?.tone}>
          {message?.text ?? ""}
        </p>

        {visible.length === 0 ? (
          <p className={styles.muted}>
            {applications.length === 0 ? "No applications yet." : "Nothing matches that search."}
          </p>
        ) : (
          <ul className={styles.list}>
            {visible.map((application) => (
              <li key={application.id} className={styles.row} data-status={application.status}>
                <div className={styles.who}>
                  <strong>{application.fullName}</strong>
                  <a href={`mailto:${application.email}`}>{application.email}</a>
                </div>
                <div className={styles.meta}>
                  <span>{application.school}</span>
                  <span>{labelFor(EXPERIENCE_LEVELS, application.experience)}</span>
                  <span>
                    {application.teamMode === "team"
                      ? `Team${application.teamName ? `: ${application.teamName}` : ""}`
                      : "Solo"}
                  </span>
                  <span>{submittedFormat.format(new Date(application.createdAt))}</span>
                  {application.hasResume && (
                    <a
                      href={`/api/admin/applications/${application.id}/resume`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Resume
                    </a>
                  )}
                </div>
                <select
                  className={styles.status}
                  aria-label={`Status for ${application.fullName}`}
                  value={application.status}
                  disabled={saving === application.id}
                  onChange={(event) =>
                    void changeStatus(application, event.target.value as ApplicationStatus)
                  }
                >
                  {APPLICATION_STATUSES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <details className={styles.more}>
                  <summary>Details</summary>
                  <Details application={application} />
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

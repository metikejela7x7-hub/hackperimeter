import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Admin/Dashboard";
import { listApplications } from "@/server/applications";
import { getAdmin } from "@/server/auth";
import { MissingConfigError } from "@/server/env";
import { computeStats } from "@/server/stats";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let admin;
  try {
    admin = await getAdmin();
  } catch (error) {
    if (!(error instanceof MissingConfigError)) throw error;
    return (
      <main id="main" className={styles.narrow}>
        <p className={styles.kicker}>Setup needed</p>
        <h1 className={styles.title}>The backend isn&rsquo;t connected yet</h1>
        <p className={styles.muted}>
          Set <span className={styles.code}>{error.variable}</span> and the other values from{" "}
          <span className={styles.code}>.env.example</span>. SETUP.md walks through it.
        </p>
      </main>
    );
  }
  if (!admin) redirect("/admin/login");

  const applications = await listApplications();
  return (
    <Dashboard
      adminEmail={admin.email}
      applications={applications}
      stats={computeStats(applications)}
    />
  );
}

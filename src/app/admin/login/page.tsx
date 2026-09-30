import { LoginForm } from "@/components/Admin/LoginForm";
import styles from "../admin.module.css";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main id="main" className={styles.narrow}>
      <p className={styles.kicker}>HackPerimeter exec</p>
      <h1 className={styles.title}>Admin sign-in</h1>
      <p className={styles.muted}>
        Enter your email and we&rsquo;ll send you a sign-in link. Only emails on the exec
        allowlist get one.
      </p>
      <LoginForm
        initialError={
          error === "link" ? "That sign-in link has expired, was already used, or was opened in a different browser. Request a new one and open it in this browser." : ""
        }
      />
    </main>
  );
}

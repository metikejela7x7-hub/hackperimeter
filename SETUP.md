# Backend setup

Do these once, in order. Each step says exactly which value to copy and
where it goes. Keep a scratch note open to collect the values; you'll paste
them into `.env.local` (for your computer) and into Vercel (for the live site).

Total time: about 30–45 minutes.

---

## 1. Supabase (database, resume storage, admin login)

1. Go to <https://supabase.com>, sign up (GitHub login is easiest), and click
   **New project**. Name it `hackperimeter`, generate a database password (save
   it somewhere safe), pick the **East US** region, and create it. Wait ~2 minutes.
2. In the left sidebar open **SQL Editor** → **New query**. Open
   `supabase/migrations/0001_init.sql` from this repo, paste the whole file in,
   and click **Run**. You should see "Success. No rows returned."
   This creates the tables, the private `resumes` storage bucket, and the
   rate limiter.
3. Open **Project Settings** (gear icon) → **API** (it may be called
   **Data API** / **API Keys**). Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click reveal) → `SUPABASE_SERVICE_ROLE_KEY`

   The service_role key can read and delete everything. Never paste it into
   Discord, a screenshot, or frontend code.
4. Leave the email templates alone. Admin sign-in works with Supabase's
   default Magic Link email; open the link in the same browser you
   requested it from. Note: Supabase's built-in email only delivers to
   members of your Supabase team (**Organization → Team → Invite**), a few
   per hour. That is fine for a handful of execs; for more, set up custom
   SMTP with Resend under **Authentication → Emails → SMTP Settings**.
5. Open **Authentication** → **URL Configuration**. Set **Site URL** to
   `http://localhost:3000` for now, and under **Redirect URLs** add
   `http://localhost:3000/**`. In step 4 you'll add the real site URL too.

## 2. Resend (emails to applicants)

1. Sign up at <https://resend.com>.
2. **API Keys** → **Create API key** (permission: Sending access) → copy it
   → `RESEND_API_KEY`.
3. To email applicants, Resend needs a domain you own: **Domains** → **Add
   domain**, then add the DNS records it shows at wherever the domain is
   registered. Once it says **Verified**, set
   `EMAIL_FROM=HackPerimeter <team@yourdomain.com>`.

   Until then, leave `EMAIL_FROM` blank. Resend's test sender only delivers
   to the email you signed up with, which is enough for testing.

## 3. Discord (signup pings and daily recaps)

1. In your exec server, open the channel for notifications → **Edit
   Channel** (gear) → **Integrations** → **Webhooks** → **New Webhook**. Name
   it "HackPerimeter", click **Copy Webhook URL** → `DISCORD_WEBHOOK_URL`.
2. For acceptance emails: in the *participant* server, right-click a welcome
   channel → **Invite People** → **Edit invite link** → expire **Never**, max
   uses **No limit** → copy → `DISCORD_INVITE_URL`.

## 4. Vercel (hosting, cron jobs, analytics)

1. Sign up at <https://vercel.com> with GitHub. Vercel needs access to the
   `metikejela7x7-hub/hackperimeter` repo. If it isn't listed on import, that
   account's owner needs to add Vercel or transfer the repo to you.
2. **Add New** → **Project** → import `hackperimeter`. Before clicking
   Deploy, open **Environment Variables** and add every value from your
   note, plus:
   - `ADMIN_EMAILS`: exec emails, comma-separated (e.g. `you@gmail.com,cofounder@gmail.com`)
   - `CRON_SECRET`: any long random string (e.g. run `openssl rand -hex 32`)
   - `NEXT_PUBLIC_SITE_URL`: leave out for now
3. Click **Deploy**. When it finishes, copy the site URL (e.g.
   `https://hackperimeter.vercel.app`). Then:
   - In Vercel **Settings → Environment Variables**, add
     `NEXT_PUBLIC_SITE_URL` with that URL, then **Deployments → ⋯ → Redeploy**.
   - In Supabase **Authentication → URL Configuration**, set **Site URL** to
     that URL and add `<that URL>/**` under **Redirect URLs**.
4. **Analytics** tab → **Enable**. Visitor stats start appearing after deploy.
5. The daily recap (9 AM Eastern) and maintenance job (resume cleanup) are
   set up automatically from `vercel.json`. They appear under **Settings →
   Cron Jobs**, and you can click **Run** there to test the recap right away.

The old GitHub Pages deploy was removed: Pages can only host static files,
and the site now has a server. Turn Pages off in the GitHub repo's
**Settings → Pages** so the stale copy doesn't linger.

## 5. Running it on your computer

```bash
cp .env.example .env.local
```

Fill in `.env.local` with the same values (keep
`NEXT_PUBLIC_SITE_URL=http://localhost:3000`), then:

```bash
npm run dev
```

- <http://localhost:3000/apply> submits real applications into Supabase.
- <http://localhost:3000/admin> is the dashboard. Enter an `ADMIN_EMAILS`
  address and click the emailed link.

## 6. Check that everything works

1. Submit a test application with a resume at `/apply`.
2. Check that the Discord channel got a "New application" message, and the
   applicant email got a confirmation (if Resend is set up).
3. In `/admin`, find the application, open the resume, set it to
   **Accepted** (this sends the acceptance email once), and download the
   check-in sheet.
4. In Vercel **Cron Jobs**, run `/api/cron/daily-recap` and check Discord.
5. Delete the test row in Supabase **Table Editor → applications** before
   launch.

## Day-of check-in

In `/admin`, click **Download accepted**. Open it in Excel or Google Sheets
and follow the **How to use** tab: select the ID-checked and Joined-Discord
columns and choose **Insert → Checkbox**. A row turns green once both are
ticked, and the How-to tab counts everyone who is checked in.

## Tests

```bash
npm test
```

```bash
npm run test:e2e
```

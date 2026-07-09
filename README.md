# [Company] Hub — setup guide

This is a full internal site: a homepage, an apps directory, an employee photo
store, and an admin dashboard to manage both — without ever touching code again
once it's live.

It's built for **Cloudflare Pages**, using:
- **Pages Functions** — the backend (in `/functions`)
- **D1** — a database for your apps list and photo records
- **R2** — storage for the actual photo files

Everything below is done through the Cloudflare dashboard in your browser.
You'll only touch a terminal once, briefly, to run the first deploy.

---

## 1. Create a Cloudflare account
Go to https://dash.cloudflare.com/sign-up if you don't have one. Free plan is fine.

## 2. Create the D1 database
1. In the Cloudflare dashboard, go to **Workers & Pages → D1**.
2. Click **Create database**, name it `company-hub-db`.
3. Once created, open it, go to the **Console** tab, and paste in the contents
   of `schema.sql` (included in this project), then run it. This creates your
   `apps` and `images` tables.
4. Copy the **Database ID** shown on the database's overview page.
5. Open `wrangler.toml` in this project and paste that ID in place of
   `REPLACE_WITH_YOUR_DATABASE_ID`.

## 3. Create the R2 bucket
1. Go to **R2** in the dashboard.
2. Click **Create bucket**, name it `company-hub-images` (or update
   `wrangler.toml` if you pick a different name).
3. Nothing else needed here yet — the binding happens in step 5.

## 4. Set your admin password
You'll need a terminal for a one-time setup step (installing Wrangler, Cloudflare's
CLI). This is the only command-line part of the whole process:

```bash
npm install -g wrangler
wrangler login
```

This opens a browser window to connect Wrangler to your Cloudflare account.

## 5. Deploy the site
From inside this project folder:

```bash
wrangler pages deploy .
```

The first time, it'll ask you to name the project — use `company-hub` (or
anything you like; just note the `.pages.dev` URL it gives you).

Once deployed, go to **Workers & Pages → your project → Settings → Bindings**
and add:
- **D1 database binding** — variable name `DB`, pick `company-hub-db`
- **R2 bucket binding** — variable name `BUCKET`, pick `company-hub-images`
- **Environment variable** — `ADMIN_PASSWORD`, set to whatever password you want to log into `/admin.html` with. Click **Encrypt** to store it as a secret.
- **Environment variable** — `SESSION_SECRET`, set to any long random string (e.g. mash your keyboard for 40 characters). Click **Encrypt** here too.

Redeploy once (`wrangler pages deploy .` again) so the bindings take effect.

## 6. You're live
Visit your `*.pages.dev` URL. From here on, **everything is done through the
website**:
- `/admin.html` — log in with your `ADMIN_PASSWORD`, add apps, upload employee
  photos, remove either.
- `/apps.html` — public directory of whatever apps you've added.
- `/team.html` — public gallery of whatever photos you've uploaded.

You never need to redeploy or touch these files again for day-to-day content —
only if you want to change the design itself.

---

## Before you launch: two things worth doing

**1. Replace the placeholders.** Search each HTML file for `[Company]` and
swap in your real name/logo. That's the only placeholder text in the project.

**2. Decide how private this needs to be.** Right now, `/admin.html` is
password-protected, but the public pages (`apps.html`, `team.html`) and their
API routes are visible to anyone with the URL — there's no login wall on the
*viewing* side. If these photos are meant to be internal-only rather than
just "not linked from Google," add **Cloudflare Access** (in Zero Trust →
Access → Applications) in front of the whole `*.pages.dev` domain, so every
visitor needs to authenticate (e.g. via email code or Google login) before
seeing anything at all. This is a dashboard toggle, not code — a couple of
minutes to set up.

---

## Adding your custom app later
Any app — internal or external — just needs a URL. Once it's built and hosted
somewhere (even a separate Cloudflare Pages project), add it from
`/admin.html → Apps → Add app` with its name, link, and a short description.
It'll show up on `/apps.html` immediately, no redeploy required.

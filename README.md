# AcademyHub — Standalone MVP

A local Sports Academy Management Platform built with Node.js, Express, PostgreSQL, HTML/CSS/JavaScript and Chart.js.

## Requirements

- Node.js 18+ (20+ recommended)
- PostgreSQL 14+
- A modern browser

## Installation

1. Extract the ZIP.
2. Open a terminal in the `AcademyHub` folder.
3. Copy `.env.example` to `.env`.
4. Edit `.env` and set your PostgreSQL password.
5. Install dependencies:

```bash
npm install
```

6. Create the database, schema, and demo data:

```bash
npm run setup
```

7. Start the application:

```bash
npm start
```

8. Open:

http://localhost:3000

## PostgreSQL notes

The setup script connects to the PostgreSQL `postgres` database first and creates the `academyhub` database if it does not exist. Your PostgreSQL user must have permission to create databases.

If you already created `academyhub`, the script simply uses it.

## Demo data

The seed creates 18 fictional players, subscriptions with active/expiring/expired states, attendance records, renewal notifications, notes-ready player profiles, and activity records.

No real personal data is included.

## Main features

- Dashboard KPIs and revenue chart
- Player search, filtering, add/edit/delete/view
- Player profiles
- Subscription creation and renewal
- Automatic Active / Expiring Soon / Expired status
- Attendance marking
- Renewal notifications
- Academy settings
- Multi-user staff accounts with Admin/Staff roles
- PostgreSQL persistence

## Project structure

```text
AcademyHub/
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── backend/
│   ├── server.js
│   ├── setup.js
│   └── seed.js
├── database/
│   └── schema.sql
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Deploying so others can use it without installing anything

This repo includes a `render.yaml` for one-click deployment on [Render](https://render.com):

1. Push this repo to GitHub (already done if you're reading this from there).
2. In Render, click **New > Blueprint**, connect this repo, and Render will read `render.yaml` and provision both the web service and a managed Postgres database automatically.
3. Render will prompt you to fill in three secret values it can't generate itself: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `AUTH_SECRET` (a random string, 32+ characters — quote it if it contains `#`, since `.env` parsing treats `#` as a comment start). These bootstrap the first Admin account only — see "Staff accounts" below.
4. Create the schema once. The web service's **Shell** tab needs a paid Render plan, so on the free tier run the migration from your own machine instead: open the `academyhub-db` database's **Connect > External** tab, copy the **External Database URL**, then from this project folder run:
   ```powershell
   $env:DATABASE_URL="<paste the External Database URL>"
   $env:DB_SSL="true"
   npm run migrate
   # optionally: npm run seed
   ```
5. Visit the `.onrender.com` URL Render gives the web service — that's now a shared link anyone can open, no local setup required.

The free tier spins down after inactivity and takes ~30-60s to wake up on the next visit — fine for sharing with a team, not for serious production traffic.

## Staff accounts

Login isn't a single shared password — each person gets their own account from the **Staff** page (Admin role only, appears in the sidebar once you're signed in as an Admin). `ADMIN_USERNAME`/`ADMIN_PASSWORD` only matter once: on first startup, if the `staff_users` table is empty, they're used to create the initial Admin account. After that, manage everyone (including resetting the bootstrap admin's own password) from the Staff page instead of editing `.env`.

Two roles: **Admin** (everything, including adding/removing staff) and **Staff** (everything except staff management). The app always keeps at least one Admin account — you can't delete the last one or delete the account you're currently signed in as.

## Troubleshooting

**password authentication failed**  
Check `DB_USER` and `DB_PASSWORD` in `.env`.

**ECONNREFUSED 127.0.0.1:5432**  
Start PostgreSQL and retry `npm run setup`.

**database already exists**  
That is fine; `npm run setup` will reuse it.

**Port 3000 is busy**  
Change `PORT=3001` in `.env`, then open `http://localhost:3001`.

## Important

This is a standalone local version. It does not depend on Hatchable and can be run independently on your laptop.

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

# KSX Engine

A deal workspace for search fund operators: find lower-middle-market companies, score them against a buy box, and manage every deal from first email to close.

Built as a concept for the Kingsway Search Xcelerator. Not affiliated with Kingsway. All company and contact data is fictional.

## Run it

Requires Node 20+.

```bash
git clone https://github.com/TUTULEMAN/ksx-engine.git
cd ksx-engine
npm install
npm run dev
```

Open http://localhost:5173. The landing page is at `/` and the workspace is at `/app`.

## What you can do

| Page | Use it to |
| --- | --- |
| Sourcing | Search and filter companies, save searches, add a company to your pipeline |
| Pipeline | Drag deals between stages. Moving to LOI adds a diligence checklist |
| Deal page | Keep the thesis, contacts, emails, tasks, documents, and notes for one deal |
| Valuation | Model price, debt, cash flow, and returns |
| Outreach | Write email templates and run follow-up sequences |
| Tasks | See what's overdue, due today, and coming up |
| Contacts | Track owners, brokers, lenders, and advisors |
| Documents | Upload NDAs, CIMs, financials, and LOIs per deal |
| Settings | Change your buy box and signature, export or reset data |

## Good to know

- **No backend.** Data is saved in your browser. Use Settings to export, import, or reset to the demo data.
- **Email** opens a pre-filled draft in Gmail, Outlook, or your mail app and logs it as sent. Nothing is sent automatically.
- **Fit score** (A–D) compares each company to the buy box in Settings. The default buy box is $1–5M EBITDA, 15%+ margin, $5–30M revenue, and mostly recurring revenue.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck and build to `dist/` |
| `npm run preview` | Serve the production build |

## Code layout

```
src/
  pages/        one file per screen
  components/   shared UI (forms, tables, valuation model)
  lib/          data store, sample data, scoring, valuation math
```

Stack: React, TypeScript, Vite, Tailwind CSS, Zustand.

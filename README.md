# ARICT Past Paper Portal

A web application for the **Association of Rajarata Information & Communication Technology (ARICT)** that lets students browse, search, and download past examination papers. Paper metadata is stored in **PostgreSQL (Neon)**; PDF files are uploaded to **Google Drive** via server-side APIs. A dedicated **admin** area provides a dashboard and full CRUD for managing papers. Students can **request missing papers** through an EmailJS-powered form.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Routes & Pages](#routes--pages)
- [API Routes](#api-routes)
- [Data Model (PostgreSQL)](#data-model-postgresql)
- [Google Drive Integration](#google-drive-integration)
- [How It Works](#how-it-works)
- [Client Library (`src/lib/papers.js`)](#client-library-srclibpapersjs)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Admin Area](#admin-area)
- [Request a Paper (EmailJS)](#request-a-paper-emailjs)
- [Components](#components)
- [Styling & Design](#styling--design)
- [Fallback Data](#fallback-data)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Known Limitations](#known-limitations)
- [Contributing & Policies](#contributing--policies)
- [License](#license)

---

## Overview

This is a [Next.js](https://nextjs.org) App Router application that serves as a **past paper archive** for ARICT students.

**Public site** (`src/app/(public)/`):

- Searchable catalog across five academic departments
- Department cards with live paper and course counts
- Browse by examination period (home page links → search with `?years=`)
- Filters for department, academic year (Year 1–4), and semester
- Paper detail pages with Google Drive PDF preview and download
- Static pages (About, Faculty)
- **Request Paper** modal — students submit missing-paper requests by email

**Admin area** (`src/app/admin/`):

- Dashboard with stats and recently added papers
- Add papers by uploading a PDF (stored in Google Drive + metadata in Neon)
- Manage, edit, and delete papers
- Dedicated admin layout (sidebar + top bar), separate from the public header/footer

Admin routes are **not linked** in the public navigation and are **not protected by login middleware** in the current codebase. Google OAuth in this project is used to **authorize Drive uploads**, not to gate admin pages.

---

## Features

### Public site

| Feature | Description |
|--------|-------------|
| **Home** | Hero search, department cards (paper + course counts from API), browse-by-examination-period cards |
| **Search / Papers** | Full paper list with text search, sidebar filters, compact grid / list views, real pagination |
| **Paper detail** | Metadata, Google Drive PDF preview, download, related papers from same department |
| **About / Faculty** | Static content about ARICT and faculty support |
| **Request Paper** | Modal form (header button) sends requests to ARICT via EmailJS |

### Admin

| Feature | Route | Description |
|--------|-------|-------------|
| **Dashboard** | `/admin` | Total papers, per-department counts, largest department, recent papers table |
| **Add paper** | `/admin/add-paper` | Upload PDF → Google Drive + save metadata in PostgreSQL |
| **Manage papers** | `/admin/papers` | Search/filter; view, edit, or delete |
| **Edit paper** | `/admin/papers/edit/[id]` | Update metadata; optionally replace PDF (re-uploads to Drive) |

### Planned (not implemented yet)

- Admin authentication and route protection (login for `/admin/*`)
- Analytics, bulk import, admin user management (noted on dashboard “Coming Soon” panel)
- Examination-period filter UI in search sidebar (logic exists; UI is commented out)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) |
| Database | [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech) (`pg`) |
| File storage | [Google Drive API](https://developers.google.com/drive) (`googleapis`) |
| Email (requests) | [EmailJS](https://www.emailjs.com/) (`@emailjs/browser`) |
| Icons | [Material Symbols](https://fonts.google.com/icons), [Lucide React](https://lucide.dev) |
| Fonts | Hanken Grotesk, Public Sans (Google Fonts) |
| Linting | ESLint with `eslint-config-next` |

**Server-side:** Next.js Route Handlers under `src/app/api/` perform database access and Google Drive uploads. **Client-side:** pages call those APIs through helpers in `src/lib/papers.js`.

There is **no** Firebase in the current codebase.

---

## Architecture

```mermaid
flowchart TB
  subgraph Browser["Browser"]
    PublicPages["(public) pages"]
    AdminPages["admin pages"]
    ClientLib["src/lib/papers.js"]
    RequestModal["RequestPaperModal → EmailJS"]
  end

  subgraph NextServer["Next.js server"]
    API["/api/papers, /api/papers/[id]"]
    DriveLib["src/lib/server/drive.js"]
    Repo["src/lib/server/papersRepository.js"]
    DB["src/lib/server/db.js"]
  end

  subgraph Data["Data & storage"]
    Neon["PostgreSQL (Neon)"]
    GDrive["Google Drive"]
  end

  PublicPages --> ClientLib
  AdminPages --> ClientLib
  ClientLib --> API
  API --> Repo
  API --> DriveLib
  Repo --> DB
  DB --> Neon
  DriveLib --> GDrive
  RequestModal --> ARICTEmail["arict@as.rjt.ac.lk"]
```

**Data flow summary:**

1. Public and admin UIs call `fetch("/api/papers")` (via `src/lib/papers.js`).
2. **Create/update** sends `multipart/form-data` with metadata + PDF file.
3. The API uploads the PDF to Google Drive under `{Department} / Year {n} / Semester {n}` inside a configured root folder, sets “anyone with link” read access, and stores Drive URLs + metadata in PostgreSQL.
4. **Read** returns normalized paper objects; the client maps them for display (exam period, academic year, semester labels, etc.).
5. On API failure, search and paper detail can fall back to **local sample data** in `src/data/papers.js`.

---

## Project Structure

```
arict-past-paper-portal/
├── public/                              # Static assets (logo, icons)
├── src/
│   ├── app/
│   │   ├── layout.js                    # Root layout (fonts, metadata)
│   │   ├── globals.css
│   │   ├── api/
│   │   │   ├── papers/
│   │   │   │   ├── route.js             # GET list, POST create
│   │   │   │   └── [id]/route.js        # GET, PUT, DELETE one paper
│   │   │   └── auth/google/
│   │   │       ├── route.js             # Start OAuth (Drive setup)
│   │   │       └── callback/route.js    # Exchange code → refresh token
│   │   ├── (public)/                    # Public route group
│   │   │   ├── layout.js                # Header + Footer
│   │   │   ├── page.js                  # Home
│   │   │   ├── about/page.js
│   │   │   ├── faculty/page.js
│   │   │   ├── search/page.js
│   │   │   └── paper/[id]/page.js
│   │   └── admin/                       # Admin route group
│   │       ├── layout.js                # Sidebar + top bar
│   │       ├── page.js                  # Dashboard
│   │       ├── add-paper/page.js
│   │       ├── papers/page.js
│   │       ├── papers/edit/[id]/page.js
│   │       └── papers/[department]/[id]/page.js  # legacy edit URL
│   ├── components/
│   │   ├── admin/                       # AdminSidebar, PaperForm, PapersTable, …
│   │   └── …                            # Public UI
│   ├── data/
│   │   ├── departments.js
│   │   └── papers.js                    # Local fallback + filter helpers
│   └── lib/
│       ├── constants.js                 # Departments, admin nav, official email
│       ├── papers.js                    # Client API helpers + normalization
│       └── server/
│           ├── db.js                    # Pool, schema bootstrap
│           ├── papersRepository.js      # CRUD SQL
│           └── drive.js                   # Google Drive upload + OAuth helpers
├── .env.local                           # Secrets (create locally; not committed)
├── next.config.mjs
├── jsconfig.json                        # @/* → src/*
└── package.json
```

Path alias: `@/components/Header` → `src/components/Header`.

---

## Routes & Pages

### Public routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `src/app/(public)/page.js` | Home: search, departments, exam periods |
| `/search` | `src/app/(public)/search/page.js` | Papers listing; `?q=`, `?years=` (exam periods) |
| `/paper/[id]` | `src/app/(public)/paper/[id]/page.js` | Paper detail; optional `?dept=` |
| `/about` | `src/app/(public)/about/page.js` | About ARICT |
| `/faculty` | `src/app/(public)/faculty/page.js` | Faculty information |

**URL examples:**

- Search by text: `/search?q=ICT3214`
- Filter by exam period (from home): `/search?years=March%20%7C%20May%202026`
- Paper detail: `/paper/{uuid}?dept=Computing`  
  (`id` is the PostgreSQL UUID; `dept` is optional but helps routing/display)

### Admin routes

| Route | File | Purpose |
|-------|------|---------|
| `/admin` | `src/app/admin/page.js` | Dashboard |
| `/admin/add-paper` | `src/app/admin/add-paper/page.js` | Upload new paper |
| `/admin/papers` | `src/app/admin/papers/page.js` | Manage all papers |
| `/admin/papers/edit/[id]` | `src/app/admin/papers/edit/[id]/page.js` | **Primary** edit route |
| `/admin/papers/[department]/[id]` | `src/app/admin/papers/[department]/[id]/page.js` | Legacy edit URL (still works) |

### Navigation

**Public header:** Departments, Papers, Faculty, About Us, **Request Paper**

**Admin sidebar:** Dashboard, Add Paper, Manage Papers, View Site → `/`

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/papers` | List papers. Query: `department`, `year` (1–4), `semester` (1–2) |
| `POST` | `/api/papers` | Create paper. `multipart/form-data`: metadata + required `file` (PDF) |
| `GET` | `/api/papers/[id]` | Get one paper by UUID |
| `PUT` | `/api/papers/[id]` | Update paper. Optional new `file` replaces Drive upload |
| `DELETE` | `/api/papers/[id]` | Delete paper record (does not delete Drive file) |
| `GET` | `/api/auth/google` | Redirect to Google OAuth (one-time Drive setup) |
| `GET` | `/api/auth/google/callback` | OAuth callback; displays `GOOGLE_OAUTH_REFRESH_TOKEN` to copy |

Implementation:

- `src/app/api/papers/route.js` — list + create
- `src/app/api/papers/[id]/route.js` — get, update, delete
- `src/lib/server/papersRepository.js` — SQL layer
- `src/lib/server/drive.js` — upload + folder creation + OAuth

---

## Data Model (PostgreSQL)

Schema is created automatically on first use (`ensureSchema()` in `src/lib/server/db.js`).

### `papers` table

| Column | Type | Notes |
|--------|------|--------|
| `id` | `TEXT` (UUID) | Primary key |
| `subject_code` | `TEXT` | Required, e.g. `ICT3214` |
| `subject_name` | `TEXT` | Required |
| `instructor` | `TEXT` | Optional |
| `department` | `TEXT` | One of five department names |
| `year` | `INTEGER` | Academic year **1–4** (not calendar year) |
| `semester` | `INTEGER` | **1** or **2** |
| `exam_period` | `TEXT` | e.g. `March \| May 2026` |
| `drive_file_id` | `TEXT` | Google Drive file ID |
| `drive_link` | `TEXT` | View link |
| `drive_preview_link` | `TEXT` | Preview URL |
| `drive_folder_path` | `TEXT` | e.g. `Computing / Year 2 / Semester 1` |
| `created_at` | `TIMESTAMPTZ` | Auto |
| `updated_at` | `TIMESTAMPTZ` | Auto on update |

Indexes exist on `department`, `year`, `semester`, `exam_period`, and `created_at`.

### Departments

Defined in `src/data/departments.js` (must match DB/API validation):

| Name | Slug |
|------|------|
| Biological Sciences | `biological-sciences` |
| Chemical Sciences | `chemical-sciences` |
| Computing | `computing` |
| Health Promotion | `health-promotion` |
| Physical Sciences | `physical-sciences` |

### Client-normalized paper object

After `normalizePaper()` in `src/lib/papers.js`:

```js
{
  id: "Computing-{uuid}",       // composite display id
  docId: "{uuid}",              // PostgreSQL id
  courseCode, title, instructor,
  department, departmentFull,
  examPeriod,                  // e.g. "March | May 2026"
  academicYear: "Year 2",      // from DB year column
  semester: "Semester 1",
  yearNumber: 2, semesterNumber: 1,
  driveLink,
  createdAt, updatedAt         // ISO strings from API
}
```

---

## Google Drive Integration

### Folder layout

On upload, the server ensures nested folders under `GOOGLE_DRIVE_ROOT_FOLDER_ID`:

```
{Root}/
  {Department}/
    Year {1|2|3|4}/
      Semester {1|2}/
        {uploaded-file.pdf}
```

### Authentication modes

The Drive client (`src/lib/server/drive.js`) supports:

| Mode | Env vars | When to use |
|------|----------|-------------|
| **OAuth (recommended)** | `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` | Upload to **your** My Drive; avoids service-account storage quota errors |
| **Service account** | `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY` (or `GOOGLE_SERVICE_ACCOUNT_JSON`) | Shared drives / automation; may need domain-wide delegation (`GOOGLE_DRIVE_DELEGATED_USER`) |
| **Shared drive flag** | `GOOGLE_DRIVE_USE_SHARED_DRIVE=true` | When using Google Shared Drives |

### One-time OAuth setup

1. Create an OAuth **Web client** in Google Cloud Console with redirect URI:  
   `http://localhost:3000/api/auth/google/callback` (and production URL on Vercel).
2. Set `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET`.
3. Visit `/api/auth/google` while `npm run dev` is running; sign in and consent.
4. Copy the refresh token from the callback page into `GOOGLE_OAUTH_REFRESH_TOKEN`.
5. Set `GOOGLE_DRIVE_ROOT_FOLDER_ID` to a folder in the Google account that owns the token.
6. Redeploy / restart the app.

Uploaded files are made **readable by anyone with the link** (`permissions.create` with `type: anyone`, `role: reader`).

---

## How It Works

### Home page (`/`)

1. `fetchAllPapers()` → `GET /api/papers`.
2. `applyDepartmentStats()` sets `paperCount` and `courseCount` (unique subject codes) per department.
3. Unique `examPeriod` values are sorted and passed to `BrowseByExamPeriod` (links to `/search?years=…`).

### Search page (`/search`)

1. Loads all papers from the API.
2. Text filter via `filterPapers()` (`src/data/papers.js`).
3. Sidebar filters: department, academic year, semester. Exam-period filter applies when `?years=` is in the URL (home page links); the sidebar UI for exam periods is temporarily hidden in code.
4. Pagination: **9** papers per page (compact), **5** (list); scrolls to results on page change.
5. On API error: falls back to local `papers` array.

### Paper detail (`/paper/[id]`)

1. Extracts UUID from `id` param.
2. `fetchPaperById(dept, uuid)` → `GET /api/papers/{id}`.
3. Related papers: same department, up to 3 others from full list.
4. Preview/download via `getPreviewUrl` / `getDownloadUrl` on stored `driveLink`.
5. On failure: local fallback via `getPaperById()`.

### Admin add paper

1. `PaperForm` collects subject code/name, exam period, academic year (1–4), semester (1–2), department, instructor, and **required PDF**.
2. `createPaper(form, file)` → `POST /api/papers` with `FormData`.
3. Server uploads to Drive, inserts row in PostgreSQL, returns created paper.

### Admin edit paper

1. Load via `GET /api/papers/{id}`.
2. `PUT` with updated fields; optional new PDF triggers a new Drive upload and updates drive columns.
3. Department change updates the `department` column only (no cross-collection move like the old Firestore model).

### Admin delete

1. `DELETE /api/papers/{id}` removes the database row only.

---

## Client Library (`src/lib/papers.js`)

Shared by public and admin UIs:

| Export | Purpose |
|--------|---------|
| `extractDriveId`, `getPreviewUrl`, `getDownloadUrl` | Google Drive URL helpers |
| `normalizePaper`, `paperToForm`, `getPaperRouteId` | Shape API data / forms / routes |
| `fetchAllPapers`, `fetchPaperById` | `GET` API wrappers |
| `createPaper`, `updatePaper`, `deletePaper` | `POST` / `PUT` / `DELETE` with `FormData` |
| `sortPapersByDate`, `getDepartmentStats`, `applyDepartmentStats` | Dashboard / home stats |
| `filterAdminPapers` | Admin table search |
| `sortExamPeriods`, `sortAcademicYears`, `sortSemesters` | Filter option ordering |

Server logic lives in `src/lib/server/` — not imported from client components except via API routes.

---

## Environment Variables

Create **`.env.local`** in the project root. **Do not commit** real values.

### Database (required)

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

Neon connection string from the [Neon console](https://console.neon.tech). SSL is enabled in code (`rejectUnauthorized: false` for managed Neon).

### Google Drive (required for uploads)

```env
GOOGLE_DRIVE_ROOT_FOLDER_ID=your_folder_id

# Option A — OAuth (recommended)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REFRESH_TOKEN=
# Optional override:
# GOOGLE_OAUTH_REDIRECT_URI=https://your-domain.com/api/auth/google/callback

# Option B — Service account
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Or single JSON blob:
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Optional
# GOOGLE_DRIVE_DELEGATED_USER=user@yourdomain.com
# GOOGLE_IMPERSONATE_USER=user@yourdomain.com
# GOOGLE_DRIVE_USE_SHARED_DRIVE=true
```

### EmailJS (optional — Request Paper modal)

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=
```

Template should send to `arict@as.rjt.ac.lk` (`ARICT_OFFICIAL_EMAIL` in `src/lib/constants.js`). Variables: `to_email`, `from_name`, `reply_to`, `student_name`, `student_email`, `subject_code`, `subject_name`, `department`, `exam_year`, `message`.

| File | Notes |
|------|--------|
| `.env.local` | Loaded automatically by Next.js (gitignored) |
| `env.local` | Also gitignored; prefer `.env.local` |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+ (LTS recommended)
- npm (or yarn / pnpm / bun)
- Neon (or other PostgreSQL) database
- Google Cloud project with Drive API enabled
- (Optional) EmailJS account for paper requests

### Install and run

```bash
git clone <repository-url>
cd arict-past-paper-portal

npm install

# Create .env.local with DATABASE_URL and Google Drive vars

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The `papers` table is created on first API request. Complete Google OAuth setup (see [Google Drive Integration](#google-drive-integration)) before using **Add Paper**.

### Production build

```bash
npm run build
npm start
```

Set the same environment variables on your host (e.g. Vercel).

---

## Admin Area

### Access

| URL (local) | Action |
|-------------|--------|
| [http://localhost:3000/admin](http://localhost:3000/admin) | Dashboard |
| [http://localhost:3000/admin/add-paper](http://localhost:3000/admin/add-paper) | Upload new paper |
| [http://localhost:3000/admin/papers](http://localhost:3000/admin/papers) | Manage papers |

Uses `src/app/admin/layout.js` (sidebar), not the public header/footer.

### Add a paper

1. Open `/admin/add-paper`.
2. Fill: Subject Code, Subject Name, **Examination Period**, **Academic Year** (1–4), **Semester** (1–2), Department.
3. Optionally add Instructor.
4. Select a **PDF file** (required).
5. Submit — file uploads to Drive; metadata saves to Neon.

### Edit a paper

1. From `/admin/papers`, click **Edit** → `/admin/papers/edit/{uuid}`.
2. Update fields; upload a new PDF only if replacing the file.
3. **Save Changes**.

### Delete a paper

1. On `/admin/papers`, **Delete** → confirm. Removes DB row only.

### Security

There is **no admin login** yet. Restrict access by:

- Not linking `/admin` publicly
- Network / IP rules on hosting
- Future auth middleware

For production, treat `DATABASE_URL` and Google credentials as highly sensitive.

---

## Request a Paper (EmailJS)

**Request Paper** in the public header opens `RequestPaperModal`. Required fields: name, email, subject code/name, department, examination period. Submits via EmailJS to `arict@as.rjt.ac.lk`. If EmailJS env vars are missing, users see an error to contact ARICT directly.

---

## Components

### Public

| Component | Role |
|-----------|------|
| `Header` | Nav + Request Paper |
| `Footer` | Branding, links |
| `SearchBar` | Navigates to `/search?q=` |
| `RequestPaperModal` | Missing-paper email form |
| `DepartmentCard` | Department tile with paper/course counts |
| `BrowseByExamPeriod` | Exam session cards → `/search?years=` |
| `FilterSidebar` | Department, academic year, semester filters |
| `PaperCard` / `PaperListItem` | Result cards |
| `Pagination` | Page controls (dynamic total pages) |
| `Breadcrumb`, `Chip`, `CopyLinkButton`, `RelatedPaperCard` | Paper detail |

### Admin

| Component | Role |
|-----------|------|
| `AdminSidebar` | Admin nav |
| `StatsCard` | Dashboard metrics |
| `PapersTable` | List with View / Edit / Delete |
| `PaperForm` | Add/edit form + PDF upload + preview |
| `ConfirmDialog` | Delete confirmation |

---

## Styling & Design

- `src/app/globals.css` — design tokens and utilities
- `public-shell` / `admin-shell` layouts
- Responsive mobile nav (public header and admin sidebar)

---

## Fallback Data

`src/data/papers.js` — static sample papers when the API fails on search or when a paper is not found on detail. Helpers: `getPaperById`, `getRelatedPapers`, `filterPapers`, `searchPapers`. Sample data uses legacy shapes (e.g. `departmentFull: "Computer Science"`) and may not match production department names.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | ESLint |

---

## Deployment

Suited for [Vercel](https://vercel.com) or any Node host running Next.js:

1. Connect the repository.
2. Set `DATABASE_URL`, Google Drive variables, and optional EmailJS vars.
3. Add production OAuth redirect URI in Google Cloud Console.
4. Deploy (`next build`).

Ensure Google Drive root folder and OAuth token belong to an account with sufficient storage.

---

## Known Limitations

| Area | Current behavior |
|------|------------------|
| **Admin auth** | No login; `/admin` URLs are open if known |
| **Delete** | DB row removed; Drive file is not deleted |
| **Exam period filter UI** | Hidden in sidebar; `?years=` from home still filters |
| **Fallback data** | Outdated sample departments vs live DB |
| **Legacy edit URL** | `/admin/papers/[department]/[id]` still present alongside `/edit/[id]` |

---

## Contributing & Policies

| Document | Purpose |
|----------|---------|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute |
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | Community standards |
| [CODE_OF_ETHICS.md](./CODE_OF_ETHICS.md) | Project ethics |
| [SECURITY.md](./SECURITY.md) | Reporting vulnerabilities |

---

## License

See [LICENSE](./LICENSE).

---

## Quick Reference

```text
Public:     /  /search  /paper/[uuid]  /about  /faculty  (+ Request Paper)
Admin:      /admin  /admin/add-paper  /admin/papers  /admin/papers/edit/[id]
API:        GET/POST /api/papers   GET/PUT/DELETE /api/papers/[id]
Database:   PostgreSQL (Neon) — papers table, UUID ids
PDFs:       Google Drive — uploaded server-side, linked in DB
OAuth:      /api/auth/google  (one-time Drive token setup)
Email:      EmailJS → arict@as.rjt.ac.lk
Config:     .env.local → DATABASE_URL, GOOGLE_*, NEXT_PUBLIC_EMAILJS_*
```

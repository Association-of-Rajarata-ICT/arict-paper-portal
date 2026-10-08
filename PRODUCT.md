# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Undergraduate students of Rajarata University of Sri Lanka (Faculty of Applied Sciences departments: Biological Sciences, Chemical Sciences, Computing, Health Promotion, Physical Sciences), usually preparing for an upcoming examination. They arrive knowing a course code or module name, often on a phone, often late in the evening, and want the right paper open or downloaded in seconds. A small group of ARICT volunteers/admins uploads and maintains papers through the admin area.

## Product Purpose

The ARICT Past Paper Portal is the association's searchable archive of past examination papers. Students search and filter by department, academic year (Year 1–4) and semester, preview the PDF in the browser, download it, and request papers that are missing. Success means a student finds the exact paper they need with no dead ends.

## Positioning

A student-run archive organized the way the university itself organizes exams: by course code, department, academic year, semester and examination period, with the actual paper previewable inline rather than a generic file dump.

## Operating Context

- Paper metadata lives in PostgreSQL (Neon); PDFs live in Google Drive and are previewed via Drive embed and downloaded via Drive links.
- Home links to search via `?q=` (department or free text) and `?years=` (examination period).
- Missing papers are requested through an EmailJS form addressed to arict@as.rjt.ac.lk.
- Admin area (dashboard, add paper, manage/edit/delete papers, portal stats) is unlinked from public navigation and not login-gated in the current codebase.

## Capabilities and Constraints

- Next.js 16 App Router, React 19, plain global CSS (no Tailwind), Material Symbols + lucide-react icons.
- Search page: free-text query, department / academic year / semester filters (exam-period filter exists in code but is temporarily hidden), reset, compact grid vs list view, client-side pagination (9 compact / 5 list).
- Paper detail: metadata, Download / Share / Copy link, Drive PDF preview, related papers.
- Redesign scope (2026-10-09): visual + UX only; all functionality, routes, data flow and filter behaviour preserved.

## Brand Commitments

- Name: ARICT — Association of Rajarata Information & Communication Technology.
- Logo: `public/logo.png`, black "AR" + maroon "ICT" (#790000) on white. Maroon is the binding brand colour.

## Evidence on Hand

- Live counts (papers, subjects, departments) from the database; the About page reads stats from Neon.
- No testimonials, usage figures, or partner claims exist; none may be invented. Footer social links currently point at generic platform homepages.

## Product Principles

1. Course code first: the code is how students think about a paper, so it leads every listing.
2. Zero dead ends: every empty or failed state offers a next step (reset filters, request the paper).
3. Fast on a phone: scanning, filtering and downloading must work one-handed on a small screen.
4. Truthful archive: show real counts and real metadata only.

## Accessibility & Inclusion

Large, mixed-device student audience; target WCAG 2.1 AA contrast, visible focus, keyboard-operable filters and dialogs, and reduced-motion support. Light and dark themes (dark follows device setting, with a manual toggle).

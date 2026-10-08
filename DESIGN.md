---
name: ARICT Past Paper Portal
description: An examination archive styled like the answer-script cover sheets it serves — ruled paper, boxed index cells, hairline ledgers, one maroon stamp.
colors:
  ink: "#17171a"
  ink-2: "#48484f"
  ink-3: "#66666d"
  paper-bg: "#f4f4f1"
  surface: "#ffffff"
  surface-2: "#f0efeb"
  rule: "#e0dfda"
  rule-strong: "#c4c2bb"
  brand: "#790000"
  brand-hover: "#5c0000"
  brand-tint: "#f7ebe9"
  brand-tint-strong: "#ecd2ce"
  success: "#1d6b3a"
  error: "#a4231b"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.4rem + 2.4vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(1.625rem, 1.3rem + 1.2vw, 2.125rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  mono-code:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "1.0625rem"
    fontWeight: 600
    letterSpacing: "0.02em"
rounded:
  control: "4px"
  sheet: "8px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.brand-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
  code-tag:
    backgroundColor: "transparent"
    textColor: "{colors.brand}"
    typography: "{typography.mono-code}"
    rounded: "3px"
    padding: "3px 8px"
---

# Design System: ARICT Past Paper Portal

## Overview

**Creative North Star: "The Answer-Script Cover Sheet"**

The portal is built to look like the paperwork students already hold in an exam hall: a ruled answer book, a boxed index-number field, an invigilator's stamp. Instead of a generic SaaS card grid, every surface borrows from real examination paperwork — course codes set one character per boxed cell like an index number, results listed on hairline-ruled ledgers like a timetable, the home hero printed on faint ruled paper with a double red margin line, and a single maroon "stamp" marking the most recently added paper. The brand maroon (#790000, from the ARICT logo) is spent deliberately: on actions, selected states, course codes and the stamp, never as background wash.

The system is restrained everywhere else — near-black ink on off-white paper, hairline rules instead of soft shadows, 4px control corners instead of pills, so the one maroon accent and the boxed-mono course code keep their authority.

**Key Characteristics:**
- Paper-and-ink palette (off-white page, white sheets, near-black ink) with maroon reserved for action and identity
- Course codes always set as boxed mono-font cells (`CodeBoxes`) or a bordered `code-tag`, never as a plain label
- Hairline rules (1px, `--rule` / `--rule-strong`) do the work soft shadows usually do; shadows are reserved for floating sheets (cards that lift off the page: cover sheet, modals, sticky paper panel)
- Dark mode is a "night desk" palette — graphite ground, chalk ink, warmed salmon-maroon accent — not an inverted light theme

## Colors

Near-black ink on an off-white paper ground, with maroon (the ARICT brand color) as the only saturated color in the system.

### Primary
- **ARICT Maroon** (`#790000` light / `#ff9a8c` dark): primary buttons, course codes (`code-tag`, `CodeBoxes`), selected filter state, active nav underline, the examination stamp, focus rings (`--brand-ring`). Never used as a large background fill.

### Neutral
- **Ink** (`#17171a` / `#ecebe7` dark): headings and primary text.
- **Ink-2** (`#48484f` / `#b9b8b2` dark): body copy, secondary labels.
- **Ink-3** (`#66666d` / `#93928c` dark): placeholders, metadata, disabled text.
- **Paper background** (`#f4f4f1` / `#111113` dark): page ground, behind sheets.
- **Surface** (`#ffffff` / `#19191c` dark): cards, sheets, the header and footer.
- **Surface-2** (`#f0efeb` / `#212125` dark): hover fills, skeleton base, filter-option hover.
- **Rule / Rule-strong** (`#e0dfda` / `#c4c2bb`, dark `#2c2c31` / `#46464d`): hairline borders everywhere — the system's primary depth device.

### Named Rules
**The Hairline-Not-Shadow Rule.** Dividers between rows, cards, filter groups and table cells are 1px rules, not soft shadows. Shadow is reserved for sheets that visually lift off the page (the cover sheet, modals, the sticky paper-detail panel).

**The Maroon-Is-Action Rule.** Maroon marks something the student can act on or something that identifies a paper: buttons, the course code, selected filters, the stamp. It is never a section background or decorative fill.

## Typography

**Display/Body Font:** Archivo (variable, `wdth` axis used for headings at 108–115%), self-hosted via `next/font`.
**Mono Font:** Martian Mono (variable, `wdth` 87.5%), used only for course codes, numerals in tables/tallies, and pagination digits.

**Character:** One grotesque sans carries everything — headings widened slightly via the `wdth` axis for a condensed-display feel, body at default width. The mono face appears only where the content is itself a code or a number, never as generic "technical" decoration.

### Hierarchy
- **Display** (800, `clamp(2rem,1.4rem+2.4vw,3rem)`, 1.08): hero headline only.
- **Headline-lg** (800, `clamp(1.625rem,1.3rem+1.2vw,2.125rem)`, 1.15): page titles (Papers, About, paper title on the sheet).
- **Headline-md/sm** (700, 1.375rem / 1.125rem): section heads, card titles.
- **Body** (400, 1rem, 1.55): running copy, max ~65–75ch.
- **Mono/code** (600, `wdth` 87.5%, tabular numerals): course codes, pagination, tallies, table "Added" dates.

### Named Rules
**The Code-Leads Rule.** A course code is never rendered as plain text. It is always a `CodeBoxes` (large contexts: hero cover sheet, paper detail) or a `code-tag` (compact contexts: cards, list rows, admin table), in the mono face.

## Layout

12px–80px spacing scale on a 4px base (`--s-1` … `--s-20`). Container max-width 1200px + 24px gutter (16px on mobile). Header is 64px and sticky; sticky panels (filter sidebar, paper-detail sheet) sit at `header height + 24px` from the top.

Search page is a two-column layout (264px filter sheet + fluid results) collapsing to a slide-over drawer under 1023px. Paper detail is preview-leading (fluid PDF viewer + 360px sticky metadata sheet) collapsing to a single column with the sheet promoted above the preview on mobile. Home hero is a two-column ruled-paper layout collapsing to single column under 860px, where the ruled margin line is hidden (it only reads at full container width).

## Elevation & Depth

Mostly flat: rules and tone changes carry structure. Shadow exists only for things that leave the page plane: the home-page cover sheet (`--shadow-sheet`, with a -1° rotation that straightens on hover), modals and drawers (`--shadow-pop`), and hover lift on cards/rows (`--shadow-hover`). Shadows always pair an offset with blur; no zero-offset glow.

### Shadow Vocabulary
- **sheet** (`0 1px 2px rgba(23,23,26,.05), 0 18px 40px -18px rgba(23,23,26,.28)`): the cover sheet and sticky paper-detail panel.
- **hover** (`0 1px 2px rgba(23,23,26,.05), 0 8px 20px -10px rgba(23,23,26,.22)`): card/row/period-slip hover lift.
- **pop** (`0 2px 6px rgba(23,23,26,.06), 0 24px 56px -16px rgba(23,23,26,.32)`): modals, drawers, dialogs.

### Named Rules
**The Lift-Off-The-Page Rule.** Shadow only appears on an element that is conceptually a separate sheet of paper sitting above the background (cover sheet, modal, drawer) or genuinely elevating on interaction (hover). A row sitting flush in a ledger never gets a shadow — a rule separates it instead.

## Shapes

Small, consistent radii: 4px (`--r-control`) on buttons/inputs/chips/code cells, 8px (`--r-sheet`) on cards and panels, pill (`--r-pill`) only for small pill controls (quick-link chips, filter badge). Course-code boxes and the stamp use sharper 3–4px corners to read as printed/stamped forms rather than soft UI chrome. Tick-box checkboxes (not pill switches) throughout, matching an answer-sheet checkbox.

## Components

### Buttons
- **Shape:** 4px radius, 40px height (44px on touch), 44px minimum touch target.
- **Primary:** maroon fill, white text, no border.
- **Secondary:** white/surface fill, 1px `--rule-strong` border, ink text.
- **Hover/Focus:** primary darkens to `--brand-hover`; secondary border darkens to ink-2 and surface tints; all controls get a 3px maroon focus ring (`--brand-ring`) on `:focus-visible`.

### Code display
- **CodeBoxes** (large contexts): one character per bordered mono cell, 1.5px ink border, used on the home cover sheet and paper-detail sheet head.
- **code-tag** (compact contexts): a single bordered mono pill-less tag in maroon text, used on cards, list rows, related cards, admin table.

### Chips
- **Style:** `--surface-2` background, 1px rule border, ink-2 text; `chip-accent` variant tints maroon for paper "type".
- **State:** display-only (metadata tags), not interactive/removable except the search page's active-filter chips, which are maroon-tinted pill buttons with a close icon.

### Cards / Sheets
- **Corner Style:** 8px.
- **Background:** white/surface.
- **Shadow Strategy:** flat at rest (1px rule border only) except the cover sheet, which always carries `shadow-sheet` and a slight rotation.
- **Border:** 1px `--rule`, strengthening to `--rule-strong` on hover.
- **Internal Padding:** 20–24px (`--s-5`/`--s-6`).

### Inputs / Fields
- **Style:** 1px `--rule-strong` border, 4px radius, 44px min height.
- **Focus:** border turns maroon + 3px maroon ring (`--brand-ring`).
- **Tick checkbox:** custom 18×18px square with ink border, fills maroon with a white check mark when checked — never a toggle switch.

### Navigation
- **Style:** text links with an animated 2px maroon underline on the active/hover state; sticky 64px header with hairline bottom border.
- **Mobile:** slide-in drawer from the right (nav) matching the filter drawer's slide-in from the left (facets) — same scrim, same 280ms ease-out.

### Signature Component: the examination stamp
A bordered, double-ring, rotated (-7°) maroon label (`.stamp`) marking the most recently added paper on the home page, with a one-time "stamp landing" entrance animation (scale + rotate settle). The one deliberately playful motion moment in an otherwise restrained system.

## Do's and Don'ts

### Do:
- **Do** set every course code in the mono face, boxed or tagged — never as plain text.
- **Do** use hairline rules (`--rule` / `--rule-strong`) for structural separation; reserve shadow for sheets that lift off the page.
- **Do** keep maroon reserved for action, identity (codes) and the stamp.
- **Do** theme browser-native surfaces (scrollbar, selection, caret, tick-box) from the palette rather than leaving browser defaults.

### Don't:
- **Don't** add a second saturated color; the palette is ink/paper + one maroon.
- **Don't** render a course code as unstyled text — it always goes through `CodeBoxes` or `.code-tag`.
- **Don't** use pill-shaped buttons or cards; pills are reserved for small chip/badge controls.
- **Don't** add a kicker/eyebrow label above headings, or a colored left-border accent on cards/rows (floor-level prohibitions; none shipped in this build, flagged here so future surfaces don't reach for them).

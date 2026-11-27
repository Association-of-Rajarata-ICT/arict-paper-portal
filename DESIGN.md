---
name: ARICT Past Paper Portal
description: "Exam desk" — each paper drawn as its own front page, a maroon band for finding papers, one highlighter yellow and a colour per department.
colors:
  ink: "#14213d"
  ink-2: "#414d6b"
  ink-3: "#5d6780"
  bg: "#f3f4f7"
  surface: "#ffffff"
  rule: "#e1e4ec"
  brand: "#790000"
  band: "#6d0207"
  highlight: "#ffd43b"
  dept-biological: "#1b7446"
  dept-chemical: "#6a3cb0"
  dept-computing: "#1c5bbd"
  dept-health: "#b02c67"
  dept-physical: "#905100"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Figtree, system-ui, sans-serif"
    fontWeight: 800
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.55
rounded:
  control: "10px"
  sheet: "16px"
  pill: "999px"
---

# Design System: ARICT Past Paper Portal

All styles live in `src/app/globals.css`; tokens are at the top of that file, with dark-theme values.

## Idea

A past paper is recognised by its front page: university, course code, exam session. The interface draws
papers that way (`.exam-sheet` on cards, `.stack-sheet` in the home hero) and keeps everything around them quiet.

## Colour

- **Maroon** (`--brand`, `--brand-solid`) is the ARICT brand colour: primary buttons, selected states, links.
- **Maroon band** (`--band`) is the background for finding things: home hero, page titles, call-to-action blocks.
- **Highlighter** (`--highlight`) is only for the main action on a maroon band and the "Just added" tag.
- **Department colours** identify a paper's department. Set `data-dept="<department id>"` on an element
  (see `departmentKey()` in `src/data/departments.js`) and use `var(--dept)`. Colour is never the only cue:
  the department name or course code is always written too.
- **Ink** is a blue-black, the colour of exam scripts.

## Type

- **Bricolage Grotesque** for headings, course codes and large figures (tabular numerals for codes and counts).
- **Figtree** for everything else.
- Sentence case throughout; no all-caps labels.

## Layout

- Container 1200px, 4px spacing scale, 68px sticky header.
- Home: hero with search and the three newest papers, department tiles, recently added, exam periods by year,
  request/contribute block, about text.
- Search: 276px filter panel and results. Under 1024px the filters become a slide-over sheet.
- Under 640px paper cards turn sideways so more fit on a phone screen.

## Components

- **Paper card:** department-coloured cover holding the exam sheet, then title, department, year and semester,
  View and Download. The whole card opens the paper; Download stays its own target.
- **Filters:** department checkboxes with a colour dot and count; academic year and semester as toggle tiles
  (real checkboxes underneath, so keyboard and screen readers work as before).
- **Buttons and inputs:** 10px radius, 44px minimum on touch, visible focus ring.

## Motion

One entrance: the hero papers fan out. Cards lift on hover. `prefers-reduced-motion` turns both off.

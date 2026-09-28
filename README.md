# Tactical Match Experience

An **unofficial UX concept** created independently by two Online Soccer Manager players and Computer Science graduates from Aristotle University of Thessaloniki.

> **Not affiliated with, commissioned by, or endorsed by Miniclip or Online Soccer Manager (OSM).**

## Why we built it

While playing OSM with friends, we felt there was an opportunity to make the match-viewing experience more informative and engaging **without turning OSM into a real-time football simulator or making matches significantly longer**.

The concept keeps the existing fast manager-game rhythm and adds a lightweight visual layer for match context.

## Core idea

### During normal play

- The pitch is divided into three equal areas:
  - defensive third
  - midfield
  - attacking third
- A subtle pulse indicates the general area where play is taking place.
- The ball remains hidden.
- Player movement remains intentionally minimal.
- The live match-history panel continues to log the flow of the match.

### During an important event

The interface temporarily shows more detail:

- relevant players become visible/highlighted;
- player names appear only when useful;
- the ball and short trajectory become visible;
- the current event/commentary dock explains what is happening;
- the match then immediately returns to the lightweight normal view.

Examples in the prototype include:

- throw-in leading to a chance
- foul
- yellow card
- direct free kick
- offside
- shot and goalkeeper save
- corner
- substitution
- indirect free kick
- red card
- penalty
- open-play goal
- half-time and full-time

## Full-match demo

The prototype includes a scripted **full-match mode**.

The complete flow runs automatically so a reviewer can experience the concept without manually selecting every event. Each important moment pauses briefly so there is enough time to read the event description and understand what is happening.

You can also:

- pause the full match;
- replay the current event;
- move to the previous or next event;
- click an item in the live match history;
- reset the prototype.

## Prototype structure

```text
.
├── index.html
├── styles.css
├── app.js
└── README.md
```

### `index.html`

Contains the semantic page structure only.

### `styles.css`

Contains the responsive landscape UI, pitch, event dock, match-history panel, and animation styles.

### `app.js`

Contains:

- the demonstration squads;
- scripted match events;
- pitch/player rendering helpers;
- event navigation;
- full-match autoplay;
- pause/reset behavior;
- scoreboard state.

There are **no external JavaScript libraries, frameworks, APIs, analytics tools, or network requests**. The prototype is completely static and can be hosted directly on GitHub Pages.

## Technical scope

This project is deliberately **architecture-agnostic**.

It does **not** attempt to reproduce, reverse engineer, or make assumptions about:

- OSM's internal match engine;
- backend architecture;
- event schemas;
- programming languages;
- APIs;
- simulation logic.

The match timeline in this repository is scripted purely to demonstrate the proposed user experience.

In a real product implementation, the visual layer would need to be designed around the actual match-event data, technical constraints, performance requirements, and product decisions of the OSM team.

## Demo match

The prototype uses **Real Madrid vs Liverpool** and recognizable player names solely to make the UX concept easier to understand.

Club names and player names belong to their respective owners and are used here only for a non-commercial demonstration concept.

## Running locally

No build step is required.

### Option 1 — open directly

Open:

```text
index.html
```

in a modern browser.

### Option 2 — local server

From the repository folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## GitHub Pages

This repository is designed to work directly with GitHub Pages.

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Save.

GitHub will provide the public prototype URL.

## Authors

**Rizas Mousollari**  
Computer Science Graduate — Aristotle University of Thessaloniki  
LinkedIn: https://www.linkedin.com/in/rizas-mousollari-32305b3b6/  
GitHub: https://github.com/Rizasss

**Markos Nakos**  
Computer Science Graduate — Aristotle University of Thessaloniki  
GitHub: https://github.com/markosnakos

## Status

This repository is a product/UX proof of concept intended for discussion and feedback.

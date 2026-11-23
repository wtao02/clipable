---
version: 1
slug: "frontend-src-app"
primary_target: "frontend/src/app"
related_targets: ["frontend/src/shared"]
---

# Surface: Vitryne web app

## Scope

All routes under `frontend/src/app`: home, clip watch, upload, login, register, user profile, plus the shared header, cards, modal and alerts. Mode: Operate. User-owned folders appear on upload, watch and the profile filter row.

## Audience and job

Small teams and self-hosters and their viewers. The operator uploads a clip and shares a link; the viewer opens it and watches with minimal friction.

## Success

A first-time visitor can identify the product, search or scan clips, and play one within seconds. A logged-in user can upload a clip and copy its link without hunting.

## Proof and content

Real clip titles, uploader names, view counts, relative dates, processing states, unlisted markers and the Shaka player. No fabricated testimonials or metrics.

## Constraints

Keep every existing route, API call and player behavior. Dark-only. Keep the Vitryne name (fork of Clipable). Binding reference: x76.gg's minimal, flat, typographic composition and shadcn-like component language, translated to a warm near-black palette. Libraries are private to their owner; only a direct clip link is viewable by others.

## Chosen direction

A quiet, dark working surface where the clips carry all the color. Hairline borders, warm off-white text, Archivo plus IBM Plex Mono, 6–8px radii, no shadows or gradients. The signature move is the hover play affordance on a thumbnail and mono metadata rows.

## Direction contract

THESIS: Clips are the only bright thing on a warm near-black working surface; refuse the daisyUI navbar, blue primary, rounded card soup and centered search takeover.

OWN-WORLD: Ground #0b0b0c, surface #141416, hairline #26262a, text #f4f2ec, muted #a1a1a6; Archivo 400–600 and IBM Plex Mono for data; 6–8px radii; flat 1px borders; warm off-white primary buttons; functional red and amber states only.

STORY: The visitor lands, sees real clips, opens one and watches immediately; the uploader can post a clip and share it without leaving the flow.

FIRST VIEWPORT: A 64px sticky bar with a compact wordmark, Browse and Upload, a measured search field and account controls. Below, "Clips" at 24–28px with a quiet count and a three-column 16:9 grid of real thumbnails on a 1200px page.

FORM: Minimal editorial/utility composition from the pinned x76 reference, position 1 on the ordered list; it supplies type, palette, density and the play-on-hover move, never the page's organization. seed: none (pinned by user reference).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

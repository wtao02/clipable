# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Small teams and individuals who self-host Vitryne, plus the people they share clips with. The operator runs an instance for a handful of people; viewers open a link, watch, and occasionally upload.

## Product Purpose

Vitryne is a simple, self-hosted alternative to Streamable: upload a video, transcode it automatically, and share a fast, adaptive playback page. Success is a clip uploaded and watched with minimal setup and no dependence on a third-party host.

## Positioning

The whole path — upload, transcode, store, play — runs on infrastructure the operator controls, with a single Docker-based deployment and MPEG-DASH adaptive playback.

## Operating Context

Instances run via Docker Compose with Postgres and S3-compatible storage; clips are uploaded in the browser, transcoded with FFmpeg, and watched on desktop or mobile. Registration is operator-controlled. There are no comments, feeds, ads, or social graph.

## Capabilities and Constraints

Existing routes and API must remain: home clip grid, clip playback, upload, login/register/logout, user profile, search, edit/delete clip, unlisted clips, view counts, quality selection. The redesign keeps the existing API contract and player behavior (Shaka 5, adaptive DASH). Web only; registration can be disabled by the operator. Editing features are planned for a later release; this build does not add them, and future editing surfaces should inherit the same quiet shell instead of introducing a second visual language.

Clips can be organized into user-owned folders (categories): a user creates folders, assigns a folder at upload or edit, and filters by folder on the home library and on their profile grid. Folders are private to their owner; folder navigation appears only on the owner's private library and profile.

Uploads are content-probed with ffprobe: only files containing a real, non-attached video stream are accepted. Images, audio, documents, and files with a video extension but non-video content are rejected regardless of filename or MIME type.

Privacy model: every user's library is private. The home feed, search, profiles, folder navigation, and clip lists are owner-only. Another person can watch a clip only through a direct link; a shared clip page exposes the clip and uploader name but not the uploader's other clips, folders, or library. The legacy `unlisted` column remains in the data model for compatibility but no longer distinguishes public access.

Owner accepted tab-only per-route titles on 2026-11-20. Shared-link previews remain instance-level ("Vitryne") until a Next framework upgrade enables server-rendered per-clip metadata; this is a recorded constraint, not an open defect.

## Brand Commitments

Name: Vitryne. Fork of Clipable (https://github.com/clipable/clipable), used under the Business Source License 1.1. Vitryne wordmark and favicon live in `.assets/` and `frontend/public/`. Binding visual reference from the user: x76.gg — simple, minimal, dark, shadcn-like component language. Dark-only, no theme toggle.

## Evidence on Hand

Working product code and a live local instance with real clips for screenshots. No testimonials, customer logos, pricing, or benchmarks exist; do not fabricate them.

## Product Principles

- The clip is the interface; chrome recedes.
- One obvious path: upload, copy link, watch.
- Operator control over audience and data.
- Quiet, fast, and legible on a phone.

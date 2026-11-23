---
name: Vitryne
description: Self-hosted clip sharing with a quiet, clip-first interface
colors:
  ink: "#0b0b0c"
  surface: "#141416"
  surface-raised: "#1a1a1d"
  hairline: "#26262a"
  hairline-strong: "#3a3a40"
  paper: "#f4f2ec"
  dust: "#a3a3ab"
  dust-dim: "#82828b"
  cue-red: "#ff6b6b"
  cue-green: "#6ee7a8"
  cue-amber: "#f5b84d"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.6
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  data:
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.02em"
rounded:
  mark: "5px"
  control: "6px"
  surface: "8px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
  3xl: "56px"
components:
  button-primary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.dust}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "40px"
  clip-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
  modal:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "20px"
---

# Design System: Vitryne

## Overview

**Creative North Star: "The Quiet Screening Room"**

Vitryne is a dark room where the clip is the only bright thing. The shell stays near-black and deliberately unremarkable; thumbnails, posters and video frames carry the color. Chrome is built from warm paper-white type, hairline rules and flat surfaces, never from ornament. The visitor should feel the product recede the moment playback starts.

The voice is calm, exact and unadorned. Every label names what it does, every number is set in mono where it reads as data, and every primary action is a single cream shape on the dark ground. There are no gradients, glass panels, shadows or decorative accents. Separation comes from a 1px hairline and one step of surface value.

The world is sized for a small self-hosted instance, not a content network: a compact 1200px page, a three-column clip wall, a 1024px watch page, and narrow 380–640px forms. Future editing surfaces inherit the same quiet shell; they should add capability, not a second visual language.

**Key Characteristics:**
- Warm near-black ground with a paper-white primary.
- Flat surfaces and 1px hairlines; no shadows at rest.
- Archivo for voice, IBM Plex Mono for data and state.
- Clips own the color; the interface stays neutral.
- 8px surfaces, 6px controls, 5px wordmark mark.

## Colors

A warm neutral room with one cream action color and three functional cues; saturation is reserved for the footage and for state.

### Primary
- **Projector White** (#f4f2ec): The single primary action on a view, selected states, progress fill, and the wordmark. It is the brightest UI value on the page, and it is rare.

### Neutral
- **House Black** (#0b0b0c): The page ground. Sticky header and full-bleed areas sit directly on it.
- **Booth Surface** (#141416): Cards, form panels, the editor surface, modal body.
- **Raised Booth** (#1a1a1d): Inputs, textareas and the unfilled progress track.
- **Hairline** (#26262a): The default 1px separator and card outline.
- **Hairline Strong** (#3a3a40): Input outlines, badge outlines and hover borders.
- **Dust** (#a3a3ab): Secondary copy, metadata, nav links and helper text.
- **Dust Dim** (#82828b): Placeholders and the quietest mono labels; still above 4.5:1 on House Black.

### Functional Cues
- **Cue Red** (#ff6b6b): Destructive actions and error messages only.
- **Cue Green** (#6ee7a8): Success confirmations only.
- **Cue Amber** (#f5b84d): Reserved for queued or warning states; not currently used by a surface.

### Named Rules
**The One Light Rule.** The clip image is the only saturated field in the product. Do not add a hue accent to navigation, panels, or headings to compensate.

**The Cue Rule.** Red, green and amber appear only when they carry meaning. They are never decorative, never a second brand color.

## Typography

**Display Font:** Archivo (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Archivo (same stack)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace, SFMono-Regular, Menlo, monospace)

**Character:** Archivo gives the shell a Swiss-utility calm without feeling like a dashboard; IBM Plex Mono gives counts, dates and state the precision of an instrument readout. Both are self-hosted from `public/fonts`.

### Hierarchy
- **Display** (500, 28px, 1.5): Page titles such as Clips, Search, Upload a clip and auth headings. On mobile the same role drops to 24px.
- **Headline** (500, 24px, 1.5): The clip title on the watch page.
- **Title** (500, 15px, 1.6): Card titles and modal titles.
- **Body** (400, 15px, 1.5): Descriptions and supporting copy; measure stays under 68ch.
- **Label** (500, 13px, 1.5): Form labels, button labels, helper copy.
- **Data** (400/500, 11–12px, 1.5, 0.02em): View counts, dates, percentages, status lines, badges. Uppercase only for three-word status labels.

### Named Rules
**The Data Voice Rule.** Mono is for counts, dates, status and measurements. It is never used for prose, headings or navigation.

## Layout

The page is a 1200px measure with 16px gutters (24px from 640px), centered on House Black. The header is a 64px sticky bar on desktop; below 640px it becomes a two-row 104px bar with a full-width search. The clip wall is three columns from 1024px, two from 640px, one below. Page padding is 40px desktop and 32px mobile; sections separate at 32px.

The watch page narrows to 1024px and leads with the player, then a title block with the action cluster at the right. Auth is a 380px column; upload is a 640px column. Spacing follows a 4px base with frequent 8/12/16/24/32 steps. Cards are 8px-radius surfaces; grids use 20px column gaps and 32px row gaps.

The layout is content-led: no hero, no centered search takeover, no sidebar. Navigation is one wordmark, Browse, a measured search field, and the account cluster.

## Elevation & Depth

There are no shadows. Depth is tonal: House Black, Booth Surface and Raised Booth are three close steps, separated by 1px hairlines. The modal adds a 70% black backdrop and a single bordered panel; it does not float on a shadow. The video player uses a functional bottom scrim so controls stay legible over any frame.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. If a shadow ever appears, it must describe a state or a physical layer, not decorate a card.

## Shapes

Corners are gently rounded, never pill-shaped except for the progress track. Surfaces and thumbnails use 8px; buttons, inputs and secondary panels use 6px; the wordmark mark uses 5px; badges use 4px. Borders are always 1px. Images clip to the 8px surface radius. There is no decorative geometry, no oversized radius, no nested cards.

## Components

### Buttons
- **Shape:** 6px radius, 36px primary height, 32px secondary/ghost height.
- **Primary:** Projector White fill, House Black label, 0 16px padding; one per view.
- **Hover / Focus:** primary lifts to pure white; focus uses the global 2px paper outline with a 2px offset.
- **Secondary:** transparent fill, Hairline 1px border, paper label, quiet Raised Booth hover.
- **Ghost:** dust label, no border, Raised Booth hover; used for account and icon actions.
- **Danger:** Cue Red label and 30% Cue Red border, red-tinted hover; destructive actions only.

### Inputs / Fields
- **Style:** Raised Booth fill, Hairline Strong 1px border, 6px radius, 40px height, 12px horizontal padding.
- **Focus:** border shifts brighter plus the global paper outline; never a glow.
- **Error / Disabled:** errors are inline Cue Red text in a bordered alert; disabled controls drop to 50% opacity and stop pointer events.
- **Labels:** 13px Archivo medium above the field, helper copy 12px Dust Dim below.
- **Selects:** native select on the same field surface and height, with the browser arrow; no custom dropdown chrome.

### Folder Navigation
- **Rail (xl+):** a 220px sticky left column under the page header, used by both the home library and the profile. 32px rows, 13px labels, 11px mono counts; the active row uses Raised Booth and a paper label. “New folder” is a plain row action on the profile, never a button card; the home adds “Manage folders” at the rail foot.
- **Chips (below xl):** the same entries as 32px outline chips in one wrapping row, with the count in mono, followed by the page's folder action.
- **Behavior:** filters that page's grid and updates the header subtitle to name the active folder. The home rail only appears once the owner has at least one folder; otherwise the grid renders full width. The library and rail are private to its owner.

### Navigation
- **Style:** 64px sticky House Black bar with a 1px Hairline bottom border. Wordmark at 15px/600 with a 24px outlined play mark. Browse is a 13px Dust link. Search is a measured 320px field with a leading icon. Account cluster uses Upload (secondary), username (13px Dust), Sign out (ghost); signed-out shows a single cream Sign in. On auth pages the header CTA is suppressed to avoid duplicating the form.

### Clip Cards
- **Style:** 16:9 thumbnail clipped to an 8px Booth Surface surface with a 1px Hairline; title 15px/500; metadata 11–12px mono Dust. No card fill around the text.
- **States:** hover raises the border to Hairline Strong and fades in a 40px play disc over a 10% black wash; processing replaces the image with a progress panel; unlisted carries a 4px mono badge.
- **Behavior:** the thumbnail and title are separate links to the clip; the creator name links to the profile, so no link nests inside another link.

### Modal
- **Style:** centered 448px Booth Surface panel, 8px radius, 1px Hairline, 20px padding, on a 70% black backdrop. Portal-rendered to the body; the app shell is inert while open. Tab/Shift+Tab are trapped, Escape closes, and focus returns to the opening control.

### Badges / Progress
- **Badge:** 4px radius, Hairline Strong outline, 10px uppercase mono, Dust label; only for Unlisted.
- **Progress:** 6px pill track in Raised Booth with a Projector White fill and a 300ms width transition; queued and encoding states share the same bar.

## Do's and Don'ts

### Do:
- **Do** keep exactly one Projector White primary action per view.
- **Do** use a 1px Hairline for separation and an 8px radius for surfaces.
- **Do** set counts, dates, percentages and status in IBM Plex Mono.
- **Do** let the clip image carry all of the color; keep chrome neutral.
- **Do** use sentence case for headings, buttons and labels.
- **Do** keep folder navigation in a 220px sticky rail at xl, collapsing to one wrapping chip row below xl, with counts in mono.
- **Do** treat the shared clip page as the only public surface; libraries, profiles, folders and feeds stay owner-only.
- **Do** extend this shell to future editing surfaces rather than inventing an editor skin.

### Don't:
- **Don't** add hue accents, gradients, glass, blur or decorative shadows.
- **Don't** use pill-shaped cards, nested cards or cards inside cards.
- **Don't** use a display serif or a system display face for headings.
- **Don't** use mono for prose or navigation.
- **Don't** use kickers, eyebrows or section numbers above headings.
- **Don't** rely on color alone for destructive, success or warning meaning.

---
name: Janus
description: A frosted iPadOS-like watch desk for remote AzurPilot operations.
colors:
  interactive-blue: "#1684c4"
  harbor-blue: "rgb(22 99 140 / 98%)"
  harbor-blue-deep: "rgb(18 61 88 / 96%)"
  cool-daylight: "#dce9ef"
  frosted-shell: "rgb(255 255 255 / 48%)"
  frosted-panel: "rgb(255 255 255 / 58%)"
  pure-white: "#ffffff"
  harbor-ink: "#020617"
  muted-ink: "#64748b"
  hairline: "rgb(15 23 42 / 6%)"
  online: "#10b981"
  waiting: "#fbbf24"
  danger: "#ef4444"
typography:
  display:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "2.35rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  body:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "ui-rounded, 'SF Pro Rounded', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  compact: "0.72rem"
  control: "0.9rem"
  group: "1.15rem"
  panel: "1.75rem"
  shell: "2.25rem"
  pill: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  2xl: "2rem"
  3xl: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.harbor-ink}"
    textColor: "{colors.pure-white}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.5rem 0.625rem"
    height: "2rem"
  button-refresh:
    backgroundColor: "{colors.frosted-panel}"
    textColor: "{colors.harbor-ink}"
    rounded: "{rounded.pill}"
    size: "2.75rem"
    height: "2.75rem"
    width: "2.75rem"
  navigation-active:
    backgroundColor: "{colors.harbor-ink}"
    textColor: "{colors.pure-white}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0.75rem 0.875rem"
    height: "2.75rem"
  status-badge:
    backgroundColor: "{colors.frosted-panel}"
    textColor: "{colors.muted-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.75rem"
    height: "2.25rem"
  frosted-card:
    backgroundColor: "{colors.frosted-panel}"
    textColor: "{colors.harbor-ink}"
    rounded: "{rounded.panel}"
    padding: "1.5rem"
  segmented-selected:
    backgroundColor: "{colors.pure-white}"
    textColor: "{colors.harbor-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.compact}"
    padding: "0.5rem 0.75rem"
    height: "2.75rem"
---

# Design System: Janus

## Overview

**Creative North Star: "The Frosted Watch Desk"**

Janus is an iPadOS-like remote operations console: a calm, user-pinned surface for watching a distant AzurPilot system and acting only when needed. Cool daylight surrounds a continuous frosted shell, while deep harbor blue gives service health and primary operational context a single authoritative voice.

The system is restrained, tactile, and task-first. It favors a few large material planes, compact fact rows, hairline separators, and clear live-state signals over an inventory of interchangeable metric cards. Layered ambient depth makes the console feel present without turning monitoring data into decoration.

**Key Characteristics:**

- Cool daylight atmosphere with frosted white material.
- Deep harbor blue for authoritative service context.
- One blue interactive tint for focus and lightweight actions.
- Large continuous radii outside; tighter radii inside.
- Dense, scan-friendly operational rows with honest live states.

## Colors

The palette is a cool harbor world: blue-gray daylight and translucent whites support dark ink, while a limited set of status colors communicates real system state.

### Primary

- **Signal Blue** (`interactive-blue`): The sole interactive tint for keyboard focus, inline actions, enabled-task marks, and selection feedback.
- **Harbor Blue** (`harbor-blue`): The leading edge of authoritative service surfaces and operational summaries.
- **Deep Harbor Blue** (`harbor-blue-deep`): The grounded end of service-surface gradients; use it to carry white type with strong contrast.

### Tertiary

- **Online Green** (`online`): Confirmed healthy or running states only.
- **Waiting Amber** (`waiting`): Pending or connection-in-progress states only.
- **Danger Red** (`danger`): Offline, failed, and destructive states only.

### Neutral

- **Cool Daylight** (`cool-daylight`): The environmental backdrop behind the application material.
- **Frosted Shell** (`frosted-shell`): The translucent outer workspace plane.
- **Frosted Panel** (`frosted-panel`): The slightly more legible material for cards, badges, and controls.
- **Pure White** (`pure-white`): Selected segments, high-contrast content on harbor surfaces, and material highlights.
- **Harbor Ink** (`harbor-ink`): Primary text and the darkest active navigation surface.
- **Muted Ink** (`muted-ink`): Supporting labels, timestamps, descriptions, and inactive controls.
- **Hairline** (`hairline`): Quiet separators inside continuous containers.

### Named Rules

**The One Blue Voice Rule.** Signal Blue is the only interactive accent; do not add competing purple, cyan, or multicolor action palettes.

**The Status Must Be True Rule.** Green, amber, and red appear only when backed by a real service, instance, or task state.

## Typography

**Display Font:** UI Rounded with SF Pro Rounded, SF Pro Display, and system sans fallbacks  
**Body Font:** UI Rounded with SF Pro Rounded, SF Pro Display, and system sans fallbacks  
**Label/Mono Font:** The same rounded system stack; commit hashes may use the platform monospace stack

**Character:** Softly rounded system typography reinforces the iPadOS material language without becoming playful. Weight and compact spacing establish hierarchy; color does the quieter supporting work.

### Hierarchy

- **Display** (semibold, `display`, 1.15 line-height): A single high-value operational statement inside a featured service surface; it reduces to 1.75rem on compact screens.
- **Headline** (semibold, `headline`, 1.2 line-height): Page or pane titles that orient the operator.
- **Title** (semibold, `title`, 1.4 line-height): Panel titles and the Janus wordmark.
- **Body** (regular, `body`, 1.5 line-height): Descriptions, fact labels, navigation, and task rows.
- **Label** (medium, `label`, 1.4 line-height): Status badges, metadata, section labels, and compact segmented controls.

### Named Rules

**The Quiet Hierarchy Rule.** Prefer weight, size, and spacing over all-caps, loud color, or decorative type treatments.

## Layout

The durable spatial model is a continuous console with one dominant content region, not a field of equal-weight cards. Group related status and controls inside a few generous material planes; within them, use compact rows, description lists, and hairline division so the owner can scan service health, select an instance, read live tasks, and verify environment facts without hunting.

The current dashboard demonstrates a frosted split view with a 16.5rem navigation rail at large widths and a flexible work pane. At smaller widths the rail becomes a compact top region and content stacks. This is the dashboard's first-screen composition, not a mandatory template for every Janus surface.

Use a 4px base rhythm with 8px, 12px, 16px, 24px, 32px, and 40px steps. Interactive rows and compact controls have a minimum 44px touch target. The shell stays inset from the viewport by 12px on compact screens, 20px on medium screens, and 24px on large screens; dense content must wrap or scroll locally instead of compressing controls below touch size.

## Elevation & Depth

Janus uses layered ambient depth. Translucent white fills and backdrop blur establish material first; wide, low-opacity shadows separate major planes without hard floating-card edges. Hairlines are structural inside a surface, while shadows are reserved for the outer shell, featured service surfaces, selected controls, and large frosted containers.

### Shadow Vocabulary

- **Shell Ambient** (`0 28px 80px -34px rgb(30 64 83 / 45%)`): The broad cool shadow under the outer application material.
- **Panel Ambient** (`0 20px 50px -38px rgb(15 23 42 / 55%)`): A nearly weightless lift for large frosted content containers.
- **Service Ambient** (`0 24px 54px -32px rgb(12 61 88 / 80%)`): A deeper blue-biased shadow reserved for authoritative service surfaces.
- **Control Ambient** (`0 8px 24px -18px rgb(15 23 42 / 70%)`): Small tactile lift for isolated circular or selected controls.

### Named Rules

**The Material Before Shadow Rule.** Establish hierarchy with opacity, blur, and tonal layering first; add a shadow only when a plane or selected control needs separation.

## Shapes

The silhouette is continuously rounded: the outer workspace uses the largest shell curve, primary content containers use broad panel curves, and nested controls step down to group, control, and compact radii. Pills are reserved for transient status or circular actions. Thin borders and inset hairlines clarify glass edges; they never become dark card outlines.

**The Nested Radius Rule.** Radius decreases with containment: shell, panel, group, then control. A child must not look rounder or heavier than the material that contains it unless it is a deliberate pill or circle.

## Components

### Buttons

- **Shape:** Tactile rounded controls use the control radius; isolated icon actions may be circular.
- **Primary:** Harbor Ink with white text is the shared high-emphasis control treatment. Keep it rare in an operational view.
- **Hover / Focus:** Increase frosted opacity or gently shift tone on hover. Keyboard focus uses a visible Signal Blue outline with offset; active press may move down by one pixel.
- **Outline / Ghost:** Use translucent white or transparent material with Muted Ink, then darken the label on hover.

### Chips

- **Style:** Instance selectors use a quiet tinted group track with compact-radius items; the selected item is Pure White with Harbor Ink.
- **State:** Unselected items remain low-contrast but readable. Every item preserves the 44px target and supports horizontal overflow on compact screens.

### Cards / Containers

- **Corner Style:** Broad, continuous panel radius.
- **Background:** Frosted Panel over the cool daylight environment.
- **Shadow Strategy:** Panel Ambient only on major groupings; internal rows stay flat.
- **Border:** Use white edge highlights on outer material and Hairline separators inside.
- **Internal Padding:** 20px on compact screens and 24px at medium widths where space allows.

### Navigation

- **Style:** Active destinations use Harbor Ink, white text, and a restrained ambient shadow. Inactive destinations are transparent with Muted Ink and gain a soft white wash on hover.
- **Behavior:** Keep destination count compact. The rail is vertical at large widths and becomes a horizontal top treatment on smaller screens.
- **Focus:** Use the same offset Signal Blue focus treatment as all other interactive surfaces.

### Status Badge

- **Style:** A small frosted pill pairs a two-pixel state dot with a concise label; it does not become a decorative chip cloud.
- **State:** Pulse only while a connection is genuinely pending. Online, waiting, and offline colors map directly to confirmed data states.

### Operational Rows

- **Style:** Tasks and environment facts are compact, left-to-right scanning rows with a minimum 48px height, Muted Ink metadata, and tabular numerals for counts and times.
- **Behavior:** Rows receive only a faint tonal hover wash. Use hairline separators between fact rows and avoid placing each row in its own card.

## Do's and Don'ts

### Do:

- **Do** place the most decision-relevant service state in the clearest material plane.
- **Do** use large radii for shared containers and compact radii for controls nested inside them.
- **Do** preserve 44px touch targets and visible keyboard focus across Web and Electron.
- **Do** show loading, empty, error, offline, and partial-data states with the same care as healthy data.
- **Do** use compact rows and hairline separators for repeated operational facts.

### Don't:

- **Don't** turn Janus into a generic equal-card metric dashboard.
- **Don't** introduce purple gradients, decorative charts, or unverified performance and game-state data.
- **Don't** add new action colors when Signal Blue or a semantic status color already expresses the meaning.
- **Don't** stack multiple heavy shadows or dark outlines around nested frosted surfaces.
- **Don't** promote the dashboard's exact split-view composition into a universal layout requirement.

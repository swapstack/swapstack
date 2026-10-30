---
name: Swapstack
description: Clean, neutral, developer-friendly design system for cross-platform mobile apps.
colors:
  background: "#ffffff"
  foreground: "#0a0a0a"
  card: "#ffffff"
  card-foreground: "#0a0a0a"
  muted: "#f5f5f5"
  muted-foreground: "#737373"
  border: "#e5e5e5"
  input: "#e5e5e5"
  primary: "#171717"
  primary-foreground: "#ffffff"
  secondary: "#f5f5f5"
  secondary-foreground: "#171717"
  destructive: "#ef4444"
  destructive-foreground: "#ffffff"
  success: "#22c55e"
  warning: "#f59e0b"
typography:
  display:
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.md}"
    height: "44px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "44px"
---

# Swapstack Design System

## Overview

Swapstack is a developer boilerplate crafted for phone applications. Its design system embraces a **clean, neutral, and developer-friendly** ethos. Rather than imposing loud branding or skeuomorphic embellishments, it offers an unopinionated monochrome foundation with crisp typography, restrained contrast, and standard native affordances.

### Design Principles

1. **Content First**: The interface recedes to let product content, developer code, and user data lead.
2. **Neutral by Default**: High-contrast monochrome palettes (charcoal, slate, and true black/white) provide immediate legibility and seamless dark mode parity.
3. **Ergonomic & Accessible**: Strict adherence to minimum 44pt touch targets, standard safe areas, keyboard avoidance, and RTL text direction.
4. **Token-Driven Customization**: Rebranding requires modifying only top-level design tokens in `DESIGN.md`, `src/global.css`, and `colors.js`.

---

## Colors

The palette is anchored by a neutral grayscale, supported by semantic accents for status and validation.

### Core Palettes

| Token | Light Value | Dark Value | Purpose |
| --- | --- | --- | --- |
| `background` | `#ffffff` | `#0a0a0a` | App canvas background |
| `foreground` | `#0a0a0a` | `#fafafa` | Primary text and headings |
| `card` | `#ffffff` | `#141414` | Card, dialog, and surface background |
| `card-foreground` | `#0a0a0a` | `#fafafa` | Card body and header text |
| `muted` | `#f5f5f5` | `#262626` | Muted surfaces, input fills, badges |
| `muted-foreground` | `#737373` | `#a3a3a3` | Secondary text, placeholders, captions |
| `border` | `#e5e5e5` | `#2e2e2e` | Component borders and subtle dividers |
| `input` | `#e5e5e5` | `#2e2e2e` | Form field outline and separators |
| `primary` | `#171717` | `#fafafa` | Primary call to action |
| `primary-foreground` | `#ffffff` | `#0a0a0a` | Text on primary buttons |
| `secondary` | `#f5f5f5` | `#262626` | Secondary buttons and tonal surfaces |
| `secondary-foreground` | `#171717` | `#fafafa` | Text on secondary buttons |
| `destructive` | `#ef4444` | `#dc2626` | Destructive actions and error states |
| `destructive-foreground`| `#ffffff` | `#ffffff` | Text on destructive buttons |
| `success` | `#22c55e` | `#16a34a` | Confirmation and positive feedback |
| `warning` | `#f59e0b` | `#d97706` | Cautionary states and warnings |

---

## Typography

Typography is native-first: `--font-sans` is exactly `Inter` on iOS and Android so it matches the font registered by the root layout. Medium, semibold, and bold text use the matching registered weight families through `font-medium`, `font-semibold`, and `font-bold`. On web only, the same tokens include the full system fallback stack. To change the app font, replace the four registered font assets and update the four `--font-*` tokens in `src/global.css`.

| Scale | Size | Line Height | Weight | Usage |
| --- | --- | --- | --- | --- |
| `display` | 30px | 36px (1.2) | Bold (700) | Large hero stats, welcome headers |
| `headline` | 24px | 30px (1.25) | Semibold (600) | Main screen titles |
| `title` | 20px | 26px (1.3) | Semibold (600) | Section and card headers |
| `body` | 16px | 24px (1.5) | Regular (400) | Standard reading and form content |
| `label` | 14px | 20px (1.4) | Medium (500) | Form labels, button text, list subtext |
| `caption` | 12px | 16px (1.4) | Regular (400) | Timestamps, microcopy, helper notes |

---

## Layout

Layouts operate on a flexible 4px/8px coordinate grid:

- **Screen Margins**: 16px (`px-4`) standard mobile edge padding, scaling to 24px (`px-6`) on wider screens.
- **Section Spacing**: 24px to 32px between logical content blocks.
- **Item Gaps**: 8px (`gap-2`) or 12px (`gap-3`) for form elements and clustered actions.
- **Safe Areas**: All screens integrate edge-to-edge support with `react-native-safe-area-context` and adaptive keyboard scrolling via `react-native-keyboard-controller`.

---

## Elevation & Depth

To preserve a crisp, technical look on mobile devices, Swapstack prioritizes tonal separation and precise borders over heavy blurred shadows:

- **Flat / Surface**: Base canvas (`bg-background`).
- **Raised**: Cards and list items sit on `bg-card` with a 1px border (`border-border`), providing crisp definition on OLED screens.
- **Floating**: Sheets, modals, and toasts utilize soft ambient shadows (`shadow-sm` or `shadow-md`) combined with translucent scrims (`bg-black/50`).

---

## Shapes

Corners follow a consistent hierarchy:

- `rounded-sm` (6px): Badges, tags, and small pill indicators.
- `rounded-md` (8px): Interactive controls, including buttons, inputs, and segment selectors.
- `rounded-lg` (12px): Standard cards, modal containers, and alert banners.
- `rounded-xl` (16px): Bottom sheets and elevated group containers.
- `rounded-full` (9999px): Avatars, notification dots, and round icon actions.

---

## Components

The core UI kit lives in `src/components/ui`:

1. **Button**: Multi-variant touch target (`default`, `secondary`, `outline`, `destructive`, `ghost`, `link`) with loading indicators and full-width mobile support.
2. **Input**: Accessible text field with label, error text, helper text, and integrated password reveal toggle (`secureTextEntry`).
3. **Card**: Modular container with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.
4. **Screen**: Safe area container with keyboard avoiding / keyboard aware scrolling and flexible edge insets.
5. **Text**: Standardized typography component with RTL support and theme-aware color defaults.
6. **Divider**: 1px rule separator with optional center text label (e.g., `"OR"` in auth flows).
7. **Avatar**: Profile picture component with image loading, fallback initials, and multiple sizes (`sm`, `md`, `lg`, `xl`).
8. **Toast**: Transient notification banner and toast dispatchers for success, error, warning, and info feedback.

---

## Do's and Don'ts

### Do
- Use semantic token classes (`bg-card`, `text-foreground`, `border-border`) so dark mode works automatically.
- Keep interactive touch targets at least 44x44pt.
- Provide clear visual validation states for all user input fields.
- Wrap full-screen views with `<Screen>` to guarantee safe area and keyboard safety across iOS and Android.

### Don't
- Don't hardcode hex codes directly inside screen components; reference Tailwind/Uniwind tokens.
- Don't use heavy colored shadows or decorative gradients that break the neutral developer aesthetic.
- Don't rely on platform-dependent keyboard offsets; let `Screen` manage keyboard adjustments.

# Design System: The Ritual of Care

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Atelier"**
This design system moves away from the clinical, high-density nature of traditional inventory management. Instead, it draws inspiration from high-end Korean skincare boutiques and editorial lookbooks. The goal is to transform "stock tracking" into a "self-care ritual." 

The system rejects the rigid, boxy constraints of standard SaaS interfaces in favor of **intentional asymmetry** and **tonal layering**. We treat the screen not as a data grid, but as a curated vanity. Elements should feel like physical objects resting on a soft, linen surface. Use generous whitespace (the "breath" of the UI) to ensure the user never feels overwhelmed by their own belongings.

---

## 2. Colors & Surface Philosophy
The palette is a collection of "living neutrals"—shades that feel warm, organic, and tactile. 

### The "No-Line" Rule
**Strict Mandate:** Prohibit the use of 1px solid borders for sectioning or containment. Boundaries are defined exclusively through background shifts.
- To separate a header from a body, transition from `surface` to `surface-container-low`.
- To highlight a featured item, place a `surface-container-lowest` card on a `surface-container` background.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked fine papers. 
*   **Base:** `background` (#faf9f6)
*   **Sectioning:** `surface-container-low` (#f4f4f0)
*   **Elevated Content:** `surface-container-lowest` (#ffffff)
*   **Active/Interaction Overlays:** `surface-bright` (#faf9f6)

### Signature Textures & Glassmorphism
To avoid a flat "template" look:
- **The Glow:** Use subtle linear gradients for primary CTAs, transitioning from `primary` (#586249) to `primary-dim` (#4c563e) at a 145-degree angle.
- **Glassmorphism:** For floating navigation bars or modal headers, use `surface` at 80% opacity with a `20px` backdrop-blur. This allows the soft sage and taupe tones of the content to bleed through, creating a sense of depth and luxury.

---

## 3. Typography
The typography is a dialogue between the timeless elegance of **Noto Serif** and the modern, rhythmic clarity of **Manrope**.

*   **Display & Headlines (Noto Serif):** Used for titles of collections and product names. The high contrast of the serif evokes the feeling of a premium magazine.
*   **Body & Labels (Manrope):** Used for utility, descriptions, and counts. Manrope’s geometric but warm terminals keep the "inventory" aspect legible and efficient.

**The Editorial Hierarchy:**
- **Display-lg:** Use for "Welcome" states or empty-shelf messages to create a high-end, gallery feel.
- **Headline-sm:** Use for category titles (e.g., "Morning Routine")—always paired with generous top-margin spacing.
- **Label-md:** Always tracked out (+0.02em) for a sophisticated, airy feel in status tags.

---

## 4. Elevation & Depth
In this system, "Elevation" is a feeling of air, not a drop-shadow effect.

*   **The Layering Principle:** Depth is achieved by "stacking" container tiers. A `surface-container-lowest` card on a `surface-container-high` background creates a natural lift.
*   **Ambient Shadows:** If a shadow is required for a floating action button or a modal, use a "Tinted Ambient Shadow." 
    *   *Values:* `0px 12px 32px`
    *   *Color:* `on-surface` (#2f3430) at **4% opacity**. It should be felt, not seen.
*   **The "Ghost Border" Fallback:** If accessibility requires a border (e.g., in high-contrast modes), use `outline-variant` (#afb3ae) at **15% opacity**. Never use 100% opaque lines.

---

## 5. Components

### Cards & Inventory Items
- **Rule:** No dividers. Use `md` (0.75rem) roundedness for cards.
- **Visuals:** Large, soft-focus imagery of products.
- **Inventory Status:** Instead of "Red for Alert," use the `error` token (#9e422c) with a `error-container` (#fe8b70) background for a "muted terracotta" look. It signals urgency without inducing anxiety.

### Buttons
- **Primary:** `primary` (#586249) background with `on-primary` text. Use `full` roundedness for a soft, pebble-like feel.
- **Tertiary (Minimalist):** No background. Text in `primary` with a custom underline (2px height, 20% opacity) that expands on hover.

### Inputs & Search
- **Style:** Underline-only or subtle `surface-container-highest` fills. 
- **Focus State:** Instead of a thick border, the background shifts to `surface-container-lowest` and the label (Noto Serif) subtly floats upward.

### Specialized Component: The "Stock Meter"
A custom component for Vanity Stock. Avoid progress bars. Use a series of vertical "tally" lines. Active lines use `primary`; depleted lines use `outline-variant` at 30% opacity. This feels more artisanal and less like a "loading" bar.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Place a heading on the left and a "Total Count" on the far right with significant white space between them.
*   **Use Tonal Shifts:** Distinguish the "Expired" section from "Active" by shifting the entire background of that section to `tertiary-container`.
*   **Prioritize Negative Space:** If you think a screen needs more content, it probably needs more margin.

### Don't:
*   **Don't use 1px borders:** This is the quickest way to make a premium design look like an enterprise dashboard.
*   **Don't use pure black:** Use `on-surface` (#2f3430) for text to maintain the soft, Korean-inspired warmth.
*   **Don't use standard "Alert" colors:** Avoid bright #FF0000. Use our sophisticated `error` and `tertiary` tokens to keep the user "calm but informed."
*   **Don't crowd the edges:** Maintain a minimum 24px screen margin at all times to preserve the "private, high-end" feel.
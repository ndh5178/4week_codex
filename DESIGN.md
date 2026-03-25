# Design System Document: High-End Editorial E-Commerce

## 1. Overview & Creative North Star
**Creative North Star: The Digital Curator**
This design system rejects the "warehouse" feel of traditional e-commerce in favor of a curated, editorial experience. The goal is to make the interface feel like a premium lifestyle magazine where the UI disappears to let the products breathe. We achieve this through "The Digital Curator" philosophy: intentional asymmetry, high-contrast typographic scales, and the use of negative space as a luxury material rather than an empty void.

By leveraging a sophisticated palette of cool greys and a striking ruby-accent (`tertiary`), we create a rhythmic browsing experience that guides the eye through tonal shifts rather than rigid structural lines.

---

## 2. Colors & Surface Philosophy
The color strategy focuses on depth and sophistication, moving away from flat white backgrounds toward a layered, atmospheric environment.

### The "No-Line" Rule
To maintain a high-end feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries between the top category navigation and the product grid must be defined solely through background color shifts. For example, the horizontal category scroll area sits on `surface` (`#faf9fc`), while the product grid area transitions into `surface-container-low` (`#f4f3f8`) to create a soft, logical anchor.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use the Material surface tiers to define importance:
*   **Base Layer:** `surface` (#faf9fc) for global backgrounds.
*   **Content Areas:** `surface-container-low` (#f4f3f8) to group related product modules.
*   **Elevated Components:** `surface-container-lowest` (#ffffff) for individual product cards to provide a crisp, clean lift.

### The "Glass & Gradient" Rule
For floating elements, such as the "Next" arrow on the category scroll or the "Filter" FAB, use Glassmorphism. Apply a semi-transparent `surface-container-lowest` with a `backdrop-filter: blur(20px)`. Main CTAs should utilize a subtle gradient transition from `primary` (#5d5e61) to `primary-dim` (#515255) to provide a "soulful" professional polish that flat fills lack.

---

## 3. Typography
Our typography creates an editorial rhythm by pairing the architectural structure of **Manrope** with the functional clarity of **Inter**.

*   **Display & Headline (Manrope):** These are the "Editorial Voice." Use `display-lg` and `headline-md` for category headers and marketing callouts. The geometric nature of Manrope provides an authoritative, modern tone.
*   **Title & Body (Inter):** These are the "Functional Voice." Use `title-md` for product names and `body-md` for descriptions. 
*   **Label (Inter):** Specifically use `label-sm` for technical details and the vibrant `tertiary` color for "Sale" or "New" badges to create an immediate visual hierarchy that cuts through the neutral greys.

---

## 4. Elevation & Depth
In this design system, depth is a feeling, not a feature. We move away from traditional drop shadows toward **Tonal Layering**.

### The Layering Principle
Hierarchy is achieved by stacking surface-container tiers. Placing a `surface-container-lowest` card on a `surface-container-low` background creates a natural, soft lift.

### Ambient Shadows
When a card requires a floating effect (e.g., during a hover state), use an **Ambient Shadow**. 
*   **Blur:** 24px - 40px.
*   **Opacity:** 4%-6%.
*   **Color:** Tint the shadow with `on-surface` (#2f323a) rather than pure black to mimic natural light refraction.

### The "Ghost Border" Fallback
If a visual separator is mandatory for accessibility, use a **Ghost Border**. This is the `outline-variant` (#afb1bc) token at a reduced **15% opacity**. Never use high-contrast outlines.

---

## 5. Components

### Circular Category Buttons
*   **Structure:** A 1:1 aspect ratio container (`rounded-full`) using `spacing-12` (4rem) for the image/icon area.
*   **State:** The active category is defined by a 2px stroke of `secondary` (#635c72) with a `spacing-1` (0.35rem) offset (the "Halo" effect).
*   **Typography:** Use `label-md` below the circle, centered, with `on-surface-variant`.

### Product Cards
*   **Container:** `surface-container-lowest` with `rounded-md` (0.75rem).
*   **Spacing:** Use `spacing-3` (1rem) for internal padding.
*   **No Dividers:** Separate the image from the product info using vertical white space (`spacing-4`). 
*   **Interaction:** On hover, the card should scale slightly (1.02x) and transition its shadow from "Ambient" to "Elevated."

### Editorial Badges ('Sale' / 'New')
*   **Token:** `tertiary` (#be004c).
*   **Style:** `rounded-sm` (0.25rem) with `label-sm` typography in `on-tertiary`. 
*   **Placement:** Top-left of the product image, slightly overlapping the edge to break the grid's rigidity.

### Input Fields & Search
*   **Surface:** `surface-container-high` (#e7e8f0) with `none` border.
*   **State:** On focus, transition to `surface-container-lowest` with a "Ghost Border" of `primary`.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `spacing-16` (5.5rem) or `spacing-20` (7rem) between major vertical sections to create a high-end, unhurried feel.
*   **Do** use asymmetrical image cropping within the grid to make the layout feel like a custom-designed lookbook.
*   **Do** use `on-surface-variant` for secondary text to maintain a soft, sophisticated contrast ratio.

### Don't
*   **Don't** use 100% black (#000000) for text. Always use `on-surface` (#2f323a) to avoid a "cheap" high-contrast look.
*   **Don't** use divider lines to separate list items. Use background color shifts or `spacing-6` (2rem) gaps.
*   **Don't** use standard "Blue" for links. Use `primary` with a `tertiary` underline on hover to maintain the brand's unique character.
# DIMES-BI — Nano Banana logo generation prompts

Prompts for [Nano Banana](https://ai.google.dev/) (Gemini image generation), structured from the **logo-generator** skill workflow: brand brief → distinct concept variants → optional showcase pass after exporting a chosen mark to PNG.

---

## Brand brief (prepend to any prompt)

```text
PRODUCT: DIMES-BI
INDUSTRY: B2B SaaS — MEAL (Monitoring, Evaluation, Accountability & Learning), humanitarian & NGO analytics
PARENT: DIMES product family (sibling: DIMES IDMS). GARTS Africa.

POSITIONING: Bring-your-own-data (BYOD) analytics workspace. Connects Kobo, Excel, SurveyCTO, Google Forms, APIs, and more into one place for indicators, dashboards, maps, and donor reports—without changing how teams collect data.

CORE CONCEPTS (visual metaphors): connection / integration / unified insight / flowing data / dashboards / geographic MEAL / targets & indicators / trustworthy single source of truth

DESIGN PREFERENCES:
- Style: minimal, geometric, high-end SaaS; 1–2 focal elements; 40–50% negative space
- NOT: generic AI blobs, mascots, clip-art charts, busy 3D gradients, stock “humanitarian hands” imagery, excessive text
- Mood: professional, calm, intelligent, approachable; credible for donors and MEAL officers
- Scalable: must read at 16px favicon and 512px app icon

COLOR SYSTEM (use 1–2 colors max in the mark):
- Primary accent: lagoon teal #4FB8B2, deep teal #328F97
- Marketing accent: violet #7C3AED → indigo #4338CA (landing CTAs)
- Neutral ink: sea #173A40, soft #416166
- Light surfaces: sand #E7F0E8, foam #F3FAF5
- Optional: subtle sky #38BDF8 for map/global hint only

TYPOGRAPHY (wordmark separate from icon): Manrope (UI), Fraunces (display headlines). Icon-only prompts unless “lockup” variant is requested.

OUTPUT: flat vector logo mark, sharp edges, no drop shadows, no photographic texture. Square 1:1, centered, transparent or pure white (#FFFFFF) background.
```

---

## Primary prompt — logo mark (recommended starting point)

Use when generating the **icon/symbol** only (wordmark “DIMES-BI” added in Figma/code later).

```text
[BRAND BRIEF — paste block above]

TASK: Design a single app-icon-ready logo symbol for DIMES-BI.

VISUAL IDEA: A minimal “data hub” — three small nodes (representing disparate data sources) connected by thin lines converging into one stronger central node or lens shape (unified analytics). Slight asymmetry: two nodes lower-left, one upper-right, flow lines with gentle curves not sharp zigzags.

EXECUTION:
- 100% flat vector, 2–3px-equivalent stroke weight, solid fills only
- Primary color: lagoon teal #4FB8B2 on white; optional second tone #328F97 for depth via overlap only (no gradients)
- 45% empty canvas; symbol occupies ~55% of frame
- No letters, no numbers, no globe clipart
- Crisp SVG-like geometry: circles, rounded caps, one subtle rounded rectangle suggesting a dashboard tile optional

QUALITY BAR: Swiss / Linear / Vercel-tier restraint. Memorable at favicon size. Distinct from Power BI and Tableau clichés (no pie chart icon).

Aspect ratio 1:1. Ultra-high resolution. Transparent background.
```

---

## Six concept variants (generate separately)

Run each as its own Nano Banana session. Pick 2–3 favorites, then refine.

### Variant A — Converging connectors (BYOD)

```text
[BRAND BRIEF]

Logo mark: five dots in asymmetric orbit; four small dots (data sources) linked by hairline paths to one larger central dot (workspace). Line weight uniform. Lagoon #4FB8B2 on white. Extreme minimalism, void center feeling. No text. Flat vector 1:1 transparent.
```

### Variant B — Layered dashboard

```text
[BRAND BRIEF]

Logo mark: two offset rounded squares (dashboard layers), front square has one small bar and one dot (abstract chart), back square 20% larger and lighter teal #328F97. Suggests stacked analytics without literal UI chrome. 50% negative space. Flat vector, no shadows. 1:1 white background.
```

### Variant C — Flow ribbon

```text
[BRAND BRIEF]

Logo mark: single continuous ribbon path forming a soft “D” or loop — data flowing in and through. Stroke 3.5pt, rounded joins, color #4FB8B2. One small break or node on the path for “connection” metaphor. Asymmetric composition, bottom-weighted. No gradient. 1:1 transparent.
```

### Variant D — Target / indicator ring

```text
[BRAND BRIEF]

Logo mark: thin ring (MEAL target) with one solid wedge segment at 10 o’clock and a center dot (actual vs target). Geometric, not a speedometer. Colors: ring #416166 at 30% opacity, wedge and dot #4FB8B2. Clinical, precise. 1:1 white.
```

### Variant E — Map + grid hint

```text
[BRAND BRIEF]

Logo mark: simplified 3×3 grid where three cells contain tiny dots connected by one diagonal line to a fourth dot outside the grid (data leaving silos into insight). Teal #4FB8B2 + ink #173A40 only. Very subtle, not a literal map. High negative space. Flat vector 1:1.
```

### Variant F — Violet bridge (marketing-aligned)

```text
[BRAND BRIEF]

Logo mark: minimal arch bridge shape (integration layer) in violet #7C3AED with teal #4FB8B2 dot sitting on the keystone. Two pillars implied by negative space cuts with rounded inner corners. Confident, not playful. No text. 1:1 transparent.
```

### Variant G — Wordmark lockup (optional)

```text
[BRAND BRIEF]

Horizontal logo lockup: small geometric icon (choose one concept: converging nodes OR layered squares) left of wordmark “DIMES-BI”. Wordmark: bold geometric sans similar to Manrope, “DIMES” in #173A40, “-BI” in #4FB8B2 or violet #7C3AED. Tight kerning, no tagline. Flat vector, white background, wide aspect 3:1.
```

---

## Showcase pass (after you export PNG from SVG)

When you have a **reference PNG** (1024×1024, transparent), use Nano Banana with image input + this prompt. Matches `logo-generator/scripts/generate_showcase.py` structure.

**Recommended styles for DIMES-BI** (from `background_styles.md`):

| Style key   | Why it fits DIMES-BI                                      |
|------------|------------------------------------------------------------|
| `fluid`    | AI/data visualization, violet-indigo matches landing CTA |
| `frosted`  | Premium SaaS, calm MEAL stakeholder presentations          |
| `morning`  | Approachable NGOs, warm ivory + pastel aura                |
| `ui_container` | App icon / product marketing, digital-native context   |

### Showcase prompt template (dark — e.g. `fluid`)

```text
Extract the core graphic from the reference image as a pure flat single-color vector structure, removing all decorations. Use high-contrast atmosphere background, delicate film grain noise, and rigorous micro-typography to create a cutting-edge, restrained, and highly digital order showcase effect.

LOGO PROCESSING:
- Strip background and outer frames
- Extract core graphic only, preserve graphic details
- Extremely flat: 100% solid color flat vector in pure white (#FFFFFF)
- Sharp, clear edges
- Logo MUST be pure white (#FFFFFF) for maximum contrast

BACKGROUND CONSTRUCTION:
FLUID ABYSS (流体深渊)
Deep midnight purple or extremely dark Klein blue base. Noise texture with slight color tint, blending into deep-sea sediment or nebula quality. Fluid fusion light — dark orange on right, dark blue on left, slowly interweaving in the dark center. Suggests AI-native data fluidity.

TYPOGRAPHY AND LAYOUT:
Swiss-style micro-typography, extreme proportion contrast.
- Main subject centered: flat logo at absolute visual center, huge breathing space
- Font 6–9pt clean sans (Inter / Helvetica / Geist)
- Left corner: DIMES-BI
- Right corner: v. 1.0.0 // 2026
- Bottom center: BYOD MEAL ANALYTICS & DASHBOARDS

CRITICAL: Logo graphic MUST be pure white (#FFFFFF), perfectly centered, flat vector, sharp edges.
Aspect ratio 16:9. 2K resolution.
```

### Showcase prompt template (light — e.g. `morning`)

Same as above, but:

- Logo color: `pure black (#000000)`
- Background: **MORNING AURA** — warm ivory base, soft mist noise, large blurred low-saturation pastels (mint, baby blue, dawn orange) dissolving into warm white; warm, intelligent, pressure-free.

---

## Negative prompt (append if the tool supports it)

```text
Avoid: 3D renders, photorealism, gradients, neon glow, drop shadows, bevels, mascots, people, globes with meridians, pie charts, bar chart clipart, Microsoft Power BI yellow aesthetic, Tableau orange, generic purple AI orb, busy patterns, serif script fonts, taglines, watermarks, multiple logos, blurry edges, low contrast, dark-on-dark logo.
```

---

## Iteration checklist (logo-generator Phase 3)

1. Generate variants A–F (icon only).
2. Shortlist 2–3; ask Nano Banana to **simplify further** (fewer nodes, thicker stroke, more whitespace).
3. Export winner to SVG (trace or redraw in Figma), then PNG 1024×1024.
4. Run showcase with `fluid` + `ui_container` for marketing site and app store assets.
5. Export favicon 32/48px and sidebar 24px to validate legibility.

---

## CLI (optional)

From the logo-generator skill repo, after PNG exists:

```bash
python scripts/generate_showcase.py \
  --logo-name "DIMES-BI" \
  --reference path/to/dimes-bi-logo.png \
  --style fluid \
  --description "BYOD MEAL analytics and dashboards" \
  --output ./showcase-fluid.png
```

Requires `GEMINI_API_KEY` in `.env` (see `bi-dimes/.env.example` if you mirror keys locally).

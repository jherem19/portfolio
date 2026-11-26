# Portfolio typography

Geist is the single family, loaded through next/font. All sizes are rooted in rem; never set the root size in pixels. Fluid roles combine rem and viewport units, with readable minimums.

| Role | Size at default 16px root | Use |
| --- | --- | --- |
| Caption | 12px | Dates, badges, small metadata |
| Small | 14px | Navigation, buttons, supporting card copy |
| Body | 16px | Descriptions and form inputs |
| Reading | 18–20px | Long article / case study text |
| Lead | 18–22px | Page introductions |
| List title | 18–21px | Compact article recommendations |
| Card | 20–24px | Archive cards and small headings |
| List heading | 24–28px | Recommendation section title |
| Subheading | 24–32px | Service cards and secondary headings |
| Article heading | 28–40px | Long-form section headings |
| Section | 32–56px | Main landing-page sections |
| Feature | 36–52px | Featured case study title |
| Hero | 40–74px | Home headline |
| Page | 40–80px | Interior page title |

Headings use 500 weight (550 in editorial sections), 1.06 display / 1.16 heading line height and restrained negative tracking. Body uses 400 weight and 1.6 line height; long-form reading uses 1.75. Metadata never falls below 12px. Inputs use 16px to avoid automatic zoom on mobile Safari. Numeric/stat artwork has its own role.

Keep article measure around 60–70 characters and recommendations at their existing centered 760px width. Preserve generous separation between headings and body. Use semantic heading order; a card's h3 can use the feature role without changing its document level. Do not encode hierarchy only with color.

Change role tokens in globals.css rather than introducing new one-off sizes. Existing responsive selectors reference the same fluid roles so breakpoints do not unexpectedly shrink identical components. The CMS uses the same utility scale; its editor headings retain a compact hierarchy.

Validation: production build and CSS parse; source review of home, work archive, project/case templates, services, 3D, experiments, resources/detail, contact, shared navigation/footer and CMS. This is a source-level audit, not a claim of browser/device visual verification.

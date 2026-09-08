# Choropleth boundary maps

Dimes BI ships static GeoJSON for regional choropleth charts and dashboards. Built-in maps live under `public/geo/`; organizations can upload custom boundaries from **Mappings → Boundary maps**.

For source licenses, regeneration, and upstream citations, see [PROVENANCE.md](./PROVENANCE.md). Machine-readable metadata (feature counts, full property labels, source URLs) is in [`public/geo/MANIFEST.json`](../../public/geo/MANIFEST.json).

## Built-in maps

All built-in layers normalize every feature to at least `name` (label) and `code` (default join key). The choropleth editor defaults **Target Field** to `code`; choose another property when your query keys do not match `code`.

| Map id | Display name | URL path | Default target field | Recommended join columns | Features |
|--------|--------------|----------|----------------------|--------------------------|----------|
| `world-countries` | World Countries | `/geo/world-countries.geojson` | `code` | `code` (ISO alpha-2), `iso_a2`, `iso_a3`, `name` | 177 |
| `africa-countries` | Africa Countries | `/geo/africa-countries.geojson` | `code` | `code` (ISO alpha-2), `iso_a2`, `iso_a3`, `name` | 51 |
| `kenya-counties` | Kenya Counties | `/geo/kenya-counties.geojson` | `code` | `code` (ISO 3166-2, e.g. `KE-43`), `name` | 47 |
| `kenya-subcounties` | Kenya Sub-counties | `/geo/kenya-subcounties.geojson` | `code` | **`name`** for human-readable sub-county labels; `code` is an opaque geoBoundaries `shapeID` unless you have those IDs | 290 |

### Kenya ADM2 join caveat

Kenya counties (ADM1) expose stable ISO 3166-2 codes in `code` (e.g. `KE-43`). Sub-counties (ADM2) often have an empty `shapeISO`, so `prepare-geo` sets `code` from geoBoundaries `shapeID` (e.g. `3690345B95414198105650`). For typical survey or admin labels, **join on `name`** (or align your query to `shapeName`) rather than `code`. Use `code` only when your data already carries geoBoundaries shape IDs.

### Licensing and attribution

| Source | Maps | License | Attribution |
|--------|------|---------|-------------|
| [Natural Earth](https://www.naturalearthdata.com/) | World, Africa | Public domain — use without restriction | Optional: *Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.* |
| [geoBoundaries](https://www.geoboundaries.org/) gbOpen | Kenya counties, sub-counties | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — **credit required** | Runfola, D. et al. (2020) geoBoundaries. *PLoS ONE* 15(4): e0231866. [https://doi.org/10.1371/journal.pone.0231866](https://doi.org/10.1371/journal.pone.0231866) |

Do not hand-edit files in `public/geo/`. Regenerate with `npm run prepare:geo` after changing `scripts/prepare-geo.mjs`.

## Custom boundary maps

1. Open **Mappings** (`/mappings`) and scroll to **Boundary maps**.
2. Click **Upload GeoJSON** and choose a GeoJSON `FeatureCollection` (max 15 MB raw upload).
3. Set a display name and **join field** — the property used as **Target Field** in choropleth charts (auto-detected: prefers `code`, then `name`).
4. Preview, then save. Custom maps are stored per organization in Supabase (`geo_datasets` + `dimes-geo` storage) and appear in choropleth map pickers as `custom:{id}`.

Uploaded GeoJSON should include a stable identifier on each feature (typically `code` or `name`). The upload pipeline may simplify large files server-side.

## Authoring choropleth visualizations

Choropleth widgets color regions by joining query rows to GeoJSON feature properties.

### 1. Shape the query

Use **GROUP BY** on a column that holds region identifiers (county name, ISO code, etc.) plus at least one **numeric aggregation** (count, sum, average, …). The result must include:

- One column whose values match the map’s **Target Field** → **Key Column** in the viz editor.
- One numeric column → **Value Column** (what drives the color scale).

Example: `GROUP BY county_name` with `COUNT(*)` produces rows like `{ county_name: "Turkana", count: 42 }`.

### 2. Configure the CHOROPLETH visualization

In the visualization editor (or mapping wizard for choropleth maps):

| Option | Role |
|--------|------|
| **Map** (`mapType`) | Built-in id (`kenya-counties`, …) or `custom:{uuid}` |
| **Key Column** | Query column joined to GeoJSON |
| **Target Field** | GeoJSON property to match (usually `code` or `name`) |
| **Value Column** | Numeric column to color |

The renderer builds a lookup from query rows (`keyColumn` → `valueColumn`) and paints each feature where `feature.properties[targetField]` matches.

### 3. Choropleth mappings

**Mappings → Create with wizard → Regional choropleth** follows the same join model. You can link an existing CHOROPLETH visualization or set map, key, target, and value fields directly.

## Public and shared dashboards

| Map type | GeoJSON URL in the browser |
|----------|----------------------------|
| Built-in | Same-origin paths under `/geo/*` (served from the app’s `public/geo/`) |
| Custom | Public Supabase Storage URL from the `dimes-geo` bucket (`public_url` on `geo_datasets`) |

Shared Redash-style dashboards (`shared-link-access`) always include built-in maps. When a published dashboard uses a custom map (`custom:{id}`), the edge function loads that organization’s `geo_datasets` row and adds `{ name, url, fieldNames }` to `choroplethAvailableMaps` in the payload so anonymous viewers can fetch the GeoJSON.

## Related code

- Built-in registry: `src/lib/geo/mapRegistry.ts`
- Geo prep script: `scripts/prepare-geo.mjs`
- Upload UI: `src/components/geo/BoundaryMapsSection.tsx`, `UploadGeoDialog.tsx`
- Public payload: `supabase/functions/_shared/choroplethMaps.ts`
- In-app hint: `src/components/data/ChoroplethAuthoringHint.tsx`

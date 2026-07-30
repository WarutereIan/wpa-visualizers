# Query builder review — DIMES-BI

## What's working

The wizard flow (Basics → Template → Build → Review), the widget gallery grouped by chart family, and the query-catalog concept — reusable queries shared across widgets — are all sound patterns. This is a solid foundation to build on.

## The core issue

In the current build, a query was set up to do `SUM(Response ID)` — but Response ID is a UUID/identifier, not a number. That's why the KPI card renders `0` or `1` instead of a meaningful value. The real measures in the data (`How many volts`, `How much water?`) sit unused right next to it.

This isn't really a data-entry mistake. It's what happens when the builder doesn't know column types and lets you aggregate anything.

There's also a second, deeper issue: **aggregation happens twice**. The query aggregates (SUM on a field), and then the widget config aggregates *again* ("Measure field (averaged)" on top of the query's own SUM). That double layer is confusing even to the person building it — a widget consumer has no way to tell whether a number is an average-of-an-average.

## Recommended query pipeline

A single-layer pipeline where the query fully defines the output shape, and a widget just binds to a field the query already produced:

1. **Sources & joins** — import and combine tables
2. **Filters** — rule groups with AND/OR
3. **Group by** — fields + date buckets
4. **Aggregations** — typed, multi-metric
5. **Sort & limit** — top-N ordering
6. **Query output** — feeds widgets directly (no second aggregation step)

## Priority order for the rebuild

### 1. Make columns type-aware
Tag every imported column as text, number, date, or boolean. Then restrict what's offered downstream: SUM/AVG only appear for numeric columns, date-bucketing only for date columns. This alone would have caught the `SUM(Response ID)` case.

### 2. Collapse the double aggregation
Right now the query aggregates (SUM on a field) and the widget re-aggregates on top ("Measure field (averaged)"). Pick one layer: the query defines the final shape, and a widget just binds to a named field the query already produced. One number, one clear path to how it was computed.

### 3. Support multiple named aggregations per query
Let one query produce several metrics at once — `sum_volts`, `avg_water`, `count_responses` — each with an inline, editable alias. Right now it looks like one aggregation at a time with an auto-generated name like `sum_Response ID`.

### 4. Add computed fields
A small formula layer for things aggregations alone can't do: ratios, differences, percent-of-total, week-over-week change. This is usually the gap between a "BI tool" and something that feels report-grade.

### 5. Flesh out the filter builder UI
The "+Rule +Group" button is there, but once a rule is added it needs an operator picker that changes by column type (`=`, `contains`, `between`, `in`) and a clear visual for AND/OR nesting between groups, not just a flat list.

### 6. Add date granularity to Group by
Day/week/month/quarter/year bucketing on date fields. Without this, trend charts (line, area) have no way to control their own x-axis resolution.

### 7. Make the live preview reflect the real output
After adding a GROUP BY or aggregation, the preview table still shows raw rows. It should immediately show the aggregated shape — the same rows and columns a widget would actually receive.

### 8. Add joins and protect shared queries
Let a query pull from more than one imported table (with a simple relationship picker), and when someone edits a query that's already used by other widgets, warn them what else will change.

## What matters most right now

Steps 1 and 2 matter most — they're what's causing the KPI card to show a meaningless number today. Everything after that (multi-metric queries, computed fields, joins) closes the gap between "dashboard tool" and "as good as reports," but won't matter much until the aggregation model itself is trustworthy.

**Tracking (approved rebuild — phases 0–7 implemented):**
- Design: [`docs/superpowers/specs/2026-07-30-query-pipeline-rebuild-design.md`](./superpowers/specs/2026-07-30-query-pipeline-rebuild-design.md)
- Plan + checklists: [`docs/superpowers/plans/2026-07-30-query-pipeline-rebuild.md`](./superpowers/plans/2026-07-30-query-pipeline-rebuild.md)

## Small polish item

Rename auto-generated aliases like `sum_Response ID` to something like `sum_response_id` — spaces in field names will cause problems later if these ever get referenced in a formula or exported.
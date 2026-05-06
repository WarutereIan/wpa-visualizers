# DIMES-BI — Product Specification

**Version:** 0.1 Draft
**Date:** May 2026
**Status:** Working Document

---

## 1. Product Overview

DIMES-BI is a bring-your-own-data (BYOD) MEAL, analytics, and dashboarding platform designed for organizations that collect data across many tools but need one trusted place to connect, model, analyze, visualize, and act on that data. It combines the analytical depth of platforms like Power BI with a more guided, opinionated experience tailored to MEAL teams, program managers, analysts, partners, and decision-makers in the NGO, humanitarian, development, research, and public sector spaces.

Rather than forcing organizations to standardize on a single data collection tool, DIMES-BI sits above existing tools as an intelligent integration and analytics layer. It allows users to bring in data from multiple sources, structure it into a shared semantic model, build reusable indicators and queries, and generate interactive dashboards and reports that support monitoring, reporting, learning, accountability, and strategic decision-making.

---

## 2. Target Users

| User Type | Primary Needs |
|---|---|
| MEAL Officers | Build indicators, track targets, run data quality checks, produce period reports |
| Program Managers | Monitor program performance, compare actuals vs targets, identify gaps |
| Country Directors / Senior Management | High-level KPI dashboards, cross-program summaries, strategic overviews |
| Data Analysts | Complex queries, multi-source joins, custom calculations, advanced charts |
| Partners / Implementing Organizations | Restricted views of their own data, shared dashboards, data submissions |
| Donors / External Stakeholders | Read-only polished dashboards, exported report packs, embeddable views |
| IT / System Administrators | User management, connector configuration, workspace setup, security settings |

---

## 3. Core Value Proposition

- Connect fragmented data from many collection tools into a single trusted workspace
- Enable self-service analytics and indicator management for non-technical MEAL staff
- Provide Power BI-level analytical capability with a more guided and accessible experience
- Support the full MEAL cycle: data collection → quality checks → analysis → reporting → learning
- Scale from a single project to a multi-country, multi-program organization

---

## 4. Platform Architecture Overview

The platform is organized into the following logical layers:

```
┌─────────────────────────────────────────────────────────┐
│               Presentation Layer                        │
│  Dashboard Builder · Report Builder · Story Mode        │
├─────────────────────────────────────────────────────────┤
│               Analytics & Query Layer                   │
│  Indicator Builder · Query Engine · Disaggregations     │
├─────────────────────────────────────────────────────────┤
│               Semantic Data Model                       │
│  Entities · Dimensions · Measures · Results Frameworks  │
├─────────────────────────────────────────────────────────┤
│               Data Ingestion & Connector Layer          │
│  Kobo · Excel · M365 · SurveyCTO · Google Forms · ...   │
├─────────────────────────────────────────────────────────┤
│               Platform Services Layer                   │
│  Auth · Workspaces · Permissions · Audit · Notifications│
└─────────────────────────────────────────────────────────┘
```

---

## 5. Data Connectors

### 5.1 Supported Connectors (Initial Release)

| Connector | Type | Notes |
|---|---|---|
| KoboToolbox | Form data | REST API, incremental sync by submission date |
| Microsoft Excel | File upload / SharePoint | Manual upload and SharePoint-linked sync |
| Microsoft 365 / SharePoint | Documents & Lists | OAuth, real-time or scheduled sync |
| SurveyCTO | Form data | REST API, incremental sync |
| Google Forms / Google Sheets | Form + spreadsheet | OAuth, Google API |
| Microsoft Forms | Form data | OAuth, Microsoft Graph API |
| CSV / Flat files | File upload | One-off and recurring imports |

### 5.2 Future Connectors (Planned)

- ODK / ODK Central
- Ona
- DHIS2
- CommCare
- Salesforce (for CRM/program data)
- PostgreSQL / MySQL (direct database connections)
- REST API (generic connector with config)
- Humanitarian Data Exchange (HDX)

### 5.3 Connector Capabilities

Each connector must provide:

- **Authentication wizard**: guided OAuth or API key setup
- **Schema detection**: automatic discovery of fields, types, and choice lists
- **Field mapping**: map raw fields to platform entities and dimensions
- **Incremental sync**: only pull new or updated records since last sync
- **Scheduled refresh**: configurable sync intervals (real-time, hourly, daily, weekly)
- **Sync history**: log of all sync runs with record counts, errors, and timestamps
- **Health monitoring**: dashboard showing connector status and last successful sync
- **Failure alerts**: notify configured users when a sync fails or data is stale
- **Preview mode**: inspect raw data before committing to a mapping
- **Reusable mapping profiles**: save a field mapping and reuse it when the source form is updated

---

## 6. Semantic Data Model

### 6.1 Purpose

The semantic layer translates raw source data into meaningful program concepts, allowing users to think in terms of projects, beneficiaries, and indicators rather than raw tables and columns.

### 6.2 Core Entity Types

| Entity | Description |
|---|---|
| Project / Program | Top-level organizational unit |
| Activity | Sub-components of a project |
| Survey / Form | A data collection instrument |
| Beneficiary | An individual or household tracked over time |
| Location | Geographic entity (country, region, district, community) |
| Partner | Implementing or sub-implementing organization |
| Time Period | Reporting period, quarter, or phase |
| Outcome / Output | Results framework element |
| Indicator | A defined measure linked to one or more outcomes |
| Target | An expected value for an indicator over a period |

### 6.3 Dimensional Modeling

Users can define reusable dimensions for disaggregation:

- Gender (male, female, other, unknown)
- Age group (custom brackets)
- Geographic hierarchy (country → region → district → site)
- Vulnerability group
- Population category
- Partner / Implementing entity
- Custom dimensions (user-defined)

### 6.4 Results Framework Integration

Users can build and link:

- Logframes (goal, purpose, outputs, activities)
- Theories of change
- Results chains
- Indicator reference sheets with calculation methods, sources, and responsible teams

---

## 7. Indicator & Analytics Builder

### 7.1 Indicator Types

| Type | Description |
|---|---|
| Count | Count of records matching a filter |
| Sum | Numeric sum of a field |
| Average | Mean value of a field |
| Percentage / Ratio | Numerator divided by denominator |
| Conditional count | Count with one or more filter conditions |
| Disaggregated indicator | Same metric broken down by one or more dimensions |
| Composite indicator | Calculated from two or more other indicators |
| Trend / Delta | Change in value across time periods |
| Baseline-adjusted | Comparison against a defined baseline value |
| Target variance | Actual vs target with percentage achievement |

### 7.2 Formula Builder

- No-code UI with field picker, operator selector, and condition builder
- Low-code formula language for advanced users
- Preview results in real time as the formula is being built
- Inline documentation for each operator and function
- Test mode to validate against a sample of real data

### 7.3 Query Builder

- Visual query builder: select dataset, choose dimensions and measures, apply filters and date ranges
- Cross-dataset queries: join data from multiple sources using shared dimensions
- Saved queries that can power multiple widgets and dashboards
- Query versioning: track changes to a query definition over time
- Direct SQL access for advanced users with appropriate permissions

---

## 8. Dashboard Builder

### 8.1 Widget Types

| Widget | Description |
|---|---|
| KPI Card | Single metric with label, trend arrow, and target status |
| Bar Chart | Categorical comparisons (vertical or horizontal) |
| Line Chart | Trends over time |
| Area Chart | Stacked or cumulative trends |
| Pie / Donut Chart | Part-to-whole distributions |
| Scatter Plot | Correlation between two measures |
| Map (Choropleth) | Geographic distribution with color encoding |
| Map (Bubble) | Geographic distribution with size encoding |
| Table | Tabular data with sorting, filtering, and conditional formatting |
| Pivot Table | Cross-tabulation of dimensions and measures |
| Timeline | Events or milestones over time |
| Progress Bar | Indicator achievement towards target |
| Rich Text / Narrative | Formatted text, headings, and bullet points |
| Image / Media | Logos, photos, or embedded media |
| Filter Control | Date picker, dropdown, or multi-select for cross-dashboard filtering |
| Divider / Layout | Structural elements for organizing dashboard layout |

### 8.2 Dashboard Features

- Drag-and-drop canvas with snap-to-grid layout
- Responsive layouts (desktop, tablet, mobile breakpoints)
- Cross-filtering: clicking a chart element filters all other charts on the page
- Drill-through: click a summary value to navigate to a detail view
- Dashboard-level filters (date range, geography, partner, project)
- Multiple pages per dashboard
- Theming and branding (colors, fonts, logo, header)
- Audience-specific views from the same data (operational, management, donor)
- Audience-specific access controls per dashboard or per page
- Templates: pre-built dashboard layouts for common MEAL use cases
- Draft and published states with version history

### 8.3 Dashboard Templates (Initial Set)

- Program Performance Overview
- Indicator Tracking & Target Monitoring
- Beneficiary Reach Summary
- Geographic Distribution
- Data Quality Review
- Baseline-Midline-Endline Comparison
- Donor Report Layout
- Field Operations Dashboard
- Feedback & Accountability Tracking

---

## 9. MEAL-Specific Workflows

### 9.1 Indicator Tracking & Target Management

- Define baseline, target, midline, and endline values per indicator per period
- Auto-calculate achievement percentage and variance
- Traffic-light status indicators (on track, at risk, off track)
- Trend charts showing progress over consecutive periods
- Bulk indicator import from Excel-based indicator reference sheets

### 9.2 Disaggregated Reporting

- Apply disaggregations to any indicator (gender, age, location, partner, etc.)
- Compare disaggregated values side by side
- Detect and flag gaps in disaggregation coverage (e.g. missing gender data)
- Produce disaggregated tables ready for donor reporting formats

### 9.3 Beneficiary Tracking

- Track individuals or households across multiple data collection points
- Unique ID matching across different forms or collection rounds
- Cohort analysis: groups of beneficiaries over time
- Deduplication detection and resolution

### 9.4 Baseline-Midline-Endline

- Link the same indicator to different data collection rounds
- Visual comparison views (bar chart, table, change %)
- Statistical change summaries
- Flag statistically significant changes

### 9.5 Feedback & Accountability

- Ingest complaint, feedback, and hotline data as a data source
- Categorize and trend feedback by type, severity, location, and resolution status
- Accountability dashboards showing response rates and closure times
- Link feedback themes to program performance indicators

### 9.6 Learning & Review Workflows

- Attach written observations, lessons learned, and recommendations to dashboards and indicators
- Snapshot dashboards for specific periods (e.g. Q1 2026 Review) that are archived and immutable
- Structured learning review template with embedded data, findings, decisions, and action points
- Export learning reviews as PDF documents

---

## 10. Data Quality & Governance

### 10.1 Data Validation Rules

- Define rules per field or dataset (e.g. "age must be between 0 and 120")
- Range checks, format checks, uniqueness checks, mandatory field checks
- Cross-field rules (e.g. "end date must be after start date")
- Rules run automatically on each sync and on-demand
- Violations surfaced in a data quality dashboard with record-level details

### 10.2 Data Quality Dashboard

- Missing data rates by field, form, and partner
- Duplicate record detection
- Outlier flagging (statistical and rule-based)
- Freshness indicators (last updated, days since last sync)
- Data quality score per dataset and per connector

### 10.3 Issue Assignment & Resolution

- Assign data quality issues to specific users or partners for resolution
- Track issue status (open, in review, resolved, accepted)
- Comment thread on each issue
- Resolution history and audit trail

### 10.4 Data Lineage

- For any metric or indicator, show exactly which source it came from
- Which fields were used, what transformations were applied, what filters were active
- Visual lineage graph from raw source field to final indicator value
- Documented calculation method alongside each indicator definition

### 10.5 Access Control & Security

- Role-based access control (RBAC) with configurable roles per workspace
- Row-level security: restrict access to specific rows based on user attributes (e.g. country, partner)
- Column-level masking for sensitive fields (names, IDs, contact details)
- Audit logs: track all read, write, export, and admin actions with timestamp and user
- Data residency and sovereignty controls for sensitive datasets
- Two-factor authentication for all users

### 10.6 Versioning & Lifecycle

- Version history for data models, indicator definitions, queries, and dashboards
- Draft, review, and published states for dashboards and reports
- Rollback to any previous version of a definition or dashboard layout
- Change notifications to dashboard subscribers when a published version is updated

---

## 11. Collaboration & Storytelling

### 11.1 Comments & Annotations

- Inline comments on dashboards, individual widgets, and indicator definitions
- @mention team members to tag them in a discussion
- Resolve and archive comment threads
- Annotations on chart data points (e.g. "flood response started here")
- Sticky notes on dashboard canvases for internal context

### 11.2 Narrative Reporting (Story Mode)

- Combine charts, tables, KPI cards, and rich text into a linear narrative page
- Add written findings, observations, and recommendations alongside visualizations
- Export as a branded PDF or shareable web link
- Structured report templates (donor report, internal review, learning brief)

### 11.3 Dashboard Snapshots

- Save a point-in-time snapshot of a dashboard for a specific period
- Snapshots are immutable and archived (data does not refresh)
- Used as official records of program status at reporting deadlines
- Shareable with external stakeholders without giving access to live data

### 11.4 Notifications & Activity Feed

- Workspace activity feed showing recent changes, comments, and data updates
- Per-user notification preferences (email, in-app, Teams, Slack)
- Notify subscribers when a dashboard is published, updated, or has a comment

---

## 12. Automation & Alerts

### 12.1 Scheduled Data Refresh

- Configure refresh intervals per connector (real-time, hourly, daily, weekly, custom cron)
- Cascade refresh: when a source refreshes, all dependent indicators and dashboards update
- Manual refresh trigger available at any time
- Refresh queue with status monitoring and failure notifications

### 12.2 Threshold Alerts

- Define alert rules on any indicator (e.g. "if beneficiary reach drops below 80% of target, alert")
- Conditions: above/below threshold, percentage change, rate of change, data freshness
- Alert delivery: in-app, email, Microsoft Teams, Slack, WhatsApp (where available)
- Alert suppression windows to avoid noise during known data issues
- Alert history log

### 12.3 Scheduled Digests & Reports

- Configure automatic email or Teams summaries (daily, weekly, monthly)
- Select which dashboards, indicators, and metrics to include
- Branded HTML email or PDF attachment
- Recipient lists with per-recipient access controls

### 12.4 Automated Report Distribution

- Schedule report packs to be generated and sent to defined recipients
- Format options: PDF, PowerPoint, HTML email, shareable link
- Custom cover pages, date stamps, and period labels
- Archive of all sent reports accessible in the platform

---

## 13. AI-Assisted Capabilities

### 13.1 Natural Language Querying

- Users can type a plain English question (e.g. "show female beneficiaries by district for Q1 2026")
- The system interprets intent, maps to available data entities, and generates a query
- Users can review and edit the generated query before running it
- Query history with the original question stored alongside the generated query

### 13.2 Suggested Charts & Dashboards

- When a user selects a dataset or indicator, the system suggests appropriate chart types
- When a user creates a new dashboard, suggest a starting layout based on selected indicators
- Auto-populate chart titles, axis labels, and tooltips from indicator metadata

### 13.3 Indicator Recommendations

- When a new data source is connected, analyze its schema and suggest relevant indicators
- Suggest disaggregation dimensions based on available fields
- Flag unmapped or unused fields that may contain valuable data

### 13.4 Anomaly Detection

- Automatically flag unusual values in indicator trends (spikes, drops, zero values)
- Surface detected anomalies in the data quality dashboard
- Allow users to acknowledge, explain, or escalate anomalies

### 13.5 Schema Intelligence

- Parse new questionnaire schemas (Kobo XLSForm, SurveyCTO, etc.) and propose entity mappings
- Suggest relationships between fields across different forms (e.g. beneficiary ID matches)
- Detect structural changes in a form and propose how to update existing mappings

---

## 14. Reporting & Export

### 14.1 Export Formats

| Format | Use Case |
|---|---|
| PDF | Donor reports, period snapshots, printed summaries |
| PowerPoint (PPTX) | Presentation-ready slides from dashboards |
| Excel / CSV | Raw data exports for offline analysis |
| PNG / SVG | Individual chart images for documents |
| Shareable link | Passworded or token-gated live dashboard URL |
| Embedded iframe | Public or authenticated embed for external portals |

### 14.2 Report Builder

- Select a combination of dashboards, indicators, charts, and narrative pages
- Apply a report period filter that applies to all included elements
- Add cover page, table of contents, headers, footers, and page numbers
- Apply organizational branding (logo, color palette, font)
- Preview before generating
- Save as a reusable report template for recurring reporting cycles

---

## 15. Workspaces & Multi-Tenancy

### 15.1 Workspace Model

- Each organization operates in one or more isolated workspaces
- Workspaces contain all data sources, models, indicators, dashboards, users, and settings
- Cross-workspace access can be granted for shared programs or consortia
- Each workspace has its own branding, permissions, and data residency settings

### 15.2 User & Role Management

| Role | Capabilities |
|---|---|
| Workspace Admin | Full access, user management, connector setup, billing |
| Data Manager | Manage connectors, data models, and indicator definitions |
| Analyst | Build queries, indicators, and dashboards (cannot manage connectors) |
| Editor | Edit and publish dashboards they have been assigned to |
| Viewer | Read-only access to published dashboards they have been granted access to |
| Partner | Restricted view of their own data only, no access to other partners |
| Guest | Time-limited access to specific shared reports or snapshots |

### 15.3 Workspace Quotas & Governance

- Configurable limits on number of connectors, data volume, users, and dashboards per plan
- Usage analytics per workspace (active users, sync frequency, query volume)
- Workspace-level audit log
- Admin controls for data retention and deletion policies

---

## 16. Technical Architecture

### 16.1 Backend Services

| Service | Responsibility |
|---|---|
| Auth Service | Authentication, session management, OAuth integrations, 2FA |
| Workspace Service | Workspace lifecycle, user management, role assignment |
| Connector Service | Connector configuration, sync orchestration, schema detection |
| Ingestion Service | Data fetching, transformation, incremental loading |
| Metadata Service | Entity definitions, indicators, field mappings, model versioning |
| Query Engine | Query execution, aggregation, cross-source joins, caching |
| Cache Layer | Pre-computed aggregates, query result caching (Redis or equivalent) |
| Dashboard Service | Dashboard definitions, widget config, layout persistence |
| Report Service | PDF/PPTX generation, scheduled report dispatch |
| Notification Service | Alert evaluation, email/Teams/Slack delivery |
| Audit Service | Immutable audit log for all platform actions |
| AI Service | NLQ processing, anomaly detection, schema intelligence |

### 16.2 Data Storage Strategy

- **Raw store**: append-only storage of all ingested records by source (object storage or columnar DB)
- **Semantic store**: structured tables representing modeled entities and dimensions
- **Aggregate store**: pre-computed indicator values by period and dimension
- **Metadata store**: relational DB for all definitions (indicators, models, dashboards, users)
- **Cache store**: Redis-compatible store for query result caching and session state

### 16.3 Scalability & Performance

- Stateless, horizontally scalable backend services
- Background job queues for sync, report generation, and alert evaluation
- Pre-computed aggregates for commonly accessed indicators and dashboards
- Query timeout and resource limits to prevent runaway queries
- Incremental loading to minimize full dataset refreshes

### 16.4 Extensibility

- Connector SDK for building and registering new data source connectors
- Widget SDK for creating and registering custom visualization components
- Webhook support for pushing events to external systems (e.g. new data synced, alert triggered)
- REST API for programmatic access to queries, indicators, and dashboard data
- Plugin system for domain-specific extensions (sector templates, indicator libraries)

### 16.5 Security

- All data encrypted at rest and in transit
- Per-tenant data isolation at the storage layer
- Row-level security enforced at query time, not at presentation layer
- Secret management for connector credentials (not stored in application DB)
- OWASP Top 10 compliance
- Regular penetration testing and security audits
- GDPR-ready data handling with configurable data retention and deletion

---

## 17. Key End-to-End Workflows

### Workflow 1: Workspace & Project Onboarding

1. Create organization workspace, set branding and region
2. Invite users and assign roles
3. Define program/project structure
4. Guided wizard: "Set up your first data source → define your first indicator → build your first dashboard"

### Workflow 2: Connect & Map a Data Source

1. Select connector type from the library
2. Complete authentication (OAuth or API key)
3. Select forms/files/sheets to include
4. Preview raw data schema and sample records
5. Map source fields to platform entities and dimensions
6. Configure sync schedule and freshness alerts
7. Save mapping profile for reuse

### Workflow 3: Build an Indicator

1. Browse the indicator catalog or create a new one
2. Select indicator type (count, sum, percentage, etc.)
3. Select source dataset and relevant fields
4. Define formula using the no-code builder
5. Configure disaggregation dimensions
6. Set baseline, target, and reporting period
7. Preview calculated values against real data
8. Save and link to a results framework element or dashboard

### Workflow 4: Design a Dashboard

1. Select a template or start from blank
2. Add widgets from the palette (KPI cards, charts, tables, maps, etc.)
3. Connect each widget to a saved indicator or query
4. Configure filters (date, geography, partner)
5. Arrange and resize widgets on the canvas
6. Apply branding and layout settings
7. Save as draft, preview, then publish with access controls

### Workflow 5: Produce a Period Report

1. Select a report template or create new
2. Choose reporting period (e.g. Q1 2026)
3. Select dashboards and indicators to include
4. Add narrative text sections with findings and recommendations
5. Apply branding and cover page settings
6. Preview and generate PDF or PowerPoint
7. Schedule for automatic distribution to recipient list

### Workflow 6: Data Quality Review

1. Open the data quality dashboard for a connector or dataset
2. Review violations by rule, field, and record
3. Assign issues to the responsible data manager or partner
4. Annotate records with context or corrections needed
5. Mark issues as resolved once source data is fixed and re-synced
6. Generate a data quality summary for the reporting period

---

## 18. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Dashboard load time | < 3 seconds for pre-computed dashboards |
| Query response time | < 10 seconds for interactive ad hoc queries on datasets up to 1M rows |
| Sync latency | < 15 minutes from source update to platform availability |
| Uptime | 99.5% monthly availability |
| Concurrent users | Support 500+ concurrent users per workspace |
| Data volume | Support datasets up to 50M rows per connector with pagination |
| Export generation | PDF/PPTX reports generated within 60 seconds |
| Security | End-to-end encryption, SOC 2 Type II target |
| Accessibility | WCAG 2.1 AA compliance for all user-facing interfaces |
| Localization | UI available in English, French, Arabic, Spanish (initial release) |

---

## 19. Out of Scope (v1.0)

The following are intentionally deferred to a later version:

- Native mobile app (mobile-responsive web is in scope)
- Real-time collaborative editing of dashboards (concurrent editing with conflict resolution)
- Full ETL pipeline builder (basic transformations only in v1.0)
- Predictive analytics and forecasting models
- Direct writeback to source systems
- Marketplace for third-party widgets and connectors

---

## 20. Open Questions & Decisions Required

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | What is the primary deployment model: cloud SaaS, on-premise, or hybrid? | Product | TBD |
| 2 | Which query engine technology will be used for cross-source joins? | Engineering | TBD |
| 3 | What is the data residency requirement for initial target markets? | Product / Legal | TBD |
| 4 | Will AI features be optional (opt-in) or enabled by default? | Product | TBD |
| 5 | What is the licensing model (per seat, per workspace, usage-based)? | Business | TBD |
| 6 | Which partner management features are needed in v1.0 vs v2.0? | Product | TBD |
| 7 | Should the platform support offline or low-connectivity modes? | Product | TBD |

---

*This document is a living specification and will be updated as decisions are made and requirements are refined.*

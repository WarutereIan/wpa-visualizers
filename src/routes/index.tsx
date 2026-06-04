import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Database,
  Download,
  FileSpreadsheet,
  Globe,
  Layers,
  LayoutGrid,
  LineChart,
  Link2,
  Mail,
  Map,
  MessageSquare,
  PieChart,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { WhatsappLogo } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import ThemeToggle from '#/components/ThemeToggle'
import { DimesBiLogo } from '#/components/brand/DimesBiLogo'
import { FloatingContactActions } from '#/components/public/FloatingContactActions'
import { landingFaqs } from '#/data/landingFaqs'
import { CONTACT_EMAIL, whatsappUrl } from '#/lib/contact'

const SITE_DESCRIPTION =
  'DIMES-BI connects Kobo, Excel, SurveyCTO, and more into one MEAL workspace — build indicators, dashboards, maps, and donor reports without changing how your teams collect data.'

export const Route = createFileRoute('/')({
  component: HomePage,
  head: () => ({
    meta: [
      { title: 'DIMES-BI — BYOD MEAL Analytics & Dashboards' },
      { name: 'description', content: SITE_DESCRIPTION },
      { property: 'og:title', content: 'DIMES-BI — BYOD MEAL Analytics & Dashboards' },
      { property: 'og:description', content: SITE_DESCRIPTION },
      { property: 'og:type', content: 'website' },
    ],
  }),
})

const mapPins = [
  { label: 'Canada', x: 18, y: 22 },
  { label: 'United States', x: 22, y: 32 },
  { label: 'Nicaragua', x: 24, y: 42 },
  { label: 'Peru', x: 28, y: 58 },
  { label: 'France', x: 48, y: 28 },
  { label: 'Kenya', x: 56, y: 48 },
  { label: 'India', x: 72, y: 38 },
  { label: 'Australia', x: 86, y: 62 },
] as const

function StylizedMap() {
  return (
    <div className="relative mx-auto mt-12 max-w-4xl overflow-hidden rounded-[2rem] border border-sky-200/40 bg-gradient-to-b from-sky-100/90 via-emerald-50/50 to-teal-100/80 px-4 pb-28 pt-10 shadow-inner dark:border-white/10 dark:from-slate-800/80 dark:via-slate-900/60 dark:to-slate-900/90">
      <div
        className="pointer-events-none absolute inset-x-[8%] bottom-0 h-[45%] rounded-[100%] bg-gradient-to-t from-emerald-200/50 via-sky-200/20 to-transparent blur-sm dark:from-emerald-900/30 dark:via-sky-900/20"
        aria-hidden
      />
      <svg viewBox="0 0 100 52" className="relative mx-auto h-40 w-full max-w-2xl text-sky-300/70 dark:text-slate-600" aria-hidden>
        <ellipse cx="50" cy="44" rx="38" ry="14" fill="url(#horizon)" opacity="0.55" />
        <path
          d="M8 38 Q22 30 36 34 T64 32 Q78 28 92 36"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.35"
          opacity="0.5"
        />
        <defs>
          <linearGradient id="horizon" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(56, 189, 248)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0.15" />
          </linearGradient>
        </defs>
      </svg>
      {mapPins.map((p) => (
        <div
          key={p.label}
          className="absolute z-10 flex max-w-[min(42%,9rem)] -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-white/90 bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-800 shadow-md backdrop-blur-sm dark:border-white/15 dark:bg-slate-900/90 dark:text-slate-100 sm:text-xs"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <Globe className="size-3 shrink-0 text-sky-600 opacity-80 dark:text-sky-400" aria-hidden />
          <span className="truncate">{p.label}</span>
        </div>
      ))}
    </div>
  )
}

const connectorCards = [
  { name: 'KoboToolbox', icon: LayoutGrid, tint: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30' },
  { name: 'Microsoft Excel', icon: FileSpreadsheet, tint: 'from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/30' },
  { name: 'SurveyCTO', icon: Database, tint: 'from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/30' },
  { name: 'Google Forms', icon: Link2, tint: 'from-sky-50 to-blue-50 dark:from-sky-950/40 dark:to-blue-950/30' },
  { name: 'Microsoft 365', icon: Sparkles, tint: 'from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/40' },
  { name: 'CSV & APIs', icon: BarChart3, tint: 'from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/30' },
] as const

function HomePage() {
  const [email, setEmail] = useState('')

  useEffect(() => {
    const scriptId = 'landing-jsonld'
    const existing = document.getElementById(scriptId)
    existing?.remove()
    const script = document.createElement('script')
    script.id = scriptId
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'DIMES-BI',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: SITE_DESCRIPTION,
      image: `${window.location.origin}/dimes-bi.png`,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Interactive workspace demo' },
    })
    document.head.appendChild(script)
    return () => document.getElementById(scriptId)?.remove()
  }, [])

  const pillars = [
    {
      title: 'No new tools to adopt',
      description:
        'Connect Kobo, Excel, Microsoft 365, SurveyCTO, Google Forms, SharePoint, CSVs, and APIs. Your teams keep working exactly as they do today—DIMES-BI syncs, detects schemas, and monitors freshness automatically.',
      icon: Link2,
    },
    {
      title: 'One central platform for analysis',
      description:
        'All your data—forms, spreadsheets, cloud files—lands in a unified semantic model. Define indicators, run cross-source queries, disaggregate, and track baselines to endlines in one place.',
      icon: BarChart3,
    },
    {
      title: 'Dashboards, maps, reports & storytelling',
      description:
        'Build KPI cards, bar and line charts, choropleth and bubble maps, pivot tables, spatial analysis, narrative blocks, and donor report layouts—all from the same governed data, tailored per audience.',
      icon: LayoutGrid,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf9ff] via-[#f5f4fc] to-[#ebe8f5] text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(139,92,246,0.12),transparent_55%),radial-gradient(ellipse_70%_45%_at_100%_40%,rgba(56,189,248,0.08),transparent_50%),radial-gradient(ellipse_60%_40%_at_0%_60%,rgba(244,114,182,0.07),transparent_45%)] dark:bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(139,92,246,0.18),transparent_55%),radial-gradient(ellipse_70%_45%_at_100%_40%,rgba(56,189,248,0.1),transparent_50%)]" />

      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2.5 shadow-[0_8px_40px_-16px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/65 sm:min-h-[4.75rem] sm:gap-x-4 sm:px-5 md:flex-nowrap md:py-2.5">
          <DimesBiLogo className="order-1 shrink-0" size="2xl" />
          <nav
            className="order-3 flex w-full min-w-0 items-center justify-center gap-1.5 overflow-x-auto pb-0.5 sm:gap-2 md:order-2 md:w-auto md:flex-1 md:px-2"
            aria-label="Primary"
          >
            <a href="#how-it-works" className="landing-nav-link shrink-0 rounded-full border border-slate-200/90 bg-white/85 px-3.5 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm transition hover:border-slate-300 hover:bg-white no-underline dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
              How it works
            </a>
            <a href="#connectors" className="landing-nav-link shrink-0 rounded-full border border-slate-200/90 bg-white/85 px-3.5 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm transition hover:border-slate-300 hover:bg-white no-underline dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
              Connectors
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=DIMES-BI%20inquiry`}
              className="landing-nav-link shrink-0 rounded-full border border-slate-200/90 bg-white/85 px-3.5 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm transition hover:border-slate-300 hover:bg-white no-underline dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10"
            >
              Contact
            </a>
          </nav>
          <div className="order-2 flex shrink-0 items-center gap-1.5 sm:gap-2 md:order-3">
            <ThemeToggle />
            <Link
              to="/dashboards/add"
              className="landing-cta-primary inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-2 text-xs font-semibold shadow-md shadow-slate-900/20 transition hover:bg-slate-800 sm:px-4 sm:text-sm dark:bg-white dark:hover:bg-slate-100 no-underline"
            >
              Try the workspace
              <ArrowRight className="size-3.5 sm:size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-12 text-center sm:px-6 sm:pb-16 sm:pt-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">
            Bring-your-own-data analytics
          </p>
          <h1 className="display-title mx-auto mt-4 max-w-4xl text-4xl font-bold leading-[1.06] tracking-tight text-[#141627] dark:text-slate-50 sm:text-5xl md:text-[3.25rem] lg:text-6xl">
            Use the data you already collect. Build dashboards, reports & analysis in one place.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
            Your organization collects data across Kobo, Excel, Google Forms, SurveyCTO, Microsoft 365, and
            more. DIMES-BI connects all of it—without changing a single workflow—so you can build interactive
            dashboards, track indicators, run spatial analysis, and deliver decision-ready reports from one
            trusted workspace.
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm font-medium text-violet-700/90 dark:text-violet-300/90">
            Kobo · Excel · SurveyCTO · Google Forms · Microsoft 365 · CSV & APIs
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboards/add"
              className="landing-cta-primary inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold shadow-lg shadow-slate-900/25 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 no-underline"
            >
              Try the workspace free
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('DIMES-BI BYOD workflow enquiry')}`}
              className="landing-cta-secondary inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-6 py-3 text-sm font-semibold shadow-sm backdrop-blur-sm transition hover:border-slate-300 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:hover:border-white/25 dark:hover:bg-white/10 no-underline"
            >
              Contact us about BYOD
            </a>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-3 md:gap-14">
          {pillars.map(({ title, description, icon: Icon }) => (
            <article key={title} className="text-left">
              <div className="mb-4 inline-flex rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
                <Icon className="size-6 text-slate-800 dark:text-slate-200" strokeWidth={1.5} />
              </div>
              <h2 className="text-lg font-semibold text-[#141627] dark:text-slate-100">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
            </article>
          ))}
        </section>

        <section
          id="how-it-works"
          className="mx-auto mt-20 max-w-6xl scroll-mt-28 px-4 text-center sm:px-6 md:mt-24"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">
            Keep your workflows. Get real analytics.
          </p>
          <h2 className="display-title mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-[#141627] dark:text-slate-50 md:text-5xl">
            Your teams keep collecting. DIMES-BI turns it all into insight.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
            No one has to adopt a new tool or change how they work. DIMES-BI pulls data from Kobo, Excel, SurveyCTO,
            Google Forms, SharePoint, APIs, and flat files into one central workspace—then lets you build interactive
            dashboards, choropleth and bubble maps, KPI cards, pivot tables, narrative reports, donor layouts,
            and spatial analysis views on top of it all.
          </p>
          <Link
            to="/data-management/import"
            className="landing-cta-primary mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold shadow-lg transition hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 no-underline"
          >
            See how BYOD works
            <ArrowRight className="size-4" />
          </Link>
          <StylizedMap />
        </section>

        <section className="mx-auto mt-12 max-w-6xl px-4 sm:px-6 md:mt-16">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-[0_28px_90px_-28px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_28px_90px_-28px_rgba(0,0,0,0.5)]">
            <div className="flex border-b border-slate-100 bg-slate-50/80 dark:border-white/10 dark:bg-slate-950/50">
              <aside className="hidden w-44 shrink-0 border-r border-slate-100 p-4 dark:border-white/10 md:block">
                <DimesBiLogo size="md" linkToHome={false} />
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Workspace</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">Demo program</p>
                <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <li className="font-medium text-violet-700 dark:text-violet-400">Overview</li>
                  <li>Indicators</li>
                  <li>Surveys</li>
                  <li>Compare</li>
                </ul>
              </aside>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6 dark:border-white/10">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <DimesBiLogo size="md" linkToHome={false} className="md:hidden" />
                    <span className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">Outputs</span>
                    <span className="text-slate-300 dark:text-slate-600">/</span>
                    <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">Q3 performance</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                      Results
                    </span>
                    <span className="rounded-full px-3 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">Quality</span>
                    <span className="rounded-full px-3 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">Learning</span>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 px-4 py-5 sm:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <DimesBiLogo
                        size="lg"
                        linkToHome={false}
                        className="hidden shrink-0 sm:inline-flex"
                      />
                      <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-emerald-200/90">Live workspace</p>
                      <p className="mt-1 text-xl font-semibold text-white sm:text-2xl">Regional health program</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-emerald-100/90">
                        <span className="rounded-full bg-white/10 px-2 py-0.5">12 projects</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5">4.2k responses</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5">Last sync 2h</span>
                      </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                        Export
                      </span>
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                        Share
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 bg-gradient-to-br from-slate-50 to-slate-100/90 p-4 sm:grid-cols-2 sm:gap-6 sm:p-6 dark:from-slate-900/50 dark:to-slate-950/80">
                  <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Program health score</p>
                    <div className="relative mx-auto mt-4 h-36 w-44">
                      <svg viewBox="0 0 120 72" className="size-full text-slate-200 dark:text-slate-700" aria-hidden>
                        <path
                          d="M 12 60 A 48 48 0 0 1 108 60"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="10"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 12 60 A 48 48 0 0 1 108 60"
                          fill="none"
                          stroke="url(#gaugeHome)"
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray="151"
                          strokeDashoffset="45"
                        />
                        <defs>
                          <linearGradient id="gaugeHome" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#14b8a6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                        <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">6.5</span>
                        <span className="mt-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-200">
                          On track
                        </span>
                      </div>
                    </div>
                    <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      Blended across active indicators and data freshness.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Indicators vs target</p>
                    <p className="mt-2 text-4xl font-bold tabular-nums text-slate-900 dark:text-white">45%</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">meeting or exceeding target this period.</p>
                    <div className="mt-6 flex h-36 items-end justify-between gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
                      {[
                        { h: 12, c: 'bg-rose-300 dark:bg-rose-500/70', l: 'Critical' },
                        { h: 22, c: 'bg-orange-300 dark:bg-orange-500/70', l: 'Behind' },
                        { h: 35, c: 'bg-amber-300 dark:bg-amber-500/70', l: 'Fair' },
                        { h: 78, c: 'bg-emerald-400 dark:bg-emerald-500/70', l: 'Good' },
                        { h: 55, c: 'bg-teal-400 dark:bg-teal-500/70', l: 'Strong' },
                      ].map((b) => (
                        <div key={b.l} className="flex flex-1 flex-col items-center gap-2">
                          <div
                            className={`w-full max-w-[2.5rem] rounded-t-md ${b.c}`}
                            style={{ height: `${b.h}%`, minHeight: '1.5rem' }}
                          />
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{b.l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 md:mt-28">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">
            Built for your organization
          </p>
          <h2 className="display-title mx-auto mt-3 max-w-3xl text-center text-3xl font-semibold tracking-tight text-[#141627] dark:text-slate-50 md:text-4xl">
            One workspace for every team, every program, every stakeholder.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
            Manage programs, projects, data sources, indicators, dashboards, reports, users, and permissions in
            one unified platform. Multiple workspaces and teams, built for organizations that work with complex,
            distributed data.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Building2, label: 'NGOs & INGOs', desc: 'Multi-country, multi-program portfolios with donor reporting.' },
              { icon: Users, label: 'Donor-funded programs', desc: 'Results frameworks, logframes, and polished dashboard exports.' },
              { icon: BookOpen, label: 'Research teams', desc: 'Cross-dataset queries, disaggregation, and baseline-endline analysis.' },
              { icon: Globe, label: 'Government departments', desc: 'Standardized indicators and geographic rollups at national scale.' },
              { icon: Sparkles, label: 'Consultancies', desc: 'Client-facing dashboards, branded report packs, and embeddable views.' },
              { icon: ShieldCheck, label: 'Social impact orgs', desc: 'Feedback tracking, accountability analysis, and beneficiary monitoring.' },
            ].map((item) => (
              <article
                key={item.label}
                className="flex gap-4 rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
                  <item.icon className="size-5 text-violet-700 dark:text-violet-300" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#141627] dark:text-slate-100">{item.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 md:mt-28">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-400">
            Dashboard & visualization builder
          </p>
          <h2 className="display-title mx-auto mt-3 max-w-3xl text-center text-3xl font-semibold tracking-tight text-[#141627] dark:text-slate-50 md:text-4xl">
            Every chart, map, table, and report your teams need—from one builder.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
            Drag-and-drop canvas with cross-filtering, drill-through, responsive layouts, theming, branding,
            and audience-specific views. A program officer, a country director, and a donor each see exactly the
            dashboard they need—all powered by the same underlying data.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BarChart3, label: 'Bar, line & area charts', desc: 'Categorical comparisons, trends over time, and stacked cumulative views.' },
              { icon: PieChart, label: 'Pie, donut & scatter', desc: 'Part-to-whole distributions and correlation analysis between measures.' },
              { icon: Map, label: 'Choropleth & bubble maps', desc: 'Geographic distribution with color or size encoding—spatial analysis built in.' },
              { icon: LayoutGrid, label: 'Tables & pivot views', desc: 'Sortable, filterable data with conditional formatting and cross-tabulation.' },
              { icon: Target, label: 'KPI cards & progress bars', desc: 'Single metrics with trend arrows, target status, and achievement percentage.' },
              { icon: LineChart, label: 'Timelines & milestones', desc: 'Events, phases, and program milestones plotted over time.' },
              { icon: BookOpen, label: 'Rich text & narrative', desc: 'Formatted text, headings, images, and narrative blocks alongside data.' },
              { icon: Layers, label: 'Filters & drill-through', desc: 'Dashboard-level date, geography, partner, and project filters with drill-down.' },
            ].map((item) => (
              <article
                key={item.label}
                className="rounded-2xl border border-slate-200/60 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-sm dark:border-white/10 dark:from-slate-900/70 dark:to-slate-950/50"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/40">
                  <item.icon className="size-5 text-sky-700 dark:text-sky-300" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-[#141627] dark:text-slate-100">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 md:mt-28">
          <div className="grid items-start gap-12 md:grid-cols-2 md:gap-16">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
                Indicator & analytics engine
              </p>
              <h2 className="display-title mt-3 max-w-lg text-3xl font-semibold tracking-tight text-[#141627] dark:text-slate-50 md:text-4xl">
                Build indicators with no code. Query across every source.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
                Create counts, sums, averages, percentages, ratios, conditional aggregations, disaggregations,
                baselines, targets, actuals, variances, and trends—all from a visual formula builder. Indicators
                are reusable across dashboards, reports, and results frameworks.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'No-code formula builder with field picker, operators, and real-time preview',
                  'Cross-dataset queries: join data from multiple sources using shared dimensions',
                  'Saved queries power multiple widgets and dashboards simultaneously',
                  'Logframes, theories of change, results chains, and MEAL frameworks built in',
                  'Direct SQL access for advanced users with appropriate permissions',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                      <ArrowRight className="size-3 text-emerald-700 dark:text-emerald-300" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Count', value: '4,218', sub: 'beneficiaries reached' },
                { label: 'Percentage', value: '73%', sub: 'target achievement' },
                { label: 'Trend', value: '+12.4%', sub: 'quarter-over-quarter' },
                { label: 'Disaggregation', value: '3 dims', sub: 'gender × age × region' },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-[#141627] dark:text-white">{card.value}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 md:mt-28">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-400">
            MEAL-specific workflows
          </p>
          <h2 className="display-title mx-auto mt-3 max-w-3xl text-center text-3xl font-semibold tracking-tight text-[#141627] dark:text-slate-50 md:text-4xl">
            Not just charts. The full monitoring, evaluation, and learning cycle.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
            DIMES-BI goes beyond dashboarding. It supports the workflows MEAL teams actually use—baseline to
            endline, disaggregation, target tracking, beneficiary monitoring, feedback loops, and learning reviews.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Baseline → midline → endline',
                desc: 'Link the same indicator across data collection rounds. Visual comparison views, change percentages, and statistical significance flags.',
              },
              {
                title: 'Target tracking & traffic lights',
                desc: 'Define baseline, target, and actual values per indicator per period. Auto-calculate achievement, variance, and on-track / at-risk / off-track status.',
              },
              {
                title: 'Disaggregation by any dimension',
                desc: 'Break down every indicator by gender, age, geography, partner, vulnerability group, or any custom dimension. Detect and flag gaps in coverage.',
              },
              {
                title: 'Beneficiary tracking & dedup',
                desc: 'Track individuals and households across multiple collection rounds. Unique ID matching, cohort analysis, and deduplication detection.',
              },
              {
                title: 'Feedback & accountability',
                desc: 'Ingest complaint, feedback, and hotline data. Categorize, trend, and link feedback themes to program performance indicators.',
              },
              {
                title: 'Learning reviews & snapshots',
                desc: 'Attach observations, lessons learned, and recommendations. Snapshot dashboards for specific reporting periods—archived and immutable.',
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/60"
              >
                <h3 className="text-sm font-semibold text-[#141627] dark:text-slate-100">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 md:mt-28">
          <div className="grid items-start gap-12 md:grid-cols-2 md:gap-16">
            <div className="order-2 md:order-1">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: MessageSquare, label: 'Comment & tag', desc: 'Comment on dashboards, tag teammates, annotate charts, and explain unusual trends.' },
                  { icon: BookOpen, label: 'Narrative reporting', desc: 'Combine data visualizations with written explanations, lessons, recommendations, and evidence.' },
                  { icon: Target, label: 'Decision capture', desc: 'Record decisions alongside the data that informed them. Searchable and linked to indicators.' },
                  { icon: Layers, label: 'Period snapshots', desc: 'Freeze a dashboard for Q1 Review or Year-End—archived, immutable, and always accessible.' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/70"
                  >
                    <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
                      <item.icon className="size-5 text-amber-700 dark:text-amber-300" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-semibold text-[#141627] dark:text-slate-100">{item.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-400">
                Collaboration & storytelling
              </p>
              <h2 className="display-title mt-3 max-w-lg text-3xl font-semibold tracking-tight text-[#141627] dark:text-slate-50 md:text-4xl">
                Beyond dashboards—a learning and decision-support environment.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
                Teams don&apos;t just need charts. They need to explain what changed, capture what they learned, and
                show stakeholders why decisions were made. DIMES-BI lets you annotate, comment, snapshot, and
                build narrative reports directly alongside your data.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 md:mt-28">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">
            Automation, exports & sharing
          </p>
          <h2 className="display-title mx-auto mt-3 max-w-3xl text-center text-3xl font-semibold tracking-tight text-[#141627] dark:text-slate-50 md:text-4xl">
            Schedule refreshes. Get alerts. Export to PDF, PowerPoint, or a shareable link.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
            Data stays fresh automatically. When indicators cross thresholds, the right people know immediately.
            Reports are exportable to every format stakeholders expect—or embeddable directly in external portals.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Database, label: 'Scheduled data refreshes', desc: 'Configurable sync intervals—real-time, hourly, daily, or weekly. Never stale.' },
              { icon: Bell, label: 'Threshold alerts', desc: 'Automated notifications when indicators go off-track. Email, Teams, or in-app.' },
              { icon: Download, label: 'PDF, PowerPoint & images', desc: 'Export dashboards and reports in donor-ready formats with one click.' },
              { icon: Share2, label: 'Shareable links & embeds', desc: 'Publish dashboards as secure web links or embed them in external portals and websites.' },
            ].map((item) => (
              <article
                key={item.label}
                className="rounded-2xl border border-slate-200/60 bg-gradient-to-b from-white to-indigo-50/50 p-5 shadow-sm dark:border-white/10 dark:from-slate-900/70 dark:to-indigo-950/30"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                  <item.icon className="size-5 text-indigo-700 dark:text-indigo-300" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-semibold text-[#141627] dark:text-slate-100">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="connectors" className="mx-auto mt-24 max-w-6xl scroll-mt-28 px-4 sm:px-6 md:mt-28">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-amber-800/90 dark:text-amber-200/80">
            Connectors
          </p>
          <h2 className="display-title mx-auto mt-3 max-w-3xl text-center text-3xl font-semibold tracking-tight text-[#141627] dark:text-slate-50 md:text-4xl">
            Connect every source your teams already use.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
            Each connector handles authentication, schema detection, field mapping, incremental sync, scheduled
            refresh, health monitoring, and failure alerts. Your teams don&apos;t migrate—they just keep collecting.
          </p>
          <div className="mt-10 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
            {connectorCards.map(({ name, icon: Icon, tint }) => (
              <article
                key={name}
                className={`flex min-w-[9.5rem] shrink-0 flex-col rounded-2xl border border-slate-200/70 bg-gradient-to-b p-4 shadow-sm dark:border-white/10 ${tint}`}
              >
                <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/50">
                  <Icon className="size-8 text-slate-700 dark:text-slate-200" strokeWidth={1.25} />
                </div>
                <p className="mt-3 text-left text-xs font-semibold text-slate-800 dark:text-slate-100">{name}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-3xl px-4 sm:px-6 md:mt-28">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">
            FAQ
          </p>
          <h2 className="display-title mx-auto mt-3 text-center text-2xl font-semibold tracking-tight text-[#141627] dark:text-slate-50 sm:text-3xl">
            Common questions
          </h2>
          <dl className="mt-10 space-y-4">
            {landingFaqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60"
              >
                <dt className="text-sm font-semibold text-[#141627] dark:text-slate-100">{faq.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="relative mx-4 mt-24 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-900 px-4 py-16 sm:mx-6 sm:px-8 md:mx-auto md:mt-28 md:max-w-6xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            aria-hidden
            style={{
              backgroundImage:
                'repeating-linear-gradient(60deg, transparent, transparent 18px, rgba(255,255,255,0.06) 18px, rgba(255,255,255,0.06) 19px)',
            }}
          />
          <div className="relative mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <h2 className="display-title text-3xl font-semibold text-white md:text-4xl">Start with DIMES-BI</h2>
              <p className="mt-3 max-w-xl text-violet-100">
                Open the workspace, connect a source, and publish your first live-linked dashboard — about 10 minutes in the demo.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/dashboards/add"
                className="landing-cta-violet inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold shadow-lg transition hover:bg-violet-50 no-underline"
              >
                Try the workspace
                <ArrowUpRight className="size-4" />
              </Link>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=DIMES-BI%20demo%20or%20enterprise`}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 no-underline"
              >
                Talk to our team
              </a>
            </div>
          </div>
        </section>

        <footer className="relative mt-0 border-t border-white/10 bg-[#0a0e18] px-4 py-14 text-slate-300 sm:px-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            aria-hidden
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-md">
              <p className="text-lg font-semibold text-white">Don&apos;t miss what&apos;s next.</p>
              <p className="mt-2 text-sm text-slate-400">Product updates, connector releases, and MEAL analytics patterns—occasional, no spam.</p>
              <form
                className="mt-6 flex flex-col gap-3 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault()
                  const trimmed = email.trim()
                  if (!trimmed) return
                  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('DIMES-BI product updates')}&body=${encodeURIComponent(`Please add me to product updates: ${trimmed}`)}`
                }}
              >
                <label htmlFor="landing-email" className="sr-only">
                  Email
                </label>
                <input
                  id="landing-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.org"
                  className="min-h-11 flex-1 rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-slate-500 outline-none ring-violet-400/40 focus:ring-2"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Request updates
                </button>
              </form>
              <p className="mt-2 text-xs text-slate-500">Opens your email client — we reply from {CONTACT_EMAIL}</p>
            </div>
            <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
              <div>
                <p className="text-sm font-semibold text-white">Contact</p>
                <div className="mt-3 flex flex-col gap-2.5">
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 no-underline transition hover:border-white/20 hover:bg-white/10"
                    aria-label={`Email ${CONTACT_EMAIL}`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-200 transition group-hover:bg-violet-500/30">
                      <Mail className="size-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">Email</span>
                      <span className="block text-xs text-slate-400">Send us a message</span>
                    </span>
                  </a>
                  <a
                    href={whatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 no-underline transition hover:border-[#25D366]/40 hover:bg-white/10"
                    aria-label="Chat on WhatsApp"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]/20 text-[#25D366] transition group-hover:bg-[#25D366]/30">
                      <WhatsappLogo className="size-5" weight="fill" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">Phone</span>
                      <span className="block text-xs text-slate-400">Chat with our team</span>
                    </span>
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap gap-10 text-sm">
                <div className="space-y-2">
                  <p className="font-semibold text-white">Product</p>
                  <Link to="/dashboards/add" className="block text-slate-400 hover:text-white no-underline">
                    New dashboard
                  </Link>
                  <Link to="/data-management/import" className="block text-slate-400 hover:text-white no-underline">
                    Data import
                  </Link>
                  <Link to="/mappings" className="block text-slate-400 hover:text-white no-underline">
                    Mappings
                  </Link>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-white">Analyze</p>
                  <Link to="/outputs-and-indicators/indicators" className="block text-slate-400 hover:text-white no-underline">
                    Indicators
                  </Link>
                  <Link to="/baseline-mapping" className="block text-slate-400 hover:text-white no-underline">
                    Baseline map
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="relative mx-auto mt-14 flex max-w-6xl flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
            <DimesBiLogo size="lg" linkToHome={false} className="opacity-95" />
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <p className="text-xs text-slate-500">BYOD MEAL & analytics workspace · See docs for roadmap and enterprise capabilities.</p>
              <a
                href="https://gartsafrica.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 no-underline transition hover:text-white"
              >
                © GARTS Africa
              </a>
            </div>
          </div>
        </footer>
        <FloatingContactActions />
      </main>
    </div>
  )
}

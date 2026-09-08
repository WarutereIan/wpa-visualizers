import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Crown,
  Globe,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from '#/components/ThemeToggle'
import { DimesBiLogo } from '#/components/brand/DimesBiLogo'
import { FloatingContactActions } from '#/components/public/FloatingContactActions'
import { pricingFaqs } from '#/data/pricingFaqs'
import { usePricingCurrency } from '#/hooks/usePricingCurrency'
import { CONTACT_EMAIL } from '#/lib/contact'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: 'Pricing — DIMES-BI BYOD MEAL Analytics' },
      {
        name: 'description',
        content:
          'DIMES-BI pricing: Free plan for getting started, Starter $99/yr, Professional $199/yr, Enterprise $399/yr. Connect Kobo, Excel, and more — build dashboards and indicators without changing workflows.',
      },
      { property: 'og:title', content: 'Pricing — DIMES-BI BYOD MEAL Analytics' },
      {
        property: 'og:description',
        content:
          'Simple pricing for bring-your-own-data MEAL analytics. Free, Starter, Professional, and Enterprise plans with locale-based currency display.',
      },
    ],
  }),
})

const plans = [
  {
    name: 'Free',
    icon: Building2,
    annualPrice: 0,
    description: 'Explore the workspace and publish your first dashboards',
    features: [
      'Up to 2 users',
      '1 project',
      '2 data sources (CSV & Excel upload)',
      '5,000 data rows / month',
      '10 indicators',
      'All charts, maps & tables',
      'Manual data import',
      'Community support',
    ],
    cta: 'Start free',
    popular: false,
  },
  {
    name: 'Starter',
    icon: Sparkles,
    annualPrice: 99,
    description: 'For small teams connecting multiple data sources',
    features: [
      'Up to 5 users',
      '3 projects',
      '5 data sources (Kobo, SurveyCTO, Google Forms, etc.)',
      '15,000 data rows / month',
      '50 indicators',
      'All charts, maps & tables',
      'Daily scheduled sync',
      'Target tracking & traffic lights',
      'CSV export',
      'Email support',
    ],
    cta: 'Choose Starter',
    popular: false,
  },
  {
    name: 'Professional',
    icon: Crown,
    annualPrice: 199,
    description: 'For growing programs with full MEAL workflows',
    features: [
      'Up to 10 users',
      '10 projects',
      'Unlimited data sources',
      '50,000 data rows / month',
      'Unlimited indicators',
      'All charts, maps & tables',
      'Hourly scheduled sync',
      'Baseline → endline & disaggregation',
      'Narrative reports & period snapshots',
      'PDF & PowerPoint export',
      'Shareable dashboard links',
      'Priority support',
    ],
    cta: 'Choose Professional',
    popular: true,
  },
  {
    name: 'Enterprise',
    icon: Globe,
    annualPrice: 399,
    description: 'For multi-country portfolios and complex rollouts',
    features: [
      'Unlimited users',
      'Unlimited projects',
      'Unlimited data sources + custom API integrations',
      'Unlimited data rows',
      'Unlimited indicators',
      'All charts, maps & tables',
      'Real-time sync + webhook triggers',
      'Beneficiary tracking & feedback loops',
      'Learning reviews & archived snapshots',
      'Branded reports + custom templates',
      'Embeddable views & white-label',
      'Dedicated support & onboarding',
    ],
    cta: 'Choose Enterprise',
    popular: false,
  },
] as const

function PricingPage() {
  const [showInUsd, setShowInUsd] = useState(false)

  const {
    currency,
    country,
    loading: currencyLoading,
    error: currencyError,
    isConverted,
    formatPrice,
  } = usePricingCurrency()

  const useLocalCurrency = isConverted && !showInUsd

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf9ff] via-[#f5f4fc] to-[#ebe8f5] text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(139,92,246,0.12),transparent_55%),radial-gradient(ellipse_70%_45%_at_100%_40%,rgba(56,189,248,0.08),transparent_50%)] dark:bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(139,92,246,0.18),transparent_55%)]" />

      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2.5 shadow-[0_8px_40px_-16px_rgba(15,23,42,0.2)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/65 sm:min-h-[4.75rem] sm:gap-x-4 sm:px-5 md:flex-nowrap md:py-2.5">
          <DimesBiLogo className="order-1 shrink-0" size="2xl" />
          <nav
            className="order-3 flex w-full min-w-0 items-center justify-center gap-1.5 overflow-x-auto pb-0.5 sm:gap-2 md:order-2 md:w-auto md:flex-1 md:px-2"
            aria-label="Primary"
          >
            <Link
              to="/"
              className="landing-nav-link shrink-0 rounded-full border border-slate-200/90 bg-white/85 px-3.5 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm transition hover:border-slate-300 hover:bg-white no-underline dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10"
            >
              Home
            </Link>
            <span className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-sm font-semibold text-violet-700 dark:border-violet-500/30 dark:bg-violet-950/50 dark:text-violet-300">
              Pricing
            </span>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=DIMES-BI%20pricing%20inquiry`}
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
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-16 text-center sm:px-6 sm:pt-20">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">
            Simple, transparent pricing
          </p>
          <h1 className="display-title mx-auto mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-[#141627] dark:text-slate-50 sm:text-5xl">
            Bring your data. Scale your analytics.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
            Every plan includes all chart types, maps, and tables. Start free — upgrade when you need
            more projects, data sources, team seats, MEAL workflows, and exports.
          </p>
          <p className="mx-auto mt-3 text-sm font-medium text-violet-700/90 dark:text-violet-300/90">
            Free plan — no credit card required · Paid plans billed annually
          </p>

          {currencyLoading ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Detecting local currency…
            </p>
          ) : isConverted ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>
                {useLocalCurrency
                  ? `Approximate prices in ${currency}${country ? ` (${country})` : ''} — converted from USD`
                  : `Showing USD (your locale: ${currency}${country ? `, ${country}` : ''})`}
              </span>
              <button
                type="button"
                onClick={() => setShowInUsd(!showInUsd)}
                className="font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                {showInUsd ? `Show in ${currency}` : 'Show in USD'}
              </button>
            </div>
          ) : currencyError ? (
            <p className="mt-4 text-sm text-slate-500">Showing USD (location unavailable)</p>
          ) : null}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const Icon = plan.icon
              const displayPrice = plan.annualPrice

              return (
                <div key={plan.name} className="relative flex h-full flex-col">
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                      <span className="rounded-full bg-violet-600 px-4 py-1 text-sm font-medium text-white shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <article
                    className={cn(
                      'flex h-full flex-col overflow-hidden rounded-2xl border-2 bg-white/90 shadow-sm transition hover:shadow-xl dark:bg-slate-900/70',
                      plan.popular
                        ? 'border-violet-500'
                        : 'border-slate-200/70 hover:border-violet-200 dark:border-white/10 dark:hover:border-violet-500/40',
                    )}
                  >
                    <div className={cn('p-6', plan.popular && 'pt-8')}>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-2xl font-semibold text-[#141627] dark:text-slate-100">
                          {plan.name}
                        </h2>
                        <div
                          className={cn(
                            'flex size-12 items-center justify-center rounded-xl',
                            plan.popular
                              ? 'bg-violet-100 dark:bg-violet-950/50'
                              : 'bg-slate-100 dark:bg-slate-800',
                          )}
                        >
                          <Icon
                            className={cn(
                              'size-6',
                              plan.popular
                                ? 'text-violet-600 dark:text-violet-400'
                                : 'text-slate-600 dark:text-slate-400',
                            )}
                          />
                        </div>
                      </div>

                      <div className="mb-4 min-w-0">
                        {currencyLoading ? (
                          <div className="h-10 w-36 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
                        ) : displayPrice === 0 ? (
                          <div>
                            <span className="text-4xl font-bold text-[#141627] dark:text-slate-100">
                              {useLocalCurrency ? formatPrice(0) : '$0'}
                            </span>
                            <span className="ml-1 text-slate-600 dark:text-slate-400">/year</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex flex-wrap items-baseline gap-1">
                              <span className="text-4xl font-bold text-[#141627] dark:text-slate-100">
                                {useLocalCurrency
                                  ? formatPrice(displayPrice)
                                  : `$${displayPrice.toLocaleString('en-US', {
                                      minimumFractionDigits: displayPrice % 1 !== 0 ? 2 : 0,
                                      maximumFractionDigits: 2,
                                    })}`}
                              </span>
                              <span className="text-slate-600 dark:text-slate-400">/year</span>
                            </div>
                            {useLocalCurrency ? (
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                ≈ ${displayPrice}/yr USD
                              </p>
                            ) : null}
                          </div>
                        )}
                      </div>

                      <p className="min-h-[4.5rem] text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {plan.description}
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col px-6 pb-6">
                      <ul className="mb-6 flex-1 space-y-3">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start text-sm">
                            <CheckCircle2 className="mr-2 mt-0.5 size-4 shrink-0 text-violet-500" />
                            <span className="text-slate-600 dark:text-slate-400">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {plan.annualPrice === 0 ? (
                        <Link
                          to="/dashboards/add"
                          className={cn(
                            'mt-auto inline-flex w-full items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold no-underline transition',
                            plan.popular
                              ? 'border-transparent bg-violet-600 text-white hover:bg-violet-700'
                              : 'border-violet-600 text-violet-700 hover:bg-violet-50 dark:border-violet-400 dark:text-violet-300 dark:hover:bg-violet-950/40',
                          )}
                        >
                          {plan.cta}
                        </Link>
                      ) : (
                        <a
                          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`DIMES-BI ${plan.name} plan`)}`}
                          className={cn(
                            'mt-auto inline-flex w-full items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold no-underline transition',
                            plan.popular
                              ? 'border-transparent bg-violet-600 text-white hover:bg-violet-700'
                              : 'border-violet-600 text-violet-700 hover:bg-violet-50 dark:border-violet-400 dark:text-violet-300 dark:hover:bg-violet-950/40',
                          )}
                        >
                          {plan.cta}
                        </a>
                      )}
                    </div>
                  </article>
                </div>
              )
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="mb-4 text-slate-600 dark:text-slate-400">
              Need NGO pricing or a multi-country rollout?{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=DIMES-BI%20enterprise%20pricing`}
                className="font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                Contact sales
              </a>
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:underline dark:text-violet-400 no-underline"
            >
              <BarChart3 className="size-4" />
              Explore all product features
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">
            FAQ
          </p>
          <h2 className="display-title mx-auto mt-3 text-center text-2xl font-semibold tracking-tight text-[#141627] dark:text-slate-50 sm:text-3xl">
            Pricing questions
          </h2>
          <dl className="mt-10 space-y-4">
            {pricingFaqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/60"
              >
                <dt className="text-sm font-semibold text-[#141627] dark:text-slate-100">
                  {faq.question}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="relative mx-4 mb-16 overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-900 px-4 py-14 sm:mx-6 sm:px-8 md:mx-auto md:max-w-6xl">
          <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
            <h2 className="display-title text-2xl font-semibold text-white sm:text-3xl">
              Start with the Free plan today
            </h2>
            <p className="mt-3 text-violet-100">
              Connect a data source and publish your first dashboard in about 10 minutes.
            </p>
            <Link
              to="/dashboards/add"
              className="landing-cta-violet mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold shadow-lg transition hover:bg-violet-50 no-underline"
            >
              Try the workspace free
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <FloatingContactActions whatsappMessage="Hi, I have a question about DIMES-BI pricing." />
    </div>
  )
}

import { CONTACT_EMAIL } from '#/lib/contact'
import type { LandingFaq } from '#/data/landingFaqs'

export const pricingFaqs: LandingFaq[] = [
  {
    question: 'Can I change plans later?',
    answer:
      'Yes. Upgrade or downgrade anytime. Changes apply to your next billing cycle for paid plans.',
  },
  {
    question: 'What is included in the Free plan?',
    answer:
      'The Free plan includes 2 users, 1 project, 2 data sources (CSV & Excel), 5,000 rows/month, 10 indicators, and all visualization types — no credit card required. Upgrade when you need more projects, sources, or MEAL workflows.',
  },
  {
    question: 'Are any chart types or visualizations locked behind paid plans?',
    answer:
      'No. Every plan — including Free — has full access to all charts, maps, tables, KPI cards, and visualization types. Plans scale by projects, data sources, rows, indicators, MEAL workflows, and team size.',
  },
  {
    question: 'What counts as a data row?',
    answer:
      'A data row is a single record synced from any connected source — a Kobo submission, an Excel row, a SurveyCTO response, or an API record. The monthly limit resets each billing period.',
  },
  {
    question: 'Do you offer NGO or non-profit pricing?',
    answer: `Yes. Registered non-profits may qualify for adjusted pricing. Email ${CONTACT_EMAIL} with your organization details.`,
  },
  {
    question: 'How does BYOD pricing work?',
    answer:
      'Every plan includes bring-your-own-data connectors. Paid tiers unlock more data sources, higher sync frequency, exports, and advanced MEAL workflows — your teams keep collecting in Kobo, Excel, SurveyCTO, and the tools they already use.',
  },
  {
    question: 'Is there a setup fee?',
    answer:
      'No setup fees. Paid plans are billed annually — you pay only for the plan you select.',
  },
  {
    question: 'Why do I see prices in my local currency?',
    answer:
      'We estimate your currency from your IP location and convert from USD using live exchange rates. Amounts are approximate — billing is in USD unless we agree otherwise. Use “Show in USD” anytime to switch.',
  },
]

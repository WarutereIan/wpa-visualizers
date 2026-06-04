export type LandingFaq = { question: string; answer: string }

export const landingFaqs: LandingFaq[] = [
  {
    question: 'What is DIMES-BI?',
    answer:
      'DIMES-BI is a bring-your-own-data (BYOD) MEAL and analytics workspace. It connects Kobo, Excel, SurveyCTO, Google Forms, Microsoft 365, CSVs, and APIs so teams can model indicators, build dashboards, and publish donor-ready reports without replacing existing collection tools.',
  },
  {
    question: 'Do we have to migrate off Kobo or Excel?',
    answer:
      'No. Teams keep collecting in the tools they already use. DIMES-BI syncs and maps data into a shared semantic model for indicators, dashboards, maps, and narrative reports.',
  },
  {
    question: 'Who is DIMES-BI for?',
    answer:
      'MEAL officers, program managers, country directors, data analysts, partners, and donors who need governed analytics across fragmented program data — from single projects to multi-country portfolios.',
  },
  {
    question: 'How is DIMES-BI different from DIMES IDMS?',
    answer:
      'DIMES-BI focuses on the analytics layer: connectors, indicators, dashboards, and reporting. DIMES IDMS is the hosted program management platform (field workflows, org accounts, subscriptions). Many teams use both — connect sources in BI, operationalize programs in IDMS.',
  },
  {
    question: 'Can I try it now?',
    answer:
      'Yes. Use “Try the workspace” to open the interactive demo — create a dashboard, import sample or your own data, and explore indicators and maps without installing anything.',
  },
]

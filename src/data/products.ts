export type ProductTone = 'blue' | 'emerald' | 'violet'

export type AgenticProduct = {
  id: string
  title: string
  desc: string
  href?: string
  /** Short label shown on the digital-employee card. */
  category: string
  /** Industry menu label. Opens the same product workspace. */
  industry: string
  tone: ProductTone
}

export const workflowProducts: AgenticProduct[] = [
  {
    id: 'agents-edu',
    title: 'CareerPath AI',
    category: 'Education',
    industry: 'Education',
    tone: 'blue',
    href: 'https://macquarie-five.vercel.app/',
    desc: 'Guides students and learning teams from course discovery to personalised pathways.',
  },
  {
    id: 'agents-tax',
    title: 'BAS lodgement',
    category: 'Finance',
    industry: 'Tradies and small business',
    tone: 'emerald',
    href: 'https://baslogement.vercel.app/',
    desc: 'Analyses financial information, applies the rules, and supports BAS preparation for practices and small businesses.',
  },
  {
    id: 'custom-workflow',
    title: 'Custom Agentic Workflow',
    category: 'Your business',
    industry: 'Enterprise',
    tone: 'violet',
    href: 'https://bas-agentic-ai.vercel.app/',
    desc: 'Built around your data, processes, systems and rules.',
  },
]

// Curated strategy contacts: recruiters, exec search firms, exec job boards,
// associations. Stored as code (not JSON) so IDs are stable string literals
// the strategyRepo can attach user state to.
//
// Curated content stays read-only. User customizations (status, notes,
// custom-added entries) live in strategyRepo at `nexus.strategy.*`.

import type { StrategyContact } from '@/types/nexus'

type CuratedSeed = Omit<
  StrategyContact,
  'status' | 'userNotes' | 'lastContactedAt' | 'customAdded'
>

export const STRATEGY_ENTRIES: CuratedSeed[] = [
  // ── Insurance-focused recruiters ──────────────────────────
  {
    id: 'rec_jacobson_group',
    name: 'The Jacobson Group',
    category: 'Insurance-focused recruiters',
    type: 'recruiter',
    description:
      'Boutique focused exclusively on insurance executive search for 50+ years. Top name in insurance executive recruiting.',
    priority: 'highest',
  },
  {
    id: 'rec_smith_hanley',
    name: 'Smith Hanley Associates',
    category: 'Insurance-focused recruiters',
    type: 'recruiter',
    description: 'Analytics + insurance leadership; product/engineering at carriers.',
    priority: 'high',
  },
  {
    id: 'rec_christopher_group',
    name: 'The Christopher Group',
    category: 'Insurance-focused recruiters',
    type: 'recruiter',
    description: 'HR and insurance executive search.',
    priority: 'medium',
  },
  {
    id: 'rec_insurance_search_group',
    name: 'Insurance Search Group',
    category: 'Insurance-focused recruiters',
    type: 'recruiter',
    description: 'Niche insurance-only firm.',
    priority: 'medium',
  },
  {
    id: 'rec_iri',
    name: 'Insurance Recruiters International (IRI)',
    category: 'Insurance-focused recruiters',
    type: 'recruiter',
    description: 'Insurance-focused executive search.',
    priority: 'medium',
  },
  {
    id: 'rec_capstone',
    name: 'Capstone Search Group',
    category: 'Insurance-focused recruiters',
    type: 'recruiter',
    description: 'Insurance and financial services exec search.',
    priority: 'medium',
  },
  {
    id: 'rec_pryor',
    name: 'Pryor Associates',
    category: 'Insurance-focused recruiters',
    type: 'recruiter',
    description: 'Long-standing insurance recruiter.',
    priority: 'medium',
  },
  {
    id: 'rec_mjm_search',
    name: 'MJM Search',
    category: 'Insurance-focused recruiters',
    type: 'recruiter',
    description: 'Insurance-focused boutique.',
    priority: 'medium',
  },

  // ── Tech / insurtech executive search ─────────────────────
  {
    id: 'rec_daversa',
    name: 'Daversa Partners',
    category: 'Tech / insurtech executive search',
    type: 'recruiter',
    description:
      'Top tech executive recruiter; places at insurtechs like Lemonade, Coalition, Next Insurance.',
    priority: 'highest',
  },
  {
    id: 'rec_true_search',
    name: 'True Search',
    category: 'Tech / insurtech executive search',
    type: 'recruiter',
    description: 'Strong in tech executive placement, growing insurance practice.',
    priority: 'high',
  },
  {
    id: 'rec_riviera',
    name: 'Riviera Partners',
    category: 'Tech / insurtech executive search',
    type: 'recruiter',
    description: 'Engineering and product leadership at venture-backed companies.',
    priority: 'high',
  },
  {
    id: 'rec_bespoke',
    name: 'Bespoke Partners',
    category: 'Tech / insurtech executive search',
    type: 'recruiter',
    description: 'PE/VC-backed tech executive search.',
    priority: 'medium',
  },

  // ── Major firms with insurance practices ──────────────────
  {
    id: 'rec_korn_ferry',
    name: 'Korn Ferry',
    category: 'Major firms with insurance practices',
    type: 'recruiter',
    description: 'Insurance practice covers C-suite and VP roles at major carriers.',
    priority: 'high',
  },
  {
    id: 'rec_heidrick',
    name: 'Heidrick & Struggles',
    category: 'Major firms with insurance practices',
    type: 'recruiter',
    description: 'Large global firm with financial services / insurance practice.',
    priority: 'high',
  },
  {
    id: 'rec_spencer_stuart',
    name: 'Spencer Stuart',
    category: 'Major firms with insurance practices',
    type: 'recruiter',
    description: 'Top-tier for board and C-suite, occasionally VP.',
    priority: 'medium',
  },
  {
    id: 'rec_russell_reynolds',
    name: 'Russell Reynolds Associates',
    category: 'Major firms with insurance practices',
    type: 'recruiter',
    description: 'Financial services and insurance practice.',
    priority: 'medium',
  },
  {
    id: 'rec_egon_zehnder',
    name: 'Egon Zehnder',
    category: 'Major firms with insurance practices',
    type: 'recruiter',
    description: 'Global executive search, insurance coverage.',
    priority: 'medium',
  },

  // ── Specialized executive job boards ──────────────────────
  {
    id: 'board_bluesteps',
    name: 'BlueSteps',
    category: 'Specialized executive job boards',
    type: 'board',
    description:
      '~$199–$399/year. Run by AESC. Profile becomes searchable to member recruiters. Best paid investment for executive search visibility.',
    priority: 'highest',
  },
  {
    id: 'board_execthread',
    name: 'ExecThread',
    category: 'Specialized executive job boards',
    type: 'board',
    description: '~$60/month or invite-based free tier. Curated unposted opportunities.',
    priority: 'high',
  },
  {
    id: 'board_ladders',
    name: 'TheLadders',
    category: 'Specialized executive job boards',
    type: 'board',
    description: 'Free tier exists. Premium ~$30–$70/month. Filter for $200K+ roles.',
    priority: 'medium',
  },
  {
    id: 'board_ivy_exec',
    name: 'Ivy Exec',
    category: 'Specialized executive job boards',
    type: 'board',
    description: '~$40/month, executive job listings + career resources.',
    priority: 'medium',
  },

  // ── Industry associations & conferences ───────────────────
  {
    id: 'assoc_dmec',
    name: 'DMEC',
    category: 'Industry associations & conferences',
    type: 'association',
    description:
      'Disability Management Employer Coalition — premier association for absence and disability professionals.',
    priority: 'high',
  },
  {
    id: 'assoc_loma',
    name: 'LOMA',
    category: 'Industry associations & conferences',
    type: 'association',
    description: 'Life Office Management Association — life/health insurance.',
    priority: 'high',
  },
  {
    id: 'assoc_limra',
    name: 'LIMRA',
    category: 'Industry associations & conferences',
    type: 'association',
    description: 'Life Insurance Marketing & Research Association.',
    priority: 'medium',
  },
  {
    id: 'conf_insuretech_connect',
    name: 'InsureTech Connect (ITC Vegas)',
    category: 'Industry associations & conferences',
    type: 'conference',
    description:
      'Largest insurtech conference globally. Strong networking with VCs, founders, and carrier execs.',
    priority: 'highest',
  },
  {
    id: 'conf_dmec_annual',
    name: 'DMEC Annual Conference',
    category: 'Industry associations & conferences',
    type: 'conference',
    description: 'Disability/absence professionals; great for direct hiring-manager intros.',
    priority: 'high',
  },
]

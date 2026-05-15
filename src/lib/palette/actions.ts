// Static command-palette actions. These are descriptors only — actual
// navigation happens in the CommandPalette component which owns the router.

import type { PaletteResult } from './types'

export function getActions(): PaletteResult[] {
  return [
    {
      id: 'action-new-analysis',
      type: 'action',
      group: 'Actions',
      icon: '✨',
      title: 'New analysis',
      subtitle: 'Paste a JD to tailor a resume',
      href: '/analyze',
      keywords: ['analyze', 'create', 'jd'],
    },
    {
      id: 'action-tracker',
      type: 'action',
      group: 'Actions',
      icon: '📋',
      title: 'Open tracker',
      href: '/tracker',
      keywords: ['applications', 'kanban'],
    },
    {
      id: 'action-build',
      type: 'action',
      group: 'Actions',
      icon: '📚',
      title: 'Build repository',
      href: '/build',
      keywords: ['add experience', 'voice'],
    },
    {
      id: 'action-companies',
      type: 'action',
      group: 'Actions',
      icon: '🎯',
      title: 'Browse target companies',
      href: '/companies',
      keywords: ['watchlist', 'targets'],
    },
    {
      id: 'action-strategy',
      type: 'action',
      group: 'Actions',
      icon: '🤝',
      title: 'Open strategy playbook',
      href: '/strategy',
      keywords: ['recruiters', 'playbook'],
    },
  ]
}

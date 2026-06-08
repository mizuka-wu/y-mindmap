export { createTemplate, createTopic, createChildTopic, TEMPLATE_CATEGORIES } from './types'
export type { Template, TemplateCategory } from './types'

export { BUSINESS_TEMPLATES } from './business'
export { EDUCATION_TEMPLATES } from './education'
export { PROJECT_TEMPLATES } from './project'
export { PERSONAL_TEMPLATES } from './personal'
export { CREATIVE_TEMPLATES, ANALYSIS_TEMPLATES } from './creative-analysis'

import { Template } from './types'
import { BUSINESS_TEMPLATES } from './business'
import { EDUCATION_TEMPLATES } from './education'
import { PROJECT_TEMPLATES } from './project'
import { PERSONAL_TEMPLATES } from './personal'
import { CREATIVE_TEMPLATES, ANALYSIS_TEMPLATES } from './creative-analysis'

export const ALL_TEMPLATES: Template[] = [
  ...BUSINESS_TEMPLATES,
  ...EDUCATION_TEMPLATES,
  ...PROJECT_TEMPLATES,
  ...PERSONAL_TEMPLATES,
  ...CREATIVE_TEMPLATES,
  ...ANALYSIS_TEMPLATES,
]

export function getTemplatesByCategory(category: string): Template[] {
  return ALL_TEMPLATES.filter(t => t.category === category)
}

export function getTemplateById(id: string): Template | undefined {
  return ALL_TEMPLATES.find(t => t.id === id)
}

export function searchTemplates(query: string): Template[] {
  const lower = query.toLowerCase()
  return ALL_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower) ||
    t.tags.some(tag => tag.toLowerCase().includes(lower))
  )
}

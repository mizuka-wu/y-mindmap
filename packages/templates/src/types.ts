import { TopicData, TopicType, StructureType } from '@y-mindmap/core'

export interface Template {
  id: string
  name: string
  description: string
  category: TemplateCategory
  thumbnail?: string
  structure: StructureType
  root: TopicData
  tags: string[]
}

export type TemplateCategory = 
  | 'business'
  | 'education'
  | 'personal'
  | 'project'
  | 'creative'
  | 'analysis'

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { name: string; icon: string }> = {
  business: { name: '商务', icon: '💼' },
  education: { name: '教育', icon: '📚' },
  personal: { name: '个人', icon: '👤' },
  project: { name: '项目', icon: '📋' },
  creative: { name: '创意', icon: '💡' },
  analysis: { name: '分析', icon: '📊' },
}

export function createTemplate(
  id: string,
  name: string,
  description: string,
  category: TemplateCategory,
  structure: StructureType,
  root: TopicData,
  tags: string[] = []
): Template {
  return { id, name, description, category, structure, root, tags }
}

export function createTopic(
  id: string,
  title: string,
  type: TopicType = TopicType.ROOT,
  children: TopicData[] = []
): TopicData {
  const topic: TopicData = {
    id,
    title,
    type,
  }

  if (children.length > 0) {
    topic.children = {
      attached: children,
    }
  }

  return topic
}

export function createChildTopic(
  id: string,
  title: string,
  children: TopicData[] = []
): TopicData {
  return createTopic(id, title, TopicType.ATTACHED, children)
}

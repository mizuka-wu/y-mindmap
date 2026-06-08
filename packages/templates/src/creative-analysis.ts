import { StructureType } from '@y-mindmap/core'
import { Template, createTemplate, createTopic, createChildTopic } from './types'

export const CREATIVE_TEMPLATES: Template[] = [
  createTemplate(
    'creative-brainstorm',
    '头脑风暴',
    '收集和整理想法',
    'creative',
    StructureType.MAP,
    createTopic('root', '头脑风暴主题', undefined, [
      createChildTopic('idea1', '想法 1', [
        createChildTopic('detail1-1', '细节'),
        createChildTopic('feasibility1', '可行性'),
      ]),
      createChildTopic('idea2', '想法 2', [
        createChildTopic('detail2-1', '细节'),
        createChildTopic('feasibility2', '可行性'),
      ]),
      createChildTopic('idea3', '想法 3', [
        createChildTopic('detail3-1', '细节'),
        createChildTopic('feasibility3', '可行性'),
      ]),
      createChildTopic('category1', '类别 A', [
        createChildTopic('cat1-idea1', '相关想法'),
      ]),
      createChildTopic('category2', '类别 B', [
        createChildTopic('cat2-idea1', '相关想法'),
      ]),
      createChildTopic('next', '下一步', [
        createChildTopic('action1', '行动 1'),
        createChildTopic('action2', '行动 2'),
      ]),
    ]),
    ['创意', '头脑风暴', '想法']
  ),

  createTemplate(
    'creative-story',
    '故事大纲',
    '规划故事结构和情节',
    'creative',
    StructureType.LOGIC_RIGHT,
    createTopic('root', '故事标题', undefined, [
      createChildTopic('characters', '角色', [
        createChildTopic('protagonist', '主角', [
          createChildTopic('name', '姓名'),
          createChildTopic('motivation', '动机'),
          createChildTopic('arc', '成长弧线'),
        ]),
        createChildTopic('antagonist', '反派', [
          createChildTopic('name-a', '姓名'),
          createChildTopic('motivation-a', '动机'),
        ]),
        createChildTopic('supporting', '配角', [
          createChildTopic('char1', '角色 1'),
        ]),
      ]),
      createChildTopic('setting', '设定', [
        createChildTopic('time', '时间'),
        createChildTopic('place', '地点'),
        createChildTopic('world', '世界观'),
      ]),
      createChildTopic('plot', '情节', [
        createChildTopic('act1', '第一幕：开端', [
          createChildTopic('hook', '钩子'),
          createChildTopic('inciting', '激励事件'),
        ]),
        createChildTopic('act2', '第二幕：发展', [
          createChildTopic('conflict', '冲突'),
          createChildTopic('crisis', '危机'),
        ]),
        createChildTopic('act3', '第三幕：高潮与结局', [
          createChildTopic('climax', '高潮'),
          createChildTopic('resolution', '结局'),
        ]),
      ]),
      createChildTopic('themes', '主题', [
        createChildTopic('theme1', '主题 1'),
        createChildTopic('theme2', '主题 2'),
      ]),
    ]),
    ['写作', '故事', '创意']
  ),
]

export const ANALYSIS_TEMPLATES: Template[] = [
  createTemplate(
    'analysis-problem',
    '问题分析',
    '分解和分析复杂问题',
    'analysis',
    StructureType.MAP,
    createTopic('root', '问题', undefined, [
      createChildTopic('symptoms', '症状', [
        createChildTopic('s1', '症状 1'),
        createChildTopic('s2', '症状 2'),
        createChildTopic('s3', '症状 3'),
      ]),
      createChildTopic('causes', '原因', [
        createChildTopic('root-cause', '根本原因', [
          createChildTopic('rc1', '原因 1'),
          createChildTopic('rc2', '原因 2'),
        ]),
        createChildTopic('contributing', '促成因素', [
          createChildTopic('cf1', '因素 1'),
          createChildTopic('cf2', '因素 2'),
        ]),
      ]),
      createChildTopic('solutions', '解决方案', [
        createChildTopic('short-term', '短期方案', [
          createChildTopic('st1', '方案 1'),
          createChildTopic('st2', '方案 2'),
        ]),
        createChildTopic('long-term', '长期方案', [
          createChildTopic('lt1', '方案 1'),
          createChildTopic('lt2', '方案 2'),
        ]),
      ]),
      createChildTopic('impact', '影响', [
        createChildTopic('positive', '正面影响'),
        createChildTopic('negative', '负面影响'),
      ]),
      createChildTopic('action', '行动计划', [
        createChildTopic('step1', '步骤 1'),
        createChildTopic('step2', '步骤 2'),
        createChildTopic('step3', '步骤 3'),
      ]),
    ]),
    ['问题', '分析', '解决']
  ),

  createTemplate(
    'analysis-competitive',
    '竞品分析',
    '分析竞争对手的优劣势',
    'analysis',
    StructureType.MAP,
    createTopic('root', '竞品分析', undefined, [
      createChildTopic('product', '我方产品', [
        createChildTopic('strengths', '优势', [
          createChildTopic('s1', '优势 1'),
          createChildTopic('s2', '优势 2'),
        ]),
        createChildTopic('weaknesses', '劣势', [
          createChildTopic('w1', '劣势 1'),
          createChildTopic('w2', '劣势 2'),
        ]),
      ]),
      createChildTopic('competitor1', '竞品 A', [
        createChildTopic('c1-strengths', '优势', [
          createChildTopic('c1-s1', '优势 1'),
          createChildTopic('c1-s2', '优势 2'),
        ]),
        createChildTopic('c1-weaknesses', '劣势', [
          createChildTopic('c1-w1', '劣势 1'),
        ]),
        createChildTopic('c1-market', '市场份额'),
        createChildTopic('c1-pricing', '定价策略'),
      ]),
      createChildTopic('competitor2', '竞品 B', [
        createChildTopic('c2-strengths', '优势', [
          createChildTopic('c2-s1', '优势 1'),
        ]),
        createChildTopic('c2-weaknesses', '劣势', [
          createChildTopic('c2-w1', '劣势 1'),
        ]),
      ]),
      createChildTopic('opportunities', '机会', [
        createChildTopic('opp1', '机会 1'),
        createChildTopic('opp2', '机会 2'),
      ]),
      createChildTopic('strategy', '策略', [
        createChildTopic('diff', '差异化策略'),
        createChildTopic('action', '行动计划'),
      ]),
    ]),
    ['竞品', '分析', '市场']
  ),
]

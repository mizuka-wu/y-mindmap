import { StructureType } from '@y-mindmap/core'
import { Template, createTemplate, createTopic, createChildTopic } from './types'

export const BUSINESS_TEMPLATES: Template[] = [
  createTemplate(
    'business-swot',
    'SWOT 分析',
    '分析优势、劣势、机会和威胁',
    'business',
    StructureType.MAP,
    createTopic('root', 'SWOT 分析', undefined, [
      createChildTopic('strengths', '优势 S', [
        createChildTopic('s1', '内部优势 1'),
        createChildTopic('s2', '内部优势 2'),
        createChildTopic('s3', '内部优势 3'),
      ]),
      createChildTopic('weaknesses', '劣势 W', [
        createChildTopic('w1', '内部劣势 1'),
        createChildTopic('w2', '内部劣势 2'),
        createChildTopic('w3', '内部劣势 3'),
      ]),
      createChildTopic('opportunities', '机会 O', [
        createChildTopic('o1', '外部机会 1'),
        createChildTopic('o2', '外部机会 2'),
        createChildTopic('o3', '外部机会 3'),
      ]),
      createChildTopic('threats', '威胁 T', [
        createChildTopic('t1', '外部威胁 1'),
        createChildTopic('t2', '外部威胁 2'),
        createChildTopic('t3', '外部威胁 3'),
      ]),
    ]),
    ['分析', '战略', '商务']
  ),

  createTemplate(
    'business-model-canvas',
    '商业模式画布',
    '描述、设计、挑战和 pivote 商业模式',
    'business',
    StructureType.MAP,
    createTopic('root', '商业模式', undefined, [
      createChildTopic('kp', '关键合作伙伴', [
        createChildTopic('kp1', '合作伙伴 1'),
        createChildTopic('kp2', '合作伙伴 2'),
      ]),
      createChildTopic('ka', '关键活动', [
        createChildTopic('ka1', '活动 1'),
        createChildTopic('ka2', '活动 2'),
      ]),
      createChildTopic('vr', '价值主张', [
        createChildTopic('vr1', '价值 1'),
        createChildTopic('vr2', '价值 2'),
      ]),
      createChildTopic('cr', '客户关系', [
        createChildTopic('cr1', '关系类型'),
      ]),
      createChildTopic('cs', '客户细分', [
        createChildTopic('cs1', '客户群体 1'),
        createChildTopic('cs2', '客户群体 2'),
      ]),
      createChildTopic('kr', '核心资源', [
        createChildTopic('kr1', '资源 1'),
        createChildTopic('kr2', '资源 2'),
      ]),
      createChildTopic('ch', '渠道通路', [
        createChildTopic('ch1', '渠道 1'),
        createChildTopic('ch2', '渠道 2'),
      ]),
      createChildTopic('cost', '成本结构', [
        createChildTopic('cost1', '主要成本'),
      ]),
      createChildTopic('rev', '收入来源', [
        createChildTopic('rev1', '收入流'),
      ]),
    ]),
    ['商业模式', '创业', '战略']
  ),

  createTemplate(
    'business-meeting',
    '会议纪要',
    '记录会议议程、讨论要点和行动项',
    'business',
    StructureType.MAP,
    createTopic('root', '会议纪要', undefined, [
      createChildTopic('info', '会议信息', [
        createChildTopic('date', '日期：'),
        createChildTopic('time', '时间：'),
        createChildTopic('location', '地点：'),
        createChildTopic('attendees', '参会人员：'),
      ]),
      createChildTopic('agenda', '议程', [
        createChildTopic('topic1', '议题 1'),
        createChildTopic('topic2', '议题 2'),
        createChildTopic('topic3', '议题 3'),
      ]),
      createChildTopic('discussion', '讨论要点', [
        createChildTopic('point1', '要点 1'),
        createChildTopic('point2', '要点 2'),
      ]),
      createChildTopic('actions', '行动项', [
        createChildTopic('action1', '行动 1 - 负责人 - 截止日期'),
        createChildTopic('action2', '行动 2 - 负责人 - 截止日期'),
      ]),
      createChildTopic('decisions', '决策', [
        createChildTopic('decision1', '决策 1'),
        createChildTopic('decision2', '决策 2'),
      ]),
    ]),
    ['会议', '商务', '纪要']
  ),
]

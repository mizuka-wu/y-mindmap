import { StructureType } from '@y-mindmap/core'
import { Template, createTemplate, createTopic, createChildTopic } from './types'

export const PROJECT_TEMPLATES: Template[] = [
  createTemplate(
    'project-plan',
    '项目计划',
    '规划项目范围、时间线和资源',
    'project',
    StructureType.LOGIC_RIGHT,
    createTopic('root', '项目名称', undefined, [
      createChildTopic('scope', '项目范围', [
        createChildTopic('goals', '目标', [
          createChildTopic('goal1', '目标 1'),
          createChildTopic('goal2', '目标 2'),
        ]),
        createChildTopic('deliverables', '交付物', [
          createChildTopic('d1', '交付物 1'),
          createChildTopic('d2', '交付物 2'),
        ]),
        createChildTopic('constraints', '约束条件', [
          createChildTopic('c1', '时间约束'),
          createChildTopic('c2', '预算约束'),
        ]),
      ]),
      createChildTopic('timeline', '时间线', [
        createChildTopic('phase1', '阶段 1：规划', [
          createChildTopic('t1-1', '任务 1.1'),
          createChildTopic('t1-2', '任务 1.2'),
        ]),
        createChildTopic('phase2', '阶段 2：执行', [
          createChildTopic('t2-1', '任务 2.1'),
          createChildTopic('t2-2', '任务 2.2'),
        ]),
        createChildTopic('phase3', '阶段 3：收尾', [
          createChildTopic('t3-1', '任务 3.1'),
          createChildTopic('t3-2', '任务 3.2'),
        ]),
      ]),
      createChildTopic('resources', '资源', [
        createChildTopic('team', '团队', [
          createChildTopic('member1', '成员 1 - 角色'),
          createChildTopic('member2', '成员 2 - 角色'),
        ]),
        createChildTopic('budget', '预算', [
          createChildTopic('cost1', '成本项 1'),
          createChildTopic('cost2', '成本项 2'),
        ]),
      ]),
      createChildTopic('risks', '风险', [
        createChildTopic('risk1', '风险 1 - 应对措施'),
        createChildTopic('risk2', '风险 2 - 应对措施'),
      ]),
    ]),
    ['项目', '计划', '管理']
  ),

  createTemplate(
    'project-scrum',
    'Scrum 看板',
    '敏捷开发任务管理',
    'project',
    StructureType.MAP,
    createTopic('root', 'Sprint', undefined, [
      createChildTopic('backlog', '待办事项', [
        createChildTopic('story1', '用户故事 1'),
        createChildTopic('story2', '用户故事 2'),
        createChildTopic('story3', '用户故事 3'),
      ]),
      createChildTopic('todo', '待开发', [
        createChildTopic('task1', '任务 1'),
        createChildTopic('task2', '任务 2'),
      ]),
      createChildTopic('progress', '进行中', [
        createChildTopic('task3', '任务 3'),
      ]),
      createChildTopic('review', '待测试', [
        createChildTopic('task4', '任务 4'),
      ]),
      createChildTopic('done', '已完成', [
        createChildTopic('task5', '任务 5'),
        createChildTopic('task6', '任务 6'),
      ]),
    ]),
    ['敏捷', 'Scrum', '看板']
  ),

  createTemplate(
    'project-requirements',
    '需求分析',
    '收集和分析产品需求',
    'project',
    StructureType.MAP,
    createTopic('root', '产品需求', undefined, [
      createChildTopic('functional', '功能需求', [
        createChildTopic('f1', '核心功能 1', [
          createChildTopic('f1-1', '子功能 1.1'),
          createChildTopic('f1-2', '子功能 1.2'),
        ]),
        createChildTopic('f2', '核心功能 2', [
          createChildTopic('f2-1', '子功能 2.1'),
        ]),
      ]),
      createChildTopic('nonfunctional', '非功能需求', [
        createChildTopic('perf', '性能要求'),
        createChildTopic('security', '安全要求'),
        createChildTopic('usability', '可用性要求'),
      ]),
      createChildTopic('constraints', '约束', [
        createChildTopic('tech', '技术约束'),
        createChildTopic('business', '业务约束'),
      ]),
      createChildTopic('assumptions', '假设', [
        createChildTopic('a1', '假设 1'),
        createChildTopic('a2', '假设 2'),
      ]),
    ]),
    ['需求', '产品', '分析']
  ),
]

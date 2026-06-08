import { StructureType } from '@y-mindmap/core'
import { Template, createTemplate, createTopic, createChildTopic } from './types'

export const PERSONAL_TEMPLATES: Template[] = [
  createTemplate(
    'personal-gtd',
    'GTD 任务管理',
    'Getting Things Done 任务整理',
    'personal',
    StructureType.MAP,
    createTopic('root', 'GTD', undefined, [
      createChildTopic('inbox', '收件箱', [
        createChildTopic('item1', '待处理事项 1'),
        createChildTopic('item2', '待处理事项 2'),
        createChildTopic('item3', '待处理事项 3'),
      ]),
      createChildTopic('next', '下一步行动', [
        createChildTopic('next1', '行动 1'),
        createChildTopic('next2', '行动 2'),
      ]),
      createChildTopic('projects', '项目', [
        createChildTopic('project1', '项目 1'),
        createChildTopic('project2', '项目 2'),
      ]),
      createChildTopic('waiting', '等待中', [
        createChildTopic('wait1', '等待事项 1'),
      ]),
      createChildTopic('someday', '将来/也许', [
        createChildTopic('future1', '未来计划 1'),
        createChildTopic('future2', '未来计划 2'),
      ]),
      createChildTopic('reference', '参考资料', [
        createChildTopic('ref1', '参考 1'),
      ]),
    ]),
    ['GTD', '任务', '效率']
  ),

  createTemplate(
    'personal-weekly',
    '周计划',
    '规划一周的任务和目标',
    'personal',
    StructureType.MAP,
    createTopic('root', '本周计划', undefined, [
      createChildTopic('goals', '本周目标', [
        createChildTopic('goal1', '目标 1'),
        createChildTopic('goal2', '目标 2'),
        createChildTopic('goal3', '目标 3'),
      ]),
      createChildTopic('mon', '周一', [
        createChildTopic('mon1', '任务 1'),
        createChildTopic('mon2', '任务 2'),
      ]),
      createChildTopic('tue', '周二', [
        createChildTopic('tue1', '任务 1'),
      ]),
      createChildTopic('wed', '周三', [
        createChildTopic('wed1', '任务 1'),
      ]),
      createChildTopic('thu', '周四', [
        createChildTopic('thu1', '任务 1'),
      ]),
      createChildTopic('fri', '周五', [
        createChildTopic('fri1', '任务 1'),
      ]),
      createChildTopic('notes', '备注', [
        createChildTopic('note1', '备注 1'),
      ]),
    ]),
    ['计划', '周计划', '时间管理']
  ),

  createTemplate(
    'personal-decision',
    '决策分析',
    '分析选择的利弊和后果',
    'personal',
    StructureType.MAP,
    createTopic('root', '决策：', undefined, [
      createChildTopic('options', '选项', [
        createChildTopic('option1', '选项 A', [
          createChildTopic('pros-a', '优点', [
            createChildTopic('pro1-a', '优点 1'),
            createChildTopic('pro2-a', '优点 2'),
          ]),
          createChildTopic('cons-a', '缺点', [
            createChildTopic('con1-a', '缺点 1'),
            createChildTopic('con2-a', '缺点 2'),
          ]),
        ]),
        createChildTopic('option2', '选项 B', [
          createChildTopic('pros-b', '优点', [
            createChildTopic('pro1-b', '优点 1'),
            createChildTopic('pro2-b', '优点 2'),
          ]),
          createChildTopic('cons-b', '缺点', [
            createChildTopic('con1-b', '缺点 1'),
          ]),
        ]),
      ]),
      createChildTopic('criteria', '评估标准', [
        createChildTopic('c1', '标准 1'),
        createChildTopic('c2', '标准 2'),
        createChildTopic('c3', '标准 3'),
      ]),
      createChildTopic('conclusion', '结论', [
        createChildTopic('decision', '最终决定'),
        createChildTopic('reason', '理由'),
      ]),
    ]),
    ['决策', '分析', '选择']
  ),
]

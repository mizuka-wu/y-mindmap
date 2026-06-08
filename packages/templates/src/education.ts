import { StructureType } from '@y-mindmap/core'
import { Template, createTemplate, createTopic, createChildTopic } from './types'

export const EDUCATION_TEMPLATES: Template[] = [
  createTemplate(
    'education-essay',
    '论文大纲',
    '规划论文结构和论点',
    'education',
    StructureType.LOGIC_RIGHT,
    createTopic('root', '论文主题', undefined, [
      createChildTopic('intro', '引言', [
        createChildTopic('background', '背景介绍'),
        createChildTopic('thesis', '论点陈述'),
        createChildTopic('overview', '文章概述'),
      ]),
      createChildTopic('body1', '主体段落 1', [
        createChildTopic('topic1', '主题句'),
        createChildTopic('evidence1', '论据'),
        createChildTopic('analysis1', '分析'),
        createChildTopic('transition1', '过渡'),
      ]),
      createChildTopic('body2', '主体段落 2', [
        createChildTopic('topic2', '主题句'),
        createChildTopic('evidence2', '论据'),
        createChildTopic('analysis2', '分析'),
        createChildTopic('transition2', '过渡'),
      ]),
      createChildTopic('body3', '主体段落 3', [
        createChildTopic('topic3', '主题句'),
        createChildTopic('evidence3', '论据'),
        createChildTopic('analysis3', '分析'),
      ]),
      createChildTopic('conclusion', '结论', [
        createChildTopic('summary', '总结论点'),
        createChildTopic('implications', '意义'),
        createChildTopic('future', '未来研究方向'),
      ]),
      createChildTopic('references', '参考文献', [
        createChildTopic('ref1', '[1] 参考文献 1'),
        createChildTopic('ref2', '[2] 参考文献 2'),
      ]),
    ]),
    ['论文', '学术', '写作']
  ),

  createTemplate(
    'education-study',
    '学习笔记',
    '整理学习内容和知识点',
    'education',
    StructureType.MAP,
    createTopic('root', '课程名称', undefined, [
      createChildTopic('chapters', '章节', [
        createChildTopic('ch1', '第 1 章', [
          createChildTopic('key1', '知识点 1'),
          createChildTopic('key2', '知识点 2'),
        ]),
        createChildTopic('ch2', '第 2 章', [
          createChildTopic('key3', '知识点 3'),
          createChildTopic('key4', '知识点 4'),
        ]),
      ]),
      createChildTopic('concepts', '核心概念', [
        createChildTopic('concept1', '概念 1：定义'),
        createChildTopic('concept2', '概念 2：定义'),
      ]),
      createChildTopic('questions', '问题', [
        createChildTopic('q1', '问题 1'),
        createChildTopic('q2', '问题 2'),
      ]),
      createChildTopic('summary', '总结', [
        createChildTopic('takeaway1', '要点 1'),
        createChildTopic('takeaway2', '要点 2'),
      ]),
    ]),
    ['学习', '笔记', '教育']
  ),

  createTemplate(
    'education-mindmap',
    '知识图谱',
    '可视化知识结构和关联',
    'education',
    StructureType.MAP,
    createTopic('root', '主题', undefined, [
      createChildTopic('branch1', '分支 1', [
        createChildTopic('sub1-1', '子主题 1-1'),
        createChildTopic('sub1-2', '子主题 1-2'),
        createChildTopic('sub1-3', '子主题 1-3'),
      ]),
      createChildTopic('branch2', '分支 2', [
        createChildTopic('sub2-1', '子主题 2-1'),
        createChildTopic('sub2-2', '子主题 2-2'),
      ]),
      createChildTopic('branch3', '分支 3', [
        createChildTopic('sub3-1', '子主题 3-1'),
        createChildTopic('sub3-2', '子主题 3-2'),
        createChildTopic('sub3-3', '子主题 3-3'),
      ]),
      createChildTopic('branch4', '分支 4', [
        createChildTopic('sub4-1', '子主题 4-1'),
        createChildTopic('sub4-2', '子主题 4-2'),
      ]),
    ]),
    ['知识', '图谱', '学习']
  ),
]

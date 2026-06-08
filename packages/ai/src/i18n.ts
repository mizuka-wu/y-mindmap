export type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR' | 'fr-FR' | 'de-DE' | 'es-ES'

export interface LocaleMessages {
  stateDescriber: {
    rootTitle: (title: string) => string
    layout: (type: string) => string
    mainBranches: (count: number, names: string) => string
    statistics: (total: number, depth: number, leaves: number) => string
    selectedOne: (title: string) => string
    selectedMultiple: (count: number, titles: string) => string
    nodeNotFound: (id: string) => string
    nodeDescription: (title: string) => string
    nodeType: (type: string) => string
    nodePosition: (position: string) => string
    childNodes: (count: number, names: string) => string
    markers: (markers: string) => string
    labels: (labels: string) => string
    notes: (notes: string) => string
    types: {
      root: string
      attached: string
      detached: string
      summary: string
      callout: string
      unknown: string
    }
    structures: Record<string, string>
  }
  suggestionEngine: {
    reasons: {
      noChildren: string
      singleBranch: string
      longContentNoChildren: (title: string) => string
      emptyNode: string
      noNotesOnRoot: string
      noMarkers: string
      noLabels: string
      deepNodes: (count: number) => string
      foldNode: string
      addSibling: string
      groupSelection: string
    }
    priorities: {
      high: string
      medium: string
      low: string
    }
    categories: {
      structure: string
      content: string
      organization: string
      style: string
    }
    actions: {
      addSubTopic: string
      addSiblingTopic: string
      updateTitle: string
      addNotes: string
      addMarker: string
      addLabel: string
      restructure: string
      toggleFold: string
      groupSelection: string
    }
  }
  contextProvider: {
    document: {
      title: string
      nodeCount: string
      maxDepth: string
      leafCount: string
      branchCount: string
      structureType: string
    }
    selection: {
      nodeIds: string
      titles: string
      count: string
      types: string
      hasChildren: string
      parentTitles: string
    }
    statistics: {
      totalNodes: string
      nodesByType: string
      nodesByDepth: string
      averageChildren: string
      maxChildrenNode: string
      emptyNodes: string
    }
  }
}

const zhCN: LocaleMessages = {
  stateDescriber: {
    rootTitle: (title) => `思维导图「${title}」`,
    layout: (type) => `布局: ${type}`,
    mainBranches: (count, names) => `主要分支 (${count}): ${names}`,
    statistics: (total, depth, leaves) => `共 ${total} 个节点，最大深度 ${depth}，${leaves} 个叶子节点`,
    selectedOne: (title) => `当前选中: 「${title}」`,
    selectedMultiple: (count, titles) => `当前选中 ${count} 个节点: ${titles}`,
    nodeNotFound: (id) => `节点 ${id} 不存在`,
    nodeDescription: (title) => `「${title}」`,
    nodeType: (type) => `类型: ${type}`,
    nodePosition: (position) => `位置: ${position}`,
    childNodes: (count, names) => `子节点 (${count}): ${names}`,
    markers: (markers) => `标记: ${markers}`,
    labels: (labels) => `标签: ${labels}`,
    notes: (notes) => `备注: ${notes}`,
    types: {
      root: '根节点',
      attached: '子节点',
      detached: '浮动节点',
      summary: '摘要节点',
      callout: '标注节点',
      unknown: '未知类型',
    },
    structures: {
      'org.xmind.ui.map': '思维导图',
      'org.xmind.ui.logic.right': '逻辑图（右）',
      'org.xmind.ui.logic.left': '逻辑图（左）',
      'org.xmind.ui.tree.right': '树形图（右）',
      'org.xmind.ui.tree.left': '树形图（左）',
      'org.xmind.ui.org-chart.down': '组织图（下）',
      'org.xmind.ui.org-chart.up': '组织图（上）',
      'org.xmind.ui.fishbone.leftHeaded': '鱼骨图（左）',
      'org.xmind.ui.fishbone.rightHeaded': '鱼骨图（右）',
      'org.xmind.ui.timeline.horizontal': '时间线（水平）',
      'org.xmind.ui.timeline.vertical': '时间线（垂直）',
      'org.xmind.ui.spreadsheet': '表格',
      'org.xmind.ui.brace.left': '括号（左）',
      'org.xmind.ui.brace.right': '括号（右）',
      'org.xmind.ui.treetable': '树表',
    },
  },
  suggestionEngine: {
    reasons: {
      noChildren: '根节点没有子节点，添加主要分支以开始构建思维导图',
      singleBranch: '只有一个主要分支，添加更多分支以丰富结构',
      longContentNoChildren: (title) => `节点「${title}」内容较多但没有子节点，可以分解为子主题`,
      emptyNode: '存在空白节点，添加标题以完善内容',
      noNotesOnRoot: '为根节点添加备注以记录详细说明',
      noMarkers: '使用标记（优先级、表情）来标识重要节点',
      noLabels: '使用标签来分类和筛选节点',
      deepNodes: (count) => `有 ${count} 个节点深度超过 4 层，考虑重组结构`,
      foldNode: '折叠节点以简化视图',
      addSibling: '添加兄弟节点',
      groupSelection: '将选中的节点分组到一个父节点下',
    },
    priorities: {
      high: '高',
      medium: '中',
      low: '低',
    },
    categories: {
      structure: '结构',
      content: '内容',
      organization: '组织',
      style: '样式',
    },
    actions: {
      addSubTopic: '添加子节点',
      addSiblingTopic: '添加兄弟节点',
      updateTitle: '更新标题',
      addNotes: '添加备注',
      addMarker: '添加标记',
      addLabel: '添加标签',
      restructure: '重组结构',
      toggleFold: '折叠/展开',
      groupSelection: '分组选中节点',
    },
  },
  contextProvider: {
    document: {
      title: '标题',
      nodeCount: '节点数',
      maxDepth: '最大深度',
      leafCount: '叶子节点数',
      branchCount: '分支数',
      structureType: '布局类型',
    },
    selection: {
      nodeIds: '选中节点ID',
      titles: '选中节点标题',
      count: '选中数量',
      types: '节点类型',
      hasChildren: '是否有子节点',
      parentTitles: '父节点标题',
    },
    statistics: {
      totalNodes: '总节点数',
      nodesByType: '按类型统计',
      nodesByDepth: '按深度统计',
      averageChildren: '平均子节点数',
      maxChildrenNode: '最多子节点',
      emptyNodes: '空白节点',
    },
  },
}

const enUS: LocaleMessages = {
  stateDescriber: {
    rootTitle: (title) => `Mind map "${title}"`,
    layout: (type) => `Layout: ${type}`,
    mainBranches: (count, names) => `Main branches (${count}): ${names}`,
    statistics: (total, depth, leaves) => `${total} nodes total, max depth ${depth}, ${leaves} leaf nodes`,
    selectedOne: (title) => `Currently selected: "${title}"`,
    selectedMultiple: (count, titles) => `${count} nodes selected: ${titles}`,
    nodeNotFound: (id) => `Node ${id} not found`,
    nodeDescription: (title) => `"${title}"`,
    nodeType: (type) => `Type: ${type}`,
    nodePosition: (position) => `Position: ${position}`,
    childNodes: (count, names) => `Children (${count}): ${names}`,
    markers: (markers) => `Markers: ${markers}`,
    labels: (labels) => `Labels: ${labels}`,
    notes: (notes) => `Notes: ${notes}`,
    types: {
      root: 'Root',
      attached: 'Child',
      detached: 'Floating',
      summary: 'Summary',
      callout: 'Callout',
      unknown: 'Unknown',
    },
    structures: {
      'org.xmind.ui.map': 'Mind Map',
      'org.xmind.ui.logic.right': 'Logic Chart (Right)',
      'org.xmind.ui.logic.left': 'Logic Chart (Left)',
      'org.xmind.ui.tree.right': 'Tree Chart (Right)',
      'org.xmind.ui.tree.left': 'Tree Chart (Left)',
      'org.xmind.ui.org-chart.down': 'Org Chart (Down)',
      'org.xmind.ui.org-chart.up': 'Org Chart (Up)',
      'org.xmind.ui.fishbone.leftHeaded': 'Fishbone (Left)',
      'org.xmind.ui.fishbone.rightHeaded': 'Fishbone (Right)',
      'org.xmind.ui.timeline.horizontal': 'Timeline (Horizontal)',
      'org.xmind.ui.timeline.vertical': 'Timeline (Vertical)',
      'org.xmind.ui.spreadsheet': 'Spreadsheet',
      'org.xmind.ui.brace.left': 'Brace (Left)',
      'org.xmind.ui.brace.right': 'Brace (Right)',
      'org.xmind.ui.treetable': 'Tree Table',
    },
  },
  suggestionEngine: {
    reasons: {
      noChildren: 'Root node has no children. Add main branches to start building the mind map',
      singleBranch: 'Only one main branch exists. Add more branches to enrich the structure',
      longContentNoChildren: (title) => `Node "${title}" has long content but no children. Consider breaking it into subtopics`,
      emptyNode: 'Empty nodes found. Add titles to complete the content',
      noNotesOnRoot: 'Add notes to the root node to document details',
      noMarkers: 'Use markers (priority, emoji) to highlight important nodes',
      noLabels: 'Use labels to categorize and filter nodes',
      deepNodes: (count) => `${count} nodes have depth超过4 levels. Consider restructuring`,
      foldNode: 'Fold node to simplify the view',
      addSibling: 'Add a sibling node',
      groupSelection: 'Group selected nodes under a parent node',
    },
    priorities: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
    categories: {
      structure: 'Structure',
      content: 'Content',
      organization: 'Organization',
      style: 'Style',
    },
    actions: {
      addSubTopic: 'Add Subtopic',
      addSiblingTopic: 'Add Sibling Topic',
      updateTitle: 'Update Title',
      addNotes: 'Add Notes',
      addMarker: 'Add Marker',
      addLabel: 'Add Label',
      restructure: 'Restructure',
      toggleFold: 'Toggle Fold',
      groupSelection: 'Group Selection',
    },
  },
  contextProvider: {
    document: {
      title: 'Title',
      nodeCount: 'Node Count',
      maxDepth: 'Max Depth',
      leafCount: 'Leaf Count',
      branchCount: 'Branch Count',
      structureType: 'Layout Type',
    },
    selection: {
      nodeIds: 'Selected Node IDs',
      titles: 'Selected Node Titles',
      count: 'Selection Count',
      types: 'Node Types',
      hasChildren: 'Has Children',
      parentTitles: 'Parent Titles',
    },
    statistics: {
      totalNodes: 'Total Nodes',
      nodesByType: 'Nodes by Type',
      nodesByDepth: 'Nodes by Depth',
      averageChildren: 'Average Children',
      maxChildrenNode: 'Node with Most Children',
      emptyNodes: 'Empty Nodes',
    },
  },
}

const jaJP: LocaleMessages = {
  stateDescriber: {
    rootTitle: (title) => `マインドマップ「${title}」`,
    layout: (type) => `レイアウト: ${type}`,
    mainBranches: (count, names) => `メインブランチ (${count}): ${names}`,
    statistics: (total, depth, leaves) => `合計 ${total} ノード、最大深度 ${depth}、${leaves} リーフノード`,
    selectedOne: (title) => `選択中: 「${title}」`,
    selectedMultiple: (count, titles) => `${count} ノード選択中: ${titles}`,
    nodeNotFound: (id) => `ノード ${id} が見つかりません`,
    nodeDescription: (title) => `「${title}」`,
    nodeType: (type) => `タイプ: ${type}`,
    nodePosition: (position) => `位置: ${position}`,
    childNodes: (count, names) => `子ノード (${count}): ${names}`,
    markers: (markers) => `マーカー: ${markers}`,
    labels: (labels) => `ラベル: ${labels}`,
    notes: (notes) => `メモ: ${notes}`,
    types: {
      root: 'ルート',
      attached: '子ノード',
      detached: 'フローティング',
      summary: 'サマリー',
      callout: 'コールアウト',
      unknown: '不明',
    },
    structures: {
      'org.xmind.ui.map': 'マインドマップ',
      'org.xmind.ui.logic.right': 'ロジックチャート（右）',
      'org.xmind.ui.logic.left': 'ロジックチャート（左）',
      'org.xmind.ui.tree.right': 'ツリーチャート（右）',
      'org.xmind.ui.tree.left': 'ツリーチャート（左）',
      'org.xmind.ui.org-chart.down': '組織図（下）',
      'org.xmind.ui.org-chart.up': '組織図（上）',
      'org.xmind.ui.fishbone.leftHeaded': '魚骨図（左）',
      'org.xmind.ui.fishbone.rightHeaded': '魚骨図（右）',
      'org.xmind.ui.timeline.horizontal': 'タイムライン（水平）',
      'org.xmind.ui.timeline.vertical': 'タイムライン（垂直）',
      'org.xmind.ui.spreadsheet': 'スプレッドシート',
      'org.xmind.ui.brace.left': 'ブレース（左）',
      'org.xmind.ui.brace.right': 'ブレース（右）',
      'org.xmind.ui.treetable': 'ツリーテーブル',
    },
  },
  suggestionEngine: {
    reasons: {
      noChildren: 'ルートノードに子ノードがありません。メインブランチを追加してマインドマップを開始してください',
      singleBranch: 'メインブランチが1つだけです。構造を豊かにするためにブランチを追加してください',
      longContentNoChildren: (title) => `ノード「${title}」は内容が多いですが子ノードがありません。サブトピックに分割することを検討してください`,
      emptyNode: '空のノードがあります。タイトルを追加して内容を完成させてください',
      noNotesOnRoot: 'ルートノードにメモを追加して詳細を記録してください',
      noMarkers: 'マーカー（優先度、絵文字）を使用して重要なノードを強調してください',
      noLabels: 'ラベルを使用してノードを分類・フィルタリングしてください',
      deepNodes: (count) => `${count} 個のノードが深度4を超えています。構造の再構築を検討してください`,
      foldNode: 'ノードを折りたたんでビューを簡素化',
      addSibling: '兄弟ノードを追加',
      groupSelection: '選択したノードを親ノードの下にグループ化',
    },
    priorities: {
      high: '高',
      medium: '中',
      low: '低',
    },
    categories: {
      structure: '構造',
      content: 'コンテンツ',
      organization: '整理',
      style: 'スタイル',
    },
    actions: {
      addSubTopic: 'サブトピック追加',
      addSiblingTopic: '兄弟トピック追加',
      updateTitle: 'タイトル更新',
      addNotes: 'メモ追加',
      addMarker: 'マーカー追加',
      addLabel: 'ラベル追加',
      restructure: '構造再構築',
      toggleFold: '折りたたみ切替',
      groupSelection: '選択をグループ化',
    },
  },
  contextProvider: {
    document: {
      title: 'タイトル',
      nodeCount: 'ノード数',
      maxDepth: '最大深度',
      leafCount: 'リーフ数',
      branchCount: 'ブランチ数',
      structureType: 'レイアウトタイプ',
    },
    selection: {
      nodeIds: '選択ノードID',
      titles: '選択ノードタイトル',
      count: '選択数',
      types: 'ノードタイプ',
      hasChildren: '子ノード有無',
      parentTitles: '親ノードタイトル',
    },
    statistics: {
      totalNodes: '総ノード数',
      nodesByType: 'タイプ別統計',
      nodesByDepth: '深度別統計',
      averageChildren: '平均子ノード数',
      maxChildrenNode: '最小子ノード',
      emptyNodes: '空ノード',
    },
  },
}

const koKR: LocaleMessages = {
  stateDescriber: {
    rootTitle: (title) => `마인드맵 "${title}"`,
    layout: (type) => `레이아웃: ${type}`,
    mainBranches: (count, names) => `주요 브랜치 (${count}): ${names}`,
    statistics: (total, depth, leaves) => `총 ${total} 노드, 최대 깊이 ${depth}, ${leaves} 리프 노드`,
    selectedOne: (title) => `선택됨: "${title}"`,
    selectedMultiple: (count, titles) => `${count} 노드 선택됨: ${titles}`,
    nodeNotFound: (id) => `노드 ${id}를 찾을 수 없습니다`,
    nodeDescription: (title) => `"${title}"`,
    nodeType: (type) => `유형: ${type}`,
    nodePosition: (position) => `위치: ${position}`,
    childNodes: (count, names) => `자식 노드 (${count}): ${names}`,
    markers: (markers) => `마커: ${markers}`,
    labels: (labels) => `라벨: ${labels}`,
    notes: (notes) => `메모: ${notes}`,
    types: {
      root: '루트',
      attached: '자식',
      detached: '플로팅',
      summary: '요약',
      callout: '콜아웃',
      unknown: '알 수 없음',
    },
    structures: {
      'org.xmind.ui.map': '마인드맵',
      'org.xmind.ui.logic.right': '로직 차트 (오른쪽)',
      'org.xmind.ui.logic.left': '로직 차트 (왼쪽)',
      'org.xmind.ui.tree.right': '트리 차트 (오른쪽)',
      'org.xmind.ui.tree.left': '트리 차트 (왼쪽)',
      'org.xmind.ui.org-chart.down': '조직도 (아래)',
      'org.xmind.ui.org-chart.up': '조직도 (위)',
      'org.xmind.ui.fishbone.leftHeaded': '피쉬본 (왼쪽)',
      'org.xmind.ui.fishbone.rightHeaded': '피쉬본 (오른쪽)',
      'org.xmind.ui.timeline.horizontal': '타임라인 (수평)',
      'org.xmind.ui.timeline.vertical': '타임라인 (수직)',
      'org.xmind.ui.spreadsheet': '스프레드시트',
      'org.xmind.ui.brace.left': '브레이스 (왼쪽)',
      'org.xmind.ui.brace.right': '브레이스 (오른쪽)',
      'org.xmind.ui.treetable': '트리 테이블',
    },
  },
  suggestionEngine: {
    reasons: {
      noChildren: '루트 노드에 자식 노드가 없습니다. 마인드맵을 시작하려면 주요 브랜치를 추가하세요',
      singleBranch: '주요 브랜치가 하나만 있습니다. 구조를 풍부하게 하려면 브랜치를 추가하세요',
      longContentNoChildren: (title) => `노드 "${title}"는 내용이 많지만 자식 노드가 없습니다. 서브토픽으로 분할을 고려하세요`,
      emptyNode: '빈 노드가 있습니다. 제목을 추가하여 내용을 완성하세요',
      noNotesOnRoot: '루트 노드에 메모를 추가하여 세부 정보를 기록하세요',
      noMarkers: '마커(우선순위, 이모지)를 사용하여 중요한 노드를 강조하세요',
      noLabels: '라벨을 사용하여 노드를 분류하고 필터링하세요',
      deepNodes: (count) => `${count}개의 노드가 깊이 4를 초과합니다. 구조 개편을 고려하세요`,
      foldNode: '노드를 접어 뷰를 단순화',
      addSibling: '형제 노드 추가',
      groupSelection: '선택한 노드를 부모 노드 아래에 그룹화',
    },
    priorities: {
      high: '높음',
      medium: '중간',
      low: '낮음',
    },
    categories: {
      structure: '구조',
      content: '내용',
      organization: '정리',
      style: '스타일',
    },
    actions: {
      addSubTopic: '서브토픽 추가',
      addSiblingTopic: '형제 토픽 추가',
      updateTitle: '제목 업데이트',
      addNotes: '메모 추가',
      addMarker: '마커 추가',
      addLabel: '라벨 추가',
      restructure: '구조 재편',
      toggleFold: '접기/펼치기',
      groupSelection: '선택 그룹화',
    },
  },
  contextProvider: {
    document: {
      title: '제목',
      nodeCount: '노드 수',
      maxDepth: '최대 깊이',
      leafCount: '리프 수',
      branchCount: '브랜치 수',
      structureType: '레이아웃 유형',
    },
    selection: {
      nodeIds: '선택 노드 ID',
      titles: '선택 노드 제목',
      count: '선택 수',
      types: '노드 유형',
      hasChildren: '자식 노드 유무',
      parentTitles: '부모 노드 제목',
    },
    statistics: {
      totalNodes: '총 노드 수',
      nodesByType: '유형별 통계',
      nodesByDepth: '깊이별 통계',
      averageChildren: '평균 자식 수',
      maxChildrenNode: '최대 자식 노드',
      emptyNodes: '빈 노드',
    },
  },
}

export const locales: Record<Locale, LocaleMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
  'ko-KR': koKR,
  'fr-FR': enUS,
  'de-DE': enUS,
  'es-ES': enUS,
}

export function getLocale(locale: Locale): LocaleMessages {
  return locales[locale] || locales['en-US']
}

export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en-US'
  const lang = navigator.language
  if (lang.startsWith('zh')) return 'zh-CN'
  if (lang.startsWith('ja')) return 'ja-JP'
  if (lang.startsWith('ko')) return 'ko-KR'
  if (lang.startsWith('fr')) return 'fr-FR'
  if (lang.startsWith('de')) return 'de-DE'
  if (lang.startsWith('es')) return 'es-ES'
  return 'en-US'
}

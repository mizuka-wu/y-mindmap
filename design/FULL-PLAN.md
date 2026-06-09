# 完整文档计划 & 实现计划

## 一、文档补充计划

### 需要创建的文档清单

| # | 文档名 | 优先级 | 预估行数 | 依赖 | 说明 |
|---|--------|--------|----------|------|------|
| 1 | RENDER.md | 🔴 P0 | 800-1000 | ARCHITECTURE.md | 渲染层详细设计 |
| 2 | LAYOUT-IMPL.md | 🔴 P0 | 1000-1200 | ALGORITHMS.md | 布局实现规范 |
| 3 | INTERACTION.md | 🔴 P0 | 800-1000 | PROSEMIRROR-ARCH.md | 交互层设计 |
| 4 | THEME.md | 🟡 P1 | 400-500 | RENDER.md | 主题系统设计 |
| 5 | IMPORT-EXPORT.md | 🟡 P1 | 500-600 | PROSEMIRROR-ARCH.md | 导入导出设计 |
| 6 | TESTING.md | 🟡 P1 | 400-500 | 无 | 测试策略 |
| 7 | PERFORMANCE.md | 🟢 P2 | 300-400 | RENDER.md, LAYOUT-IMPL.md | 性能优化 |
| 8 | PLUGIN-GUIDE.md | 🟢 P2 | 300-400 | PROSEMIRROR-ARCH.md | 插件开发指南 |
| 9 | SERIALIZATION.md | 🟡 P1 | 400-500 | PROSEMIRROR-ARCH.md | 序列化/反序列化 |
| 10 | COORDINATE.md | 🔴 P0 | 300-400 | RENDER.md | 坐标系统详细设计 |
| 11 | EDGE-CASES.md | 🟡 P1 | 300-400 | 无 | 边界情况处理 |
| 12 | API-REFERENCE.md | 🟢 P2 | 600-800 | 所有文档 | API 参考手册 |

**总计**: 约 6100-7800 行，12 个文档

---

### 文档 1: RENDER.md - 渲染层详细设计

**优先级**: 🔴 P0
**预估行数**: 800-1000
**依赖**: ARCHITECTURE.md
**创建顺序**: 第 1 个

#### 内容大纲

```
1. Leafer.js 集成规范
   1.1 引擎初始化配置
   1.2 图层管理策略
   1.3 事件系统集成
   1.4 生命周期管理

2. 节点渲染系统
   2.1 节点渲染架构
       - TopicView 类设计
       - 渲染管线 (Layout → Paint → Composite)
       - 脏标记系统
   
   2.2 基础形状渲染
       - Rect (矩形)
       - RoundedRect (圆角矩形)
       - Ellipse (椭圆)
       - Diamond (菱形)
       - Cloud (云朵)
       - Hexagon (六边形)
       - Parallelogram (平行四边形)
       - 各形状的 Canvas 绘制代码
   
   2.3 文字渲染
       - 文字测量
       - 自动换行算法
       - 文字对齐 (左/中/右)
       - 文字溢出处理 (省略号)
       - 多行文字布局
   
   2.4 图片渲染
       - 图片加载策略
       - 缩放模式 (contain/cover/fill)
       - 占位符渲染
       - 错误处理
   
   2.5 标记/图标渲染
       - 标记位置计算
       - 标记排列算法
       - 标记大小适配
   
   2.6 装饰器渲染
       - 选择框
       - 焦点指示器
       - 拖拽阴影
       - 高亮效果

3. 连线渲染系统
   3.1 连线渲染架构
       - ConnectionView 类设计
       - 连线路径生成管线
   
   3.2 连线样式实现
       - Curve (曲线) - 贝塞尔曲线实现
       - Straight (直线) - 直线实现
       - Elbow (肘线) - 折线实现
       - RoundedElbow (圆角肘线) - 圆角实现
       - Tapered (锥形) - 渐变宽度实现
       - 每种样式的 Canvas 绘制代码
   
   3.3 连线路径算法
       - 控制点计算
       - 路径平滑
       - 箭头绘制

4. 边界/摘要渲染
   4.1 边界渲染
       - 边界框绘制
       - 边界标题渲染
   
   4.2 摘要渲染
       - 摘要括号绘制
       - 摘要连线绘制

5. 坐标系统
   5.1 三个坐标空间
       - 本地坐标 (Local)
       - 世界坐标 (World)
       - 屏幕坐标 (Screen)
   
   5.2 坐标转换
       - localToWorld()
       - worldToScreen()
       - screenToWorld()
       - worldToLocal()
   
   5.3 矩阵变换
       - 平移矩阵
       - 缩放矩阵
       - 旋转矩阵
       - 矩阵乘法

6. 视口管理
   6.1 缩放
       - 缩放中心点
       - 缩放范围限制
       - 缩放动画
   
   6.2 平移
       - 拖拽平移
       - 边缘滚动
       - 惯性滚动
   
   6.3 适应内容
       - 计算内容边界
       - 计算最佳缩放
       - 平滑过渡动画

7. 性能优化
   7.1 脏标记系统
       - 布局脏标记
       - 绘制脏标记
       - 批量更新
   
   7.2 对象池
       - 节点复用
       - 连线复用
   
   7.3 离屏渲染
       - 缓存策略
       - 失效策略
```

---

### 文档 2: LAYOUT-IMPL.md - 布局实现规范

**优先级**: 🔴 P0
**预估行数**: 1000-1200
**依赖**: ALGORITHMS.md
**创建顺序**: 第 2 个

#### 内容大纲

```
1. LayoutEngine 接口
   1.1 核心接口定义
       - calculate(doc) → LayoutResult
       - calculateIncremental(doc, changes) → LayoutResult
       - getPreferredSize(node) → Size
   
   1.2 LayoutResult 数据结构
       - nodePositions: Map<id, Position>
       - connectionPaths: Map<id, PathData>
       - bounds: Bounds
   
   1.3 布局配置
       - 间距配置
       - 对齐配置
       - 方向配置

2. 公共布局工具
   2.1 子节点分组算法
       - 左右分组 (Map 布局)
       - 上下分组 (OrgChart 布局)
   
   2.2 间距计算
       - 最小间距
       - 动态间距
       - 边界间距
   
   2.3 对齐算法
       - 居中对齐
       - 起始对齐
       - 终止对齐

3. Map 布局实现
   3.1 平衡 Map 布局
       - 算法流程
       - 左右平衡计算
       - 子节点位置计算
       - 代码实现
   
   3.2 非平衡 Map 布局
       - 固定左右分配
       - 位置计算
   
   3.3 顺时针/逆时针 Map 布局
       - 方向处理
       - 位置计算
   
   3.4 浮动 Map 布局
       - 浮动节点处理
       - 碰撞避免

4. Tree 布局实现
   4.1 向右 Tree 布局
       - 算法流程
       - 缩进计算
       - 代码实现
   
   4.2 向左 Tree 布局
       - 镜像处理
   
   4.3 双侧 Tree 布局
       - 左右分配
       - 位置计算

5. Logic 布局实现
   5.1 向右 Logic 布局
       - 连线点计算
       - 位置计算
   
   5.2 向左 Logic 布局
   5.3 双侧 Logic 布局

6. OrgChart 布局实现
   6.1 向下 OrgChart 布局
       - 层级计算
       - 居中对齐
       - 代码实现
   
   6.2 向上 OrgChart 布局
   6.3 双侧 OrgChart 布局

7. Fishbone 布局实现
   7.1 左头 Fishbone 布局
       - 主骨绘制
       - 分支角度计算
       - 代码实现
   
   7.2 右头 Fishbone 布局

8. Timeline 布局实现
   8.1 水平 Timeline 布局
       - 时间线绘制
       - 节点排列
       - 代码实现
   
   8.2 垂直 Timeline 布局
   8.3 侧向 Timeline 布局

9. Spreadsheet 布局实现
   9.1 行 Spreadsheet 布局
       - 单元格计算
       - 行列对齐
   
   9.2 列 Spreadsheet 布局

10. Brace 布局实现
    10.1 左 Brace 布局
        - 括号绘制
        - 位置计算
    
    10.2 右 Brace 布局
    10.3 双侧 Brace 布局

11. TreeTable 布局实现
    11.1 TreeTable 布局
    11.2 顶标题 TreeTable 布局

12. 布局切换
    12.1 切换动画
        - 位置插值
        - 路径插值
        - 缓动函数
    
    12.2 切换策略
        - 即时切换
        - 渐变切换
        - 局部切换

13. 增量布局
    13.1 变更检测
        - 节点添加
        - 节点删除
        - 节点移动
        - 属性变更
    
    13.2 增量计算
        - 受影响节点识别
        - 局部重新布局
        - 结果合并

14. 布局缓存
    14.1 缓存策略
        - 缓存键生成
        - 缓存失效
        - 缓存大小限制
    
    14.2 预计算
        - 预测用户操作
        - 后台预计算
```

---

### 文档 3: INTERACTION.md - 交互层设计

**优先级**: 🔴 P0
**预估行数**: 800-1000
**依赖**: PROSEMIRROR-ARCH.md
**创建顺序**: 第 3 个

#### 内容大纲

```
1. 交互架构
   1.1 交互层职责
       - 用户输入处理
       - 交互状态管理
       - 命令触发
   
   1.2 事件流
       - DOM 事件 → 交互层 → Command → State → View
   
   1.3 交互状态机
       - 状态定义
       - 状态转换
       - 状态行为

2. 交互状态定义
   2.1 基础状态
       - Idle (空闲)
       - Selected (已选择)
       - Editing (编辑中)
       - Dragging (拖拽中)
       - Panning (平移中)
       - Zooming (缩放中)
       - BoxSelecting (框选中)
   
   2.2 状态属性
       - selectedNodes: Set<id>
       - editingNodeId: id | null
       - dragState: DragState | null
       - viewportState: ViewportState
   
   2.3 状态转换规则
       - Idle → Selected (点击)
       - Selected → Editing (双击)
       - Selected → Dragging (按下+移动)
       - Idle → Panning (中键按下+移动)
       - Idle → Zooming (滚轮)
       - Idle → BoxSelecting (空白处按下+移动)

3. 选择交互
   3.1 单选
       - 点击事件处理
       - 选择状态更新
       - 视觉反馈
   
   3.2 多选
       - Ctrl/Command + 点击
       - 选择集合管理
   
   3.3 范围选择
       - Shift + 点击
       - 范围计算算法
   
   3.4 框选
       - 框选矩形绘制
       - 碰撞检测
       - 实时更新
   
   3.5 键盘选择
       - 方向键导航
       - Shift + 方向键扩展选择
       - Ctrl + A 全选
   
   3.6 选择渲染
       - 选中状态样式
       - 焦点状态样式

4. 编辑交互
   4.1 进入编辑
       - 双击触发
       - Enter 触发
       - F2 触发
   
   4.2 文本编辑
       - 编辑框定位
       - 文本输入处理
       - 快捷键处理 (Enter/Escape/Tab)
   
   4.3 编辑完成
       - 确认编辑 (Enter)
       - 取消编辑 (Escape)
       - 点击其他位置确认
   
   4.4 编辑验证
       - 必填验证
       - 长度验证
       - 格式验证

5. 拖拽交互
   5.1 拖拽识别
       - 阈值检测 (5px)
       - 方向检测
       - 拖拽开始条件
   
   5.2 拖拽预览
       - 阴影创建
       - 阴影跟随
       - 透明度设置
   
   5.3 放置目标检测
       - 碰撞检测算法
       - 多边形区域计算
       - 优先级处理
   
   5.4 放置位置计算
       - 索引计算
       - 方向判断
       - 特殊情况处理
   
   5.5 放置执行
       - 节点移动
       - 索引更新
       - 动画过渡
   
   5.6 拖拽取消
       - ESC 取消
       - 无效区域释放
       - 状态恢复

6. 导航交互
   6.1 键盘导航
       - Tab: 添加子节点
       - Enter: 添加兄弟节点
       - Delete: 删除节点
       - 方向键: 移动焦点
   
   6.2 焦点管理
       - 焦点节点追踪
       - 焦点切换逻辑
       - 焦点可见性保证
   
   6.3 快捷键系统
       - 快捷键注册
       - 快捷键冲突处理
       - 平台适配 (Mac/Windows)

7. 视口交互
   7.1 缩放交互
       - 滚轮缩放
       - 手势缩放
       - 键盘缩放 (+/-)
       - 缩放中心点
       - 缩放范围限制
   
   7.2 平移交互
       - 拖拽平移
       - 边缘自动滚动
       - 惯性滚动
       - 键盘平移
   
   7.3 适应内容
       - 双击空白处适应
       - Ctrl+0 重置缩放
       - Ctrl+Shift+0 适应内容

8. 手势交互
   8.1 触摸手势
       - 单指拖拽
       - 双指缩放
       - 双指旋转 (可选)
   
   8.2 手势识别
       - 手势库集成
       - 手势冲突处理
   
   8.3 手势反馈
       - 视觉反馈
       - 触觉反馈 (可选)

9. 右键菜单
   9.1 菜单结构
       - 节点菜单
       - 空白菜单
       - 连线菜单
   
   9.2 菜单项
       - 复制/粘贴/删除
       - 添加子节点/兄弟节点
       - 折叠/展开
       - 设置样式
   
   9.3 菜单行为
       - 菜单定位
       - 菜单关闭
       - 快捷键显示

10. 拖放交互
    10.1 外部拖放
        - 文件拖放
        - 图片拖放
        - 文本拖放
    
    10.2 拖放处理
        - 拖放区域检测
        - 数据解析
        - 内容创建

11. 交互反馈
    11.1 视觉反馈
        - 悬停效果
        - 按下效果
        - 拖拽效果
        - 加载效果
    
    11.2 光标反馈
        - 默认光标
        - 拖拽光标
        - 编辑光标
        - 缩放光标
    
    11.3 动画反馈
        - 选择动画
        - 展开/折叠动画
        - 移动动画

12. 无障碍访问
    12.1 键盘导航
        - Tab 顺序
        - 焦点指示器
        - 快捷键
    
    12.2 屏幕阅读器
        - ARIA 标签
        - 语义化描述
    
    12.3 高对比度
        - 高对比度样式
        - 焦点可见性
```

---

### 文档 4: THEME.md - 主题系统设计

**优先级**: 🟡 P1
**预估行数**: 400-500
**依赖**: RENDER.md
**创建顺序**: 第 4 个

#### 内容大纲

```
1. 主题架构
   1.1 主题数据结构
   1.2 样式计算规则
   1.3 样式继承链

2. 样式属性定义
   2.1 节点样式
       - 形状、填充、边框、阴影
       - 字体、字号、字色
       - 内边距、圆角
   
   2.2 连线样式
       - 线型、线宽、线色
       - 箭头样式
   
   2.3 布局样式
       - 间距、对齐
       - 方向

3. 主题实现
   3.1 预置主题
   3.2 自定义主题
   3.3 主题切换

4. 样式计算
   4.1 默认样式
   4.2 主题样式覆盖
   4.3 用户样式覆盖
   4.4 样式合并算法
```

---

### 文档 5: IMPORT-EXPORT.md - 导入导出设计

**优先级**: 🟡 P1
**预估行数**: 500-600
**依赖**: PROSEMIRROR-ARCH.md
**创建顺序**: 第 5 个

#### 内容大纲

```
1. 数据格式定义
   1.1 内部数据格式
   1.2 格式转换接口

2. XMind 格式
   2.1 文件结构 (ZIP + JSON)
   2.2 解析流程
   2.3 生成流程
   2.4 样式映射

3. Markdown 格式
   3.1 语法规范
   3.2 解析流程
   3.3 生成流程
   3.4 缩进处理

4. OPML 格式
   4.1 XML 结构
   4.2 解析流程
   4.3 生成流程

5. 图片导出
   5.1 PNG 导出
   5.2 SVG 导出
   5.3 尺寸控制
```

---

### 文档 6: TESTING.md - 测试策略

**优先级**: 🟡 P1
**预估行数**: 400-500
**依赖**: 无
**创建顺序**: 第 6 个

#### 内容大纲

```
1. 测试策略
   1.1 测试金字塔
   1.2 测试覆盖率目标
   1.3 测试工具选择

2. 单元测试
   2.1 Model 层测试
   2.2 Transform 层测试
   2.3 算法测试

3. 集成测试
   3.1 State + View 测试
   3.2 Command 测试
   3.3 Plugin 测试

4. E2E 测试
   4.1 用户流程测试
   4.2 性能测试
   4.3 兼容性测试

5. 测试工具
   5.1 测试框架配置
   5.2 Mock 策略
   5.3 测试数据生成
```

---

### 文档 7: PERFORMANCE.md - 性能优化

**优先级**: 🟢 P2
**预估行数**: 300-400
**依赖**: RENDER.md, LAYOUT-IMPL.md
**创建顺序**: 第 7 个

#### 内容大纲

```
1. 性能分析
   1.1 性能瓶颈识别
   1.2 性能指标定义

2. 渲染优化
   2.1 虚拟渲染
   2.2 脏标记系统
   2.3 批量更新

3. 布局优化
   3.1 增量布局
   3.2 布局缓存
   3.3 异步布局

4. 内存优化
   4.1 对象池
   4.2 弱引用
   4.3 懒卸载

5. 网络优化
   5.1 资源懒加载
   5.2 预加载策略
```

---

### 文档 8: PLUGIN-GUIDE.md - 插件开发指南

**优先级**: 🟢 P2
**预估行数**: 300-400
**依赖**: PROSEMIRROR-ARCH.md
**创建顺序**: 第 8 个

#### 内容大纲

```
1. 插件架构
   1.1 插件接口
   1.2 插件生命周期
   1.3 插件注册

2. 插件类型
   2.1 State 插件
   2.2 View 插件
   2.3 Command 插件

3. 插件示例
   3.1 自动保存插件
   3.2 协同编辑插件
   3.3 小地图插件
   3.4 导出插件

4. 插件测试
   4.1 单元测试
   4.2 集成测试
```

---

### 文档 9: SERIALIZATION.md - 序列化/反序列化

**优先级**: 🟡 P1
**预估行数**: 400-500
**依赖**: PROSEMIRROR-ARCH.md
**创建顺序**: 第 9 个

#### 内容大纲

```
1. 序列化架构
   1.1 序列化接口
   1.2 反序列化接口
   1.3 版本兼容

2. JSON 序列化
   2.1 Node 序列化
   2.2 Fragment 序列化
   2.3 Mark 序列化
   2.4 Selection 序列化

3. 二进制序列化
   3.1 Protocol Buffers
   3.2 MessagePack
   3.3 自定义格式

4. 剪贴板序列化
   4.1 HTML 格式
   4.2 纯文本格式
   4.3 自定义格式

5. 版本迁移
   5.1 版本号管理
   5.2 数据迁移
   5.3 兼容性处理
```

---

### 文档 10: COORDINATE.md - 坐标系统详细设计

**优先级**: 🔴 P0
**预估行数**: 300-400
**依赖**: RENDER.md
**创建顺序**: 第 10 个

#### 内容大纲

```
1. 坐标空间定义
   1.1 本地坐标 (Local)
   1.2 世界坐标 (World)
   1.3 屏幕坐标 (Screen)
   1.4 视口坐标 (Viewport)

2. 坐标转换
   2.1 转换矩阵
   2.2 转换函数
   2.3 转换链

3. 矩阵变换
   3.1 平移矩阵
   3.2 缩放矩阵
   3.3 旋转矩阵
   3.4 矩阵乘法
   3.5 矩阵求逆

4. 位置计算
   4.1 节点位置
   4.2 连线位置
   4.3 锚点位置

5. 碰撞检测
   5.1 点在矩形内
   5.2 点在多边形内
   5.3 矩形相交
   5.4 凸包计算
```

---

### 文档 11: EDGE-CASES.md - 边界情况处理

**优先级**: 🟡 P1
**预估行数**: 300-400
**依赖**: 无
**创建顺序**: 第 11 个

#### 内容大纲

```
1. 数据边界
   1.1 空文档
   1.2 单节点文档
   1.3 超深文档
   1.4 超宽文档
   1.5 超长标题

2. 交互边界
   2.1 快速点击
   2.2 快速拖拽
   2.3 多点触控
   2.4 窗口失焦

3. 渲染边界
   3.1 超小缩放
   3.2 超大缩放
   3.3 超长连线
   3.4 重叠节点

4. 性能边界
   4.1 大量节点
   4.2 大量连线
   4.3 频繁更新
   4.4 内存溢出

5. 兼容性边界
   5.1 浏览器兼容
   5.2 移动端适配
   5.3 高 DPI 屏幕
   5.4 暗色模式
```

---

### 文档 12: API-REFERENCE.md - API 参考手册

**优先级**: 🟢 P2
**预估行数**: 600-800
**依赖**: 所有文档
**创建顺序**: 第 12 个

#### 内容大纲

```
1. Model API
   1.1 Schema
   1.2 MindMapNode
   1.3 Fragment
   1.4 Slice
   1.5 Mark
   1.6 ResolvedPos

2. State API
   2.1 EditorState
   2.2 Transaction
   2.3 Selection
   2.4 Plugin

3. Transform API
   3.1 Transform
   3.2 Step
   3.3 Mapping

4. View API
   4.1 EditorView
   4.2 Decoration

5. Command API
   5.1 Command 类型
   5.2 预定义命令

6. Plugin API
   6.1 Plugin 接口
   6.2 Plugin 状态

7. 工具 API
   7.1 坐标转换
   7.2 布局计算
   7.3 序列化
```

---

## 二、文档创建顺序和依赖关系

```
依赖关系图:

RENDER.md ─────────┬───→ THEME.md
    │              │
    │              └───→ PERFORMANCE.md
    │
    └───→ COORDINATE.md

LAYOUT-IMPL.md ────┬───→ PERFORMANCE.md
    │              │
    │              └───→ (无其他依赖)

INTERACTION.md ────→ (无其他依赖)

PROSEMIRROR-ARCH.md ─┬───→ IMPORT-EXPORT.md
    │                │
    │                ├───→ SERIALIZATION.md
    │                │
    │                └───→ PLUGIN-GUIDE.md

ALGORITHMS.md ────→ (无其他依赖)

TESTING.md ────────→ (无其他依赖)

EDGE-CASES.md ─────→ (无其他依赖)

API-REFERENCE.md ──→ (依赖所有文档)
```

### 推荐创建顺序

```
第一批 (并行创建):
  1. RENDER.md
  2. LAYOUT-IMPL.md
  3. INTERACTION.md
  4. COORDINATE.md

第二批 (依赖第一批):
  5. THEME.md
  6. SERIALIZATION.md
  7. EDGE-CASES.md

第三批 (依赖第二批):
  8. IMPORT-EXPORT.md
  9. TESTING.md

第四批 (依赖第三批):
  10. PERFORMANCE.md
  11. PLUGIN-GUIDE.md

最后:
  12. API-REFERENCE.md
```

---

## 三、完整实现计划

### Phase 0: 项目初始化 (1-2 天)

```
任务:
  [ ] 创建 monorepo 项目结构
  [ ] 配置 pnpm workspace
  [ ] 配置 turborepo
  [ ] 配置 TypeScript
  [ ] 配置 Vite
  [ ] 配置 ESLint + Prettier
  [ ] 创建各包的 package.json
  [ ] 创建共享的 tsconfig.json
  [ ] 创建 demo 应用

产出:
  - 可运行的空项目结构
  - 构建工具配置完成
  - 开发环境可用
```

### Phase 1: 核心 Model (3-5 天)

```
任务:
  [ ] 实现 Schema 系统
      - NodeType
      - MarkType
      - ContentMatch
      - Schema 编译
  
  [ ] 实现 MindMapNode
      - 不可变数据结构
      - 子节点操作
      - 标记操作
      - 序列化/反序列化
  
  [ ] 实现 Fragment
      - 子节点序列
      - 操作方法
  
  [ ] 实现 Slice
      - 文档片段
      - 剪贴板支持
  
  [ ] 实现 Mark
      - 标记数据
      - 标记集合操作
  
  [ ] 实现 ResolvedPos
      - 带上下文的位置
      - 路径信息
  
  [ ] 编写单元测试

产出:
  - @y-mindmap/model 包
  - 完整的单元测试
  - 文档更新
```

### Phase 2: 核心 State (3-5 天)

```
任务:
  [ ] 实现 Selection
      - NodeSelection
      - TextSelection
  
  [ ] 实现 Step 系统
      - Step 基类
      - ReplaceStep
      - AddMarkStep
      - RemoveMarkStep
      - MoveNodeStep
      - ChangeAttrStep
      - ToggleFoldStep
  
  [ ] 实现 Mapping
      - 位置映射
      - 映射组合
  
  [ ] 实现 Transform
      - 变换基类
      - 步骤组合
  
  [ ] 实现 Transaction
      - 继承 Transform
      - 选择管理
      - 元数据管理
  
  [ ] 实现 EditorState
      - 状态快照
      - 插件状态管理
  
  [ ] 实现 Plugin 系统
      - Plugin 接口
      - Plugin 状态
  
  [ ] 编写单元测试

产出:
  - @y-mindmap/state 包
  - @y-mindmap/transform 包
  - 完整的单元测试
  - 文档更新
```

### Phase 3: 核心 View (5-7 天)

```
任务:
  [ ] 实现 Leafer.js 集成
      - EditorView 基类
      - 视口管理
      - 坐标转换
  
  [ ] 实现节点渲染
      - 基础形状 (Rect, Ellipse, RoundedRect)
      - 文字渲染
      - 图片渲染
      - 标记渲染
  
  [ ] 实现连线渲染
      - 基础连线 (Curve, Elbow, Straight)
      - 路径生成算法
  
  [ ] 实现选择渲染
      - 选择框
      - 焦点指示器
  
  [ ] 实现装饰器
      - Decoration
      - DecorationSet
  
  [ ] 编写集成测试

产出:
  - @y-mindmap/view 包
  - 可渲染的基础思维导图
  - 集成测试
  - 文档更新
```

### Phase 4: 核心 Command (2-3 天)

```
任务:
  [ ] 实现基础命令
      - deleteSelection
      - selectAll
      - addSubTopic
      - addSiblingTopic
      - deleteTopic
  
  [ ] 实现命令链
      - chainCommands
      - 条件命令
  
  [ ] 实现快捷键映射
      - keymap 插件
      - 默认快捷键
  
  [ ] 编写集成测试

产出:
  - @y-mindmap/commands 包
  - @y-mindmap/keymap 包
  - 基础快捷键可用
  - 集成测试
  - 文档更新
```

### Phase 5: 核心 Layout (5-7 天)

```
任务:
  [ ] 实现 LayoutEngine 接口
  
  [ ] 实现 Map 布局
      - 平衡 Map
      - 非平衡 Map
      - 顺时针/逆时针
  
  [ ] 实现 Tree 布局
      - 向右 Tree
      - 向左 Tree
      - 双侧 Tree
  
  [ ] 实现 Logic 布局
      - 向右 Logic
      - 向左 Logic
      - 双侧 Logic
  
  [ ] 实现 OrgChart 布局
      - 向下 OrgChart
      - 向上 OrgChart
  
  [ ] 实现连线路径生成
  
  [ ] 编写单元测试

产出:
  - @y-mindmap/layout 包
  - 4 种布局可用
  - 单元测试
  - 文档更新
```

### Phase 6: 核心交互 (5-7 天)

```
任务:
  [ ] 实现选择交互
      - 点击选择
      - 多选
      - 框选
  
  [ ] 实现编辑交互
      - 双击编辑
      - 文本输入
  
  [ ] 实现拖拽交互
      - 拖拽识别
      - 拖拽预览
      - 放置检测
  
  [ ] 实现导航交互
      - 键盘导航
      - 焦点管理
  
  [ ] 实现视口交互
      - 缩放
      - 平移
      - 惯性滚动
  
  [ ] 编写 E2E 测试

产出:
  - @y-mindmap/interaction 包
  - 完整的交互可用
  - E2E 测试
  - 文档更新
```

### Phase 7: History (2-3 天)

```
任务:
  [ ] 实现 History 插件
      - 历史记录管理
      - 事务分组
  
  [ ] 实现 undo/redo 命令
  
  [ ] 编写集成测试

产出:
  - @y-mindmap/history 包
  - 撤销/重做可用
  - 集成测试
  - 文档更新
```

### Phase 8: 基础功能完成 (3-5 天)

```
任务:
  [ ] 实现折叠/展开
  [ ] 实现标记系统
  [ ] 实现标签系统
  [ ] 实现备注系统
  [ ] 实现图片系统
  [ ] 编写集成测试

产出:
  - 完整的基础功能
  - MVP 可用
  - 集成测试
  - 文档更新
```

### Phase 9: 主题系统 (2-3 天)

```
任务:
  [ ] 实现主题数据结构
  [ ] 实现样式计算
  [ ] 实现主题切换
  [ ] 实现预置主题
  [ ] 编写测试

产出:
  - @y-mindmap/theme 包
  - 主题切换可用
  - 测试
  - 文档更新
```

### Phase 10: 导入导出 (3-5 天)

```
任务:
  [ ] 实现 XMind 导入
  [ ] 实现 XMind 导出
  [ ] 实现 Markdown 导入
  [ ] 实现 Markdown 导出
  [ ] 实现 OPML 导入
  [ ] 实现 OPML 导出
  [ ] 实现图片导出
  [ ] 编写测试

产出:
  - @y-mindmap/import-export 包
  - 多格式支持
  - 测试
  - 文档更新
```

### Phase 11: 增强布局 (3-5 天)

```
任务:
  [ ] 实现 Fishbone 布局
  [ ] 实现 Timeline 布局
  [ ] 实现 Spreadsheet 布局
  [ ] 实现 Brace 布局
  [ ] 实现 TreeTable 布局
  [ ] 实现布局切换动画
  [ ] 编写测试

产出:
  - 完整的布局支持
  - 21 种布局可用
  - 测试
  - 文档更新
```

### Phase 12: 增强功能 (3-5 天)

```
任务:
  [ ] 实现关系线
  [ ] 实现边界
  [ ] 实现摘要
  [ ] 实现多选拖拽
  [ ] 实现复制粘贴
  [ ] 编写测试

产出:
  - 完整的思维导图功能
  - 测试
  - 文档更新
```

### Phase 13: 协同编辑 (5-7 天)

```
任务:
  [ ] 实现 Yjs 集成
  [ ] 实现 Collab 插件
  [ ] 实现冲突解决
  [ ] 实现离线支持
  [ ] 编写测试

产出:
  - @y-mindmap/collab 包
  - 协同编辑可用
  - 测试
  - 文档更新
```

### Phase 14: 性能优化 (3-5 天)

```
任务:
  [ ] 实现虚拟渲染
  [ ] 实现增量布局
  [ ] 实现布局缓存
  [ ] 实现对象池
  [ ] 性能测试和优化

产出:
  - 性能优化完成
  - 性能测试报告
  - 文档更新
```

### Phase 15: 插件系统 (2-3 天)

```
任务:
  [ ] 完善插件接口
  [ ] 实现插件示例
  [ ] 编写插件文档
  [ ] 编写测试

产出:
  - 插件系统可用
  - 插件示例
  - 文档
  - 测试
```

### Phase 16: 文档完善 (3-5 天)

```
任务:
  [ ] 完善所有文档
  [ ] 创建 API 参考手册
  [ ] 创建示例代码
  [ ] 创建教程

产出:
  - 完整的文档
  - API 参考
  - 示例代码
  - 教程
```

### Phase 17: 测试和发布 (3-5 天)

```
任务:
  [ ] 完善测试覆盖
  [ ] 性能测试
  [ ] 兼容性测试
  [ ] 修复 Bug
  [ ] 准备发布

产出:
  - 稳定的版本
  - 测试报告
  - 发布就绪
```

---

## 四、时间线总览

```
Week 1-2:   Phase 0-1 (项目初始化 + Model)
Week 3-4:   Phase 2-3 (State + View)
Week 5-6:   Phase 4-5 (Command + Layout)
Week 7-8:   Phase 6-7 (Interaction + History)
Week 9-10:  Phase 8-9 (基础功能 + 主题)
Week 11-12: Phase 10-11 (导入导出 + 增强布局)
Week 13-14: Phase 12-13 (增强功能 + 协同编辑)
Week 15-16: Phase 14-15 (性能优化 + 插件系统)
Week 17-18: Phase 16-17 (文档完善 + 测试发布)

总工期: 18-20 周 (4-5 个月)
```

---

## 五、资源需求

### 人力

| 角色 | 人数 | 职责 |
|------|------|------|
| 核心开发 | 1-2 | 架构设计、核心实现 |
| 前端开发 | 1-2 | 渲染层、交互层 |
| 测试工程师 | 1 | 测试策略、测试执行 |
| 技术文档 | 1 | 文档编写 |

### 技术栈

| 类别 | 技术 | 用途 |
|------|------|------|
| 语言 | TypeScript | 核心代码 |
| 渲染 | Leafer.js | Canvas 渲染 |
| 构建 | Vite | 开发构建 |
| 包管理 | pnpm | 依赖管理 |
| 测试 | Vitest | 单元测试 |
| E2E | Playwright | 端到端测试 |
| 协同 | Yjs | 协同编辑 |
| 文档 | VitePress | 文档站点 |

---

## 六、风险和缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| Leafer.js API 不熟悉 | 高 | 中 | 先写 Demo 验证 |
| 布局算法复杂 | 高 | 高 | 参考 Snowbrush，逐步实现 |
| 交互状态复杂 | 中 | 中 | 使用状态机 |
| 性能问题 | 中 | 中 | 早期性能测试 |
| 协同编辑复杂 | 高 | 高 | 使用 Yjs，参考 ProseMirror collab |
| 范围蔓延 | 高 | 中 | 严格 MVP 定义，分期交付 |

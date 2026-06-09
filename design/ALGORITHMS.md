# 子系统算法详解

> 所有算法均基于 Snowbrush 源代码逆向分析

---

## 1. 凸包算法 (Convex Hull)

**源码位置**: `/src/utils/pointutils.ts` → `convexHull()`

**用途**: 拖拽碰撞检测区域计算

**算法**: Andrew's Monotone Chain

```
输入: 点集 pointList
输出: 凸包顶点数组 (顺时针)

1. 按 x 坐标排序 (x 相同按 y)
2. 构建下凸壳: 从左到右遍历，维护栈，删除凹点
3. 构建上凸壳: 从右到左遍历，维护栈，删除凹点
4. 合并，去除重复端点
```

**判断凹点**: `removeMiddle(a, b, c)`
```
cross = (a.x - b.x) * (c.y - b.y) - (a.y - b.y) * (c.x - b.x)
dot = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y)
return cross < 0 || (cross === 0 && dot <= 0)
```
- cross < 0 → c 在 ab 右侧 (凹点)
- cross === 0 && dot <= 0 → 共线且 c 在 ab 之间

**时间复杂度**: O(n log n)

---

## 2. 点在多边形内判定 (Point in Polygon)

**源码位置**: `/src/utils/pointutils.ts` → `isPointInPolygon()`

**用途**: 拖拽时判断鼠标是否在某个分支的响应区域内

**算法**: 射线法 (Ray Casting)

```
输入: point (鼠标位置), polygonPoints (多边形顶点)
输出: boolean (是否在内部)

1. oddNodes = false
2. 遍历每条边 (i, j):
   - iPoint = polygonPoints[i]
   - jPoint = polygonPoints[j] (上一个点)
   - 如果边跨越水平线 y:
     - 计算交点 x 坐标: iPoint.x + ((y - iPoint.y) / (jPoint.y - iPoint.y)) * (jPoint.x - iPoint.x)
     - 如果交点在 point 左侧: oddNodes = !oddNodes
3. return oddNodes
```

**时间复杂度**: O(n)

---

## 3. Map 布局 - 左右平衡算法

**源码位置**: `/src/structures/basemap.ts` → `calcNumRight()`

**用途**: 决定哪些子节点放在右侧，哪些放在左侧

**算法**: 加权中点分割

```
输入: rootBranch (根节点)
输出: num (右侧子节点数量)

1. 计算总权重 totalWeight = Σ getWeight(child)
   - getWeight = boundaryBounds.height + (PADDING/2) * 3
2. halfWeight = totalWeight / 2
3. 遍历子节点，累加权重 rightWeight:
   - 如果当前累加 >= halfWeight:
     - 如果 lastIndex 存在 且 差值 > halfWeight - rightWeight:
       - 返回 lastIndex + 1
     - 否则返回当前 num
   - 如果不在同一 boundary/summary 范围内:
     - 更新 rightWeight，重置 blockWeight
4. 返回 index (所有子节点都在右侧)
```

**特殊处理**:
- `isInSameRangeWithLast()` → 同一 boundary/summary 范围内的节点不能被分割
- `isWithinThreshold()` → 小节点可以被放在任意一侧: `weight < (Math.log(length) + 1) * 200`

---

## 4. Map 布局 - 侧向位置计算

**源码位置**: `/src/structures/basemap.ts` → `calSidePos()`

**用途**: 计算某一侧所有子节点的精确位置

**算法**: 累积间距 + 对称校正

```
输入: { side, spacingMajor, spacingMinor, children, newBounds, isUpToDown, offsetX, offsetY }

1. 计算 yPosRelativeToFirstChild[] (相对第一个子节点的 Y 偏移):
   for each child[i]:
     yPosRelativeToFirstChild[i] = max(
       yPosRelativeToFirstChild[i-1] + pre.boundaryBounds.height + spacingMinor - now.boundaryBounds.y,
       yPosRelativeToFirstChild[i-1] + pre.topicView.bounds.height + sumTopicSpacing / (children.length - i) - now.topicView.bounds.y
     )

2. 计算 parentPosRelativeToFirstChild (父节点相对于第一个子节点的 Y 位置):
   parentPosRelativeToFirstChild = (firstChildEndPosY + yPosRelativeToFirstChild[0] + lastChildEndPosY + yPosRelativeToFirstChild[last]) / 2
   # 目的: 让最高和最低子节点的出线口相对于父节点水平中轴线对称

3. firstChildY = -parentPosRelativeToFirstChild

4. 计算 X 位置:
   - 左侧: x = newBounds.x - spacingMajor
   - 右侧: x = newBounds.x + newBounds.width + spacingMajor

5. 应用位置:
   for each child:
     posX = x + branch.topicView.bounds.x - maxOffset - offsetX  (左)
     posX = x - branch.topicView.bounds.x + maxOffset + offsetX  (右)
     posY = firstChildY + yPosRelativeToFirstChild[index] + offsetY

6. 对称校正 (isNeedRedolayout):
   - 如果子节点数 >= 3 且最大偏移 < 阈值:
     - 阈值 = min(30, childrenHeight * 0.15)
     - 将所有节点平移 posYoffsetToClosestChild
```

---

## 5. 拖拽目标索引计算

**源码位置**: `/src/utils/dragutils.ts` → `getTargetIndex()`

**用途**: 拖拽时计算节点应该插入的位置

**算法**: 坐标比较 + 方向感知

```
输入: targetBranchView, polygon, mouseRealPosition
输出: index (插入位置)

1. 获取 polygon.relatedBranchViewList (命中的子节点列表)
2. 如果列表为空:
   - Map 结构: 根据 side 返回 0 或 length
   - Fishbone: 根据 side 返回 0 或 length
   - 其他: 返回 0

3. 获取 rangeGrowthDirection (子节点增长方向)
4. 确定比较属性:
   - UP/DOWN → attrToCompare = "y"
   - LEFT/RIGHT → attrToCompare = "x"
5. 确定增长方向 ng:
   - DOWN/RIGHT → ng = 1
   - UP/LEFT → ng = -1

6. 获取所有子节点的位置信息 branchInfoList[]
7. 按 branchIndex 排序
8. 计算插入值: insertValue = mouseRealPosition[attrToCompare] * ng
9. 过滤掉位置不连续的节点 (处理平衡图边界情况)
10. 使用 getInsertIndex() 找到插入位置:
    - 遍历 existValueList，找到最后一个 < insertValue 的位置
    - 返回 index

11. 特殊处理 Fishbone: 如果是最后一个位置且有兄弟节点，index + 1
```

---

## 6. 拖拽阈值检测

**源码位置**: `/src/utils/dragutils.ts` → `dragThreshold()`

**用途**: 防止误触，只有移动超过阈值才开始拖拽

**算法**: 欧氏距离检测

```
阈值: DRAG_START_THRESHOLD = 5px

1. 记录按下位置 dragStartPosition
2. 监听 mousemove/touchmove
3. 计算距离: dx² + dy² >= threshold²
4. 超过阈值 → 触发 callback，移除监听
```

---

## 7. 拖拽区域多边形计算 (Map 结构)

**源码位置**: `/src/structures/basemap.ts` → `calcPolygons()`

**用途**: 为每个分支计算可接收拖拽的多边形区域

**算法**: 凸包合并

```
输入: branchView
输出: [{ points, pointList, relatedBranchViewList, side }]

1. 将子节点分为 leftChildrenList 和 rightChildrenList
   (根据 realPosition.x 与父节点的比较)

2. 计算左侧多边形:
   - basePoints = getPointsOfBase(branch)  # 父节点上下两点
   - 如果无子节点:
     - 添加 getPointsOfNoChildren(direction=LEFT)  # 虚拟连接线端点
   - 如果有子节点:
     - upToDownPoints = getPointsOfUDChildren(leftChildren, isLeft=true)
     - firstChildDownSide = getSidePointsWithGap(firstChild, DOWN)
     - lastChildUpSide = getSidePointsWithGap(lastChild, UP)
     - miniPoints = getPointsOfNoChildren(LEFT)
   - 凸包合并所有点

3. 计算右侧多边形 (类似)

4. 返回两个多边形，分别标记 side="left" 和 side="right"
```

**getSidePointsWithGap**: 在子节点指定方向上增加 30px 间距的两个点

**getPointsOfNoChildren**: 在虚拟连接线端点处生成两个点 (距离节点 bounds.width + 40px)

---

## 8. 浮动节点碰撞检测

**源码位置**: `/src/structures/helper/hitdetect.ts` → `HitDetectHelper.calcRealPosition()`

**用途**: 浮动节点放置时避免与其他节点重叠

**算法**: 递归排斥 (Iterative Separation)

```
输入: branchView, allBranchViewList
输出: { x, y } (不重叠的位置)

1. 获取所有已有节点的 realBoundsList
2. 计算当前节点的 boundsToTest (基于 model position)
3. 调用 _getFitRealBounds(testBounds, allBoundsList):

   _getFitRealBounds(testBounds, allBoundsList):
     a. 检查 testBounds 是否与任何 existingBounds 相交
     b. 如果不相交 → 返回 testBounds
     c. 如果相交:
        - 计算新位置: _calcNewTestRealBounds(testBounds, intersectBaseBounds)
          - 如果 testBounds.y < 0 (上方): 新 y = baseBounds.y - testBounds.height - 5
          - 否则: 新 y = baseBounds.y + baseBounds.height + 5
        - 递归调用 _getFitRealBounds(newTestBounds, allBoundsList)
```

---

## 9. 连线路径生成算法

**源码位置**: `/src/render/brushes.ts`

**用途**: 生成 SVG path 数据

### 9.1 曲线 (Curve)

```
curveHorizon({ startPt, ctrlPt, endPt }):
  dx = endPt.x - ctrlPt.x
  ctrlX = dx / 5 + ctrlPt.x
  path = "M {startPt} L {ctrlPt} Q {ctrlX},{endPt.y} {endPt.x},{endPt.y}"
  # M → 直线到 ctrlPt → 二次贝塞尔曲线到 endPt
```

### 9.2 肘线 (Elbow)

```
elbowHorizon({ startPt, ctrlPt, endPt }):
  path = "M {startPt} L {ctrlPt} L {ctrlPt.x},{endPt.y} L {endPt}"
  # 直线 → 水平 → 垂直 → 直线

elbowVertical({ startPt, ctrlPt, endPt }):
  path = "M {startPt} L {ctrlPt} L {endPt.x},{ctrlPt.y} L {endPt}"
  # 直线 → 垂直 → 水平 → 直线
```

### 9.3 圆角肘线 (Rounded Elbow)

```
roundedElbowHorizon({ startPt, ctrlPt, endPt }, corner):
  flexPt = { x: ctrlPt.x, y: endPt.y }  # 拐点
  corner = min(corner, abs(endPt.x - ctrlPt.x))
  bflexPt = { x: flexPt.x, y: flexPt.y - ver * corner }  # 拐点前
  aflexPt = { x: flexPt.x + hor * corner, y: flexPt.y }   # 拐点后
  path = "M ... L {bflexPt} Q {flexPt} {aflexPt} L {endPt}"
  # 直线 → 圆角二次贝塞尔 → 直线
```

### 9.4 锥形线 (Tapered)

```
taperedCurveHorizon({ startPt, ctrlPt, endPt }, lineWidth):
  openGap = lineWidth * 3   # 起始宽度
  closeGap = lineWidth       # 终止宽度
  
  # 计算上下两条偏移线
  p1 = calcUnderline(startPt, ctrlPt, openGap/2)   # 起始上侧
  p2 = calcUnderline(ctrlPt, endPt, openGap/2)     # 中间上侧
  p4 = calcUnderline(endPt, ctrlPt, closeGap/2)    # 终止上侧
  p3 = pivot(endPt, p4)                             # 终止下侧 (镜像)
  p5 = pivot(ctrlPt, p2)                            # 中间下侧
  p6 = pivot(startPt, p1)                           # 起始下侧
  
  path = "M p1 L p2 Q ctrlX p3 L p4 Q ctrlX p5 L p6 Z"
  # 封闭路径，形成渐变宽度的连线
```

---

## 10. 坐标转换算法

**源码位置**: `/src/view/helper/coordinate-transfer.ts`

**用途**: 三个坐标空间之间的转换

### 坐标空间

| 空间 | 原点 | 说明 |
|------|------|------|
| Viewport | 窗口左上角 | 屏幕坐标 |
| VisibleArea | 可见区域左上角 | 滚动感知 |
| MindMap | 中央节点中心 | 逻辑坐标 |

### 转换公式

```
mindMapToViewport(p):
  origin = mindMapOriginPositionInViewport
  scale = mindMapScale
  return { x: p.x * scale + origin.x, y: p.y * scale + origin.y }

viewportToMindMap(p):
  origin = mindMapOriginPositionInViewport
  scale = mindMapScale
  return { x: (p.x - origin.x) / scale, y: (p.y - origin.y) / scale }

mindMapToVisibleArea(p):
  origin = mindMapOriginPositionInVisibleArea
  scale = mindMapScale
  return { x: p.x * scale + origin.x, y: p.y * scale + origin.y }

visibleAreaToMindMap(p):
  origin = mindMapOriginPositionInVisibleArea
  scale = mindMapScale
  return { x: (p.x - origin.x) / scale, y: (p.y - origin.y) / scale }
```

**链式转换**: `visibleAreaToViewport(p) = mindMapToViewport(visibleAreaToMindMap(p))`

---

## 11. 惯性滚动算法

**源码位置**: `/src/utils/interialpanning.ts`

**用途**: 松手后继续滚动，逐渐减速

**算法**: 速度衰减模型

```
状态:
  posArr[6]     - 最近 6 个位置
  timestampArr[6] - 对应时间戳
  friction = -0.005

auto(cb):
  1. 计算速度:
     deltaX = posArr[last].x - posArr[0].x
     deltaY = posArr[last].y - posArr[0].y
     deltaT = timestampArr[last] - timestampArr[0]
     vX = abs(deltaX) / deltaT
     vY = abs(deltaY) / deltaT
     dirX = deltaX > 0 ? 1 : -1
     dirY = deltaY > 0 ? 1 : -1

  2. 启动惯性循环 _inertia():
     requestAnimationFrame:
       deltaT = now - lastTime
       vX += friction * deltaT    # 速度衰减
       vY += friction * deltaT
       if vX > 0:
         deltaPosX = dirX * vX * deltaT
         stopped = false
       if vY > 0:
         deltaPosY = dirY * vY * deltaT
         stopped = false
       cb(deltaPosX, deltaPosY)
       if !stopped: 继续循环
```

**物理模型**: v(t) = v₀ + friction × t
- friction < 0 → 减速
- v <= 0 → 停止

---

## 12. 鼠标边缘自动滚动

**源码位置**: `/src/modules/moveviewport.ts` → `showMouseInViewPort()`

**用途**: 拖拽时鼠标靠近视口边缘，自动滚动

**算法**: 方向检测 + rAF 循环

```
1. 检测方向 getMouseOutOfViewPortDirection():
   - 鼠标距离边缘 < 20px → 对应方向为 true
   - up: mousePos.y < minY + 20
   - down: mousePos.y > maxY - 20
   - left: mousePos.x < minX + 20
   - right: mousePos.x > maxX - 20

2. 如果在触发区域内:
   - 如果不在滚动中 → startShowMouseInViewPortProcess()
   - 如果方向改变 → stop + restart

3. startShowMouseInViewPortProcess():
   requestAnimationFrame loop:
     moveSpeed = 5 / deviceNativeScale
     if up: moveY += moveSpeed
     if down: moveY -= moveSpeed
     if left: moveX += moveSpeed
     if right: moveX -= moveSpeed
     svgView.move(moveX, moveY)
     if still in process: continue loop
```

---

## 13. 小地图坐标转换

**源码位置**: `/src/modules/minimap.ts` → `helper`

**用途**: 小地图和主视口之间的坐标映射

```
miniDeltaToMindMapDelta({ deltaX, deltaY }, miniMapScale, mindMapScale):
  return {
    deltaX: deltaX * mindMapScale / miniMapScale,
    deltaY: deltaY * mindMapScale / miniMapScale
  }

mindDeltaToMiniMapDelta({ deltaX, deltaY }, miniMapScale, mindMapScale):
  return {
    deltaX: deltaX * miniMapScale / mindMapScale,
    deltaY: deltaY * miniMapScale / mindMapScale
  }
```

**viewBox 尺寸计算**:
```
finalScale = miniMapScale / mindMapScale
viewBoxWidth = abs(finalScale * visibleAreaWidth)
viewBoxHeight = abs(finalScale * visibleAreaHeight)
viewBoxX = containerWidth/2 - finalScale * currentTopBranchSCPositionX
viewBoxY = containerHeight/2 - finalScale * currentTopBranchSCPositionY

# 边界约束 (保持 8px padding):
if viewBoxX < 8: viewBoxWidth -= (8 - viewBoxX); viewBoxX = 8
if viewBoxX + viewBoxWidth > containerWidth - 8: viewBoxWidth -= overflow
# ... 类似处理 Y
```

---

## 14. 缩放动画

**源码位置**: `/src/view/helper/canvascontrol.ts` → `_scroll()`

**用途**: 平滑缩放/滚动动画

**算法**: easeOut 缓动

```
_scroll(x, y, { animate }):
  if !animate:
    scrollLeft = lastScrollLeft - x
    scrollTop = lastScrollTop - y
    return
  
  # 动画模式
  startScrollTop = lastScrollTop
  startScrollLeft = lastScrollLeft
  ratio = 0
  
  requestAnimationFrame loop:
    ratio += 1/20    # 20 帧完成
    if ratio >= 1: ratio = 1; isEnd = true
    
    r = Math.sqrt(ratio * 2 - ratio * ratio)  # easeOut
    cx = x * r
    cy = y * r
    scrollTop = startScrollTop - cy
    scrollLeft = startScrollLeft - cx
    
    if !isEnd: continue loop
```

**easeOut 公式**: `r = sqrt(2t - t²)`
- t=0 → r=0
- t=0.5 → r≈0.87
- t=1 → r=1

---

## 15. 撤销分组算法

**源码位置**: `/src/common/undo.ts`

**用途**: 自动将连续操作合并为一组

**算法**: setTimeout 延迟重置

```
push(task):
  if !standbyGroup:
    standbyGroup = _autoStandbyGroup()
  standbyGroup.push(task)

_autoStandbyGroup():
  clearTimeout(TIMEOUT_ID)
  TIMEOUT_ID = setTimeout(() => {
    if !allInOne:
      _resetStandbyGroup()  # 下一个事件循环重置
  }, 0)
  return _genNewGroup(DEFAULT_GROUP_NAME)
```

**效果**:
- 同步连续的 push() 调用会使用同一个 group
- 事件循环结束后，下一批操作会创建新 group
- `keepAllInOne(true)` 可以禁止自动分组 (拖拽时使用)

**Group 执行**:
```
undo(): 逆序执行 tasks
redo(): 顺序执行 tasks
```

---

## 16. Range 工具算法

**源码位置**: `/src/utils/rangeutils.ts`

**用途**: Boundary/Summary 的范围管理

### indexArrToRangeArr: 索引数组 → 范围数组

```
[1,2,3,7,8,10] → [[1,3], [7,8], [10,10]]

1. 排序
2. 遍历，如果 cur - low === 1 → 扩展当前 range
3. 否则 → 保存当前 range，开始新 range
```

### isSubRange: 子范围判定

```
isSubRange(master, x):
  return master[0] <= x[0] && master[1] >= x[1]
```

---

## 17. 信号量 (Semaphore) 算法

**源码位置**: `/src/modules/semaphore.ts`

**用途**: UI 状态的引用计数管理

```
increase(status):
  count = semaphoreMap[status]
  semaphoreMap[status] = count + 1
  if count === 0:  # 从 0 → 1，状态激活
    trigger(AFTER_UI_STATUS_ACTIVATE)

decrease(status):
  count = semaphoreMap[status]
  semaphoreMap[status] = max(0, count - 1)
  if count - 1 === 0:  # 从 1 → 0，状态失活
    trigger(AFTER_UI_STATUS_DEACTIVATE)

isStatusActive(status):
  return semaphoreMap[status] > 0

onceNotInStatus(statusArr, fn):
  if all statuses are 0: fn()
  else: listen AFTER_UI_STATUS_DEACTIVATE, check again
```

---

## 18. 节点序列化 (复制粘贴)

**源码位置**: `/src/modules/copypaste/copytopicprocessor.ts` + `cputil.ts`

**用途**: 将节点树序列化为可粘贴的数据

**算法**: 递归 JSON 序列化 + ID 替换

```
复制:
  1. CopyTopicProcessor.generateData()
     - 遍历选中的 branchView
     - 递归收集 topic/relationship/boundary/summary
  2. cpUtil.serializeBranchToString(topicData)
     - 生成纯文本表示

粘贴:
  1. mommonFuncs.replaceId(jsonData, UUID)
     - 递归遍历 JSON，替换所有 id 字段
     - 返回 { oldId → newId } 映射
  2. parseTopic(jsonData, sheetModel)
     - 反序列化为 TopicModel
  3. 处理 boundary/summary:
     - 使用 replaceIdMap 更新 range 中的 startId/endId
     - 重新计算 range: (startIndex, endIndex)
  4. 处理 relationship:
     - 使用 replaceIdMap 更新 end1Id/end2Id
```

---

## 19. 布局间距优化

**源码位置**: `/src/structures/helper/layoutstyleoptimization.ts` → `calcOutwardDistanceByAttachedChildren()`

**用途**: 当子节点过多时，增加父节点与子节点之间的间距

**算法**: 线性插值

```
条件 (全部满足才生效):
  - 非紧凑布局模式
  - Map/Logic/OrgChart 结构
  - 子节点数 >= 8 (Map/Logic) 或 >= 7 (OrgChart)
  - 非 Elbow 连线样式

计算:
  K = 0.15 (垂直结构) 或 0.09 (水平结构)
  MIN = 400 (垂直) 或 1000 (水平)
  MAX = 800 (垂直) 或 1600 (水平)
  
  totalHeight = Σ child.boundaryBounds.height
  
  if totalHeight <= MIN:
    return 0
  else:
    return K * (min(totalHeight, MAX) - MIN)
```

---

## 20. 事件冒泡算法

**源码位置**: `/src/uievents/events.ts` → `UiEventsManager.dispatch()`

**用途**: 从事件目标向上冒泡，找到对应的 view 并分发事件

**算法**: DOM 冒泡 + 类型匹配

```
dispatch(e):
  rootElem = e.currentTarget
  curElem = getEventTarget(e, rootElem)  # 多点触控时取 LCA
  
  while curElem && curElem !== rootElem:
    if !curElem.sbView || curElem.sbView.figure.isDisposed():
      curElem = curElem.parentNode
      continue
    
    view = curElem.sbView
    selectors = view.getTypeList()  # 获取 view 的类型列表
    
    # 分发事件
    isPropagationStopped = events.dispatch(SBEventCreator(e), selectors, view)
    
    if isPropagationStopped: break
    
    curElem = view.getNextEventTarget(curElem)  # 允许 view 自定义下一个目标
```

**多点触控目标计算**:
```
getEventTarget(e, root):
  if pointers.length <= 1: return e.target
  
  # 取所有触控点的 LCA (最近公共祖先)
  paths = pointers.map(p => getPath(p.target, root))
  return getLCA(paths)
```

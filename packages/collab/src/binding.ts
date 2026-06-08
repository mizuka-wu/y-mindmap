import * as Y from 'yjs'
import { TopicData, StyleData } from '@y-mindmap/core'
import { Awareness } from 'y-protocols/awareness'
import { CollaboratorManager, CollaboratorState, CollaboratorUser, LockConflict, ActivityType, createCollaboratorState } from './collaborator'

export interface YDocBinding {
  doc: Y.Doc
  awareness: Awareness
  collaborators: CollaboratorManager
  destroy: () => void
}

export { CollaboratorManager, createCollaboratorState }
export type { CollaboratorState, CollaboratorUser, LockConflict, ActivityType }

export function topicDataToYMap(data: TopicData): Y.Map<any> {
  const map = new Y.Map()

  map.set('id', data.id)
  map.set('title', data.title)
  map.set('type', data.type)

  if (data.style) {
    const styleMap = new Y.Map()
    for (const [key, value] of Object.entries(data.style.properties || {})) {
      styleMap.set(key, value)
    }
    map.set('style', styleMap)
  }

  if (data.markers) {
    const markersArray = new Y.Array()
    for (const marker of data.markers) {
      const markerMap = new Y.Map()
      markerMap.set('markerId', marker.markerId)
      if (marker.groupId) markerMap.set('groupId', marker.groupId)
      markersArray.push([markerMap])
    }
    map.set('markers', markersArray)
  }

  if (data.labels) {
    const labelsArray = new Y.Array()
    labelsArray.push(data.labels)
    map.set('labels', labelsArray)
  }

  if (data.children) {
    const childrenMap = new Y.Map()
    for (const [type, children] of Object.entries(data.children)) {
      const childrenArray = new Y.Array()
      for (const child of children) {
        const childMap = topicDataToYMap(child)
        childrenArray.push([childMap])
      }
      childrenMap.set(type, childrenArray)
    }
    map.set('children', childrenMap)
  }

  return map
}

export function yMapToTopicData(map: Y.Map<any>): TopicData {
  const data: TopicData = {
    id: map.get('id'),
    title: map.get('title'),
    type: map.get('type'),
  }

  const styleMap = map.get('style')
  if (styleMap) {
    const properties: Record<string, any> = {}
    styleMap.forEach((value: any, key: string) => {
      properties[key] = value
    })
    data.style = { id: 'imported', properties }
  }

  const markersArray = map.get('markers')
  if (markersArray) {
    data.markers = markersArray.map((markerMap: Y.Map<any>) => ({
      markerId: markerMap.get('markerId'),
      groupId: markerMap.get('groupId'),
    }))
  }

  const labelsArray = map.get('labels')
  if (labelsArray) {
    data.labels = labelsArray.toArray()
  }

  const childrenMap = map.get('children')
  if (childrenMap) {
    data.children = {}
    childrenMap.forEach((childrenArray: Y.Array<Y.Map<any>>, type: string) => {
      data.children![type] = childrenArray.map((childMap: Y.Map<any>) =>
        yMapToTopicData(childMap)
      )
    })
  }

  return data
}

export function createYDocBinding(
  ydoc: Y.Doc,
  user: CollaboratorUser
): YDocBinding {
  const awareness = new Awareness(ydoc)
  const collaborators = new CollaboratorManager(awareness, user.id)

  const initialState = createCollaboratorState(user)
  awareness.setLocalState(initialState)

  const destroy = () => {
    collaborators.destroy()
    awareness.destroy()
  }

  return { doc: ydoc, awareness, collaborators, destroy }
}

export function syncTopicToY(ydoc: Y.Doc, topic: TopicData): void {
  const nodes = ydoc.getMap<Y.Map<any>>('nodes')
  const rootId = ydoc.getText('rootId')

  rootId.delete(0, rootId.length)
  rootId.insert(0, topic.id)

  nodes.clear()

  const syncNode = (node: TopicData) => {
    const yMap = topicDataToYMap(node)
    nodes.set(node.id, yMap)

    if (node.children) {
      for (const children of Object.values(node.children)) {
        for (const child of children) {
          syncNode(child)
        }
      }
    }
  }

  syncNode(topic)
}

export function syncYToTopic(ydoc: Y.Doc): TopicData | null {
  const nodes = ydoc.getMap<Y.Map<any>>('nodes')
  const rootId = ydoc.getText('rootId')

  const root = rootId.toString()
  if (!root) return null

  const rootMap = nodes.get(root)
  if (!rootMap) return null

  return yMapToTopicData(rootMap)
}

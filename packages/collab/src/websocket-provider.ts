import * as Y from 'yjs'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'
import { CollabAwareness } from './awareness'

export interface WebSocketProviderOptions {
  url: string
  room: string
  user: { name: string; color: string }
  connect?: boolean
  resyncInterval?: number
  maxRetries?: number
}

export class WebSocketProvider {
  private doc: Y.Doc
  private awareness: CollabAwareness
  private ws: WebSocket | null = null
  private url: string
  private room: string
  private connected: boolean = false
  private synced: boolean = false
  private retryCount: number = 0
  private maxRetries: number
  private retryTimeout: ReturnType<typeof setTimeout> | null = null
  private resyncInterval: ReturnType<typeof setInterval> | null = null
  private resyncIntervalTime: number

  private onSyncCallback: (() => void) | null = null
  private onConnectionChangeCallback: ((connected: boolean) => void) | null = null
  private onErrorCallback: ((error: Event) => void) | null = null

  constructor(doc: Y.Doc, awareness: CollabAwareness, options: WebSocketProviderOptions) {
    this.doc = doc
    this.awareness = awareness
    this.url = options.url
    this.room = options.room
    this.maxRetries = options.maxRetries || 10
    this.resyncIntervalTime = options.resyncInterval || 5000

    if (options.connect !== false) {
      this.connect()
    }
  }

  connect(): void {
    if (this.ws) {
      this.ws.close()
    }

    const wsUrl = `${this.url}/${this.room}`
    this.ws = new WebSocket(wsUrl)
    this.ws.binaryType = 'arraybuffer'

    this.ws.onopen = () => {
      this.connected = true
      this.retryCount = 0
      this.onConnectionChangeCallback?.(true)

      const encoder = encoding.createEncoder()
      syncProtocol.writeSyncStep1(encoder, this.doc)
      this.ws!.send(encoding.toUint8Array(encoder))

      this.awareness.awareness.setLocalStateField('timestamp', Date.now())
    }

    this.ws.onmessage = (event) => {
      const message = new Uint8Array(event.data)
      this.handleMessage(message)
    }

    this.ws.onclose = () => {
      this.connected = false
      this.synced = false
      this.onConnectionChangeCallback?.(false)

      if (this.retryCount < this.maxRetries) {
        this.retryCount++
        const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000)
        this.retryTimeout = setTimeout(() => this.connect(), delay)
      }
    }

    this.ws.onerror = (event) => {
      this.onErrorCallback?.(event)
    }

    this.startResync()
  }

  private handleMessage(message: Uint8Array): void {
    const decoder = decoding.createDecoder(message)
    const messageType = decoding.readVarUint(decoder)

    switch (messageType) {
      case syncProtocol.messageYjsSyncStep1:
        this.handleSyncStep1(decoder)
        break
      case syncProtocol.messageYjsSyncStep2:
        this.handleSyncStep2(decoder)
        break
      case syncProtocol.messageYjsUpdate:
        this.handleUpdate(decoder)
        break
      case 3: // awareness message type
        this.handleAwareness(decoder)
        break
    }
  }

  private handleSyncStep1(decoder: decoding.Decoder): void {
    const encoder = encoding.createEncoder()
    syncProtocol.writeSyncStep2(encoder, this.doc, decoding.readVarUint8Array(decoder))
    this.send(encoding.toUint8Array(encoder))
  }

  private handleSyncStep2(decoder: decoding.Decoder): void {
    syncProtocol.readSyncStep2(decoder, this.doc, 'websocket-provider')
    if (!this.synced) {
      this.synced = true
      this.onSyncCallback?.()
    }
  }

  private handleUpdate(decoder: decoding.Decoder): void {
    const update = decoding.readVarUint8Array(decoder)
    Y.applyUpdate(this.doc, update, 'websocket-provider')
  }

  private handleAwareness(decoder: decoding.Decoder): void {
    awarenessProtocol.applyAwarenessUpdate(
      this.awareness.awareness,
      decoding.readVarUint8Array(decoder),
      'websocket-provider'
    )
  }

  private send(data: Uint8Array): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    }
  }

  private startResync(): void {
    this.resyncInterval = setInterval(() => {
      if (this.connected) {
        const encoder = encoding.createEncoder()
        syncProtocol.writeSyncStep1(encoder, this.doc)
        this.send(encoding.toUint8Array(encoder))
      }
    }, this.resyncIntervalTime)
  }

  onSync(callback: () => void): void {
    this.onSyncCallback = callback
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.onConnectionChangeCallback = callback
  }

  onError(callback: (error: Event) => void): void {
    this.onErrorCallback = callback
  }

  get isConnected(): boolean {
    return this.connected
  }

  get isSynced(): boolean {
    return this.synced
  }

  disconnect(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = null
    }

    if (this.resyncInterval) {
      clearInterval(this.resyncInterval)
      this.resyncInterval = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.connected = false
    this.synced = false
  }

  destroy(): void {
    this.disconnect()
    this.awareness.destroy()
  }
}

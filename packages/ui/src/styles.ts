export const STYLES = `
.y-mindmap-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
}

.y-mindmap-editor-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.y-mindmap-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  gap: 8px;
  user-select: none;
  flex-shrink: 0;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #d0d0d0;
  margin: 0 4px;
}

.toolbar-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.toolbar-button:hover {
  background: #e8e8e8;
  border-color: #d0d0d0;
}

.toolbar-button:active {
  background: #d8d8d8;
}

.toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-button.active {
  background: #e0e0ff;
  border-color: #4A90D9;
}

.toolbar-select {
  padding: 6px 8px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  outline: none;
}

.toolbar-select:hover {
  border-color: #4A90D9;
}

.toolbar-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.y-mindmap-context-menu {
  position: fixed;
  min-width: 180px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  z-index: 1000;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  gap: 8px;
  transition: background 0.15s ease;
}

.menu-item:hover {
  background: #f0f0f0;
}

.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.menu-label {
  flex: 1;
  font-size: 13px;
}

.menu-shortcut {
  font-size: 12px;
  color: #999;
}

.menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}

.y-mindmap-panel-container {
  position: absolute;
  top: 0;
  right: 0;
  width: 280px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
  z-index: 10;
}

.y-mindmap-property-panel {
  padding: 12px;
}

.panel-section {
  margin-bottom: 16px;
}

.panel-section h3 {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin: 0 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid #e0e0e0;
}

.panel-field {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.panel-field label {
  font-size: 13px;
  color: #333;
  min-width: 60px;
}

.panel-field input,
.panel-field select,
.panel-field textarea {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease;
}

.panel-field input:focus,
.panel-field select:focus,
.panel-field textarea:focus {
  border-color: #4A90D9;
}

.panel-field input[type="color"] {
  width: 40px;
  height: 32px;
  padding: 2px;
  cursor: pointer;
}

.panel-field input[type="number"] {
  width: 80px;
}

.panel-empty {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.note-content {
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 13px;
  color: #333;
  white-space: pre-wrap;
}

.marker-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.marker-item {
  font-size: 16px;
  cursor: default;
}

.y-mindmap-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #666;
  user-select: none;
  flex-shrink: 0;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.y-mindmap-minimap-container {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 10;
}

.y-mindmap-minimap {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.y-mindmap-minimap:hover {
  border-color: #4A90D9;
}

.inline-editor {
  position: fixed;
  z-index: 10000;
  padding: 8px;
  border: 2px solid #4A90D9;
  border-radius: 4px;
  outline: none;
  resize: none;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
  background: #fff;
}

.box-select {
  position: fixed;
  border: 1px dashed #4A90D9;
  background: rgba(74, 144, 217, 0.1);
  pointer-events: none;
  z-index: 100;
}

.drag-preview {
  opacity: 0.5;
  pointer-events: none;
  z-index: 1000;
}

.drop-indicator {
  position: absolute;
  background: #4A90D9;
  border-radius: 2px;
  pointer-events: none;
  z-index: 100;
}
`

export function injectStyles(): void {
  if (typeof document === 'undefined') return
  
  const existing = document.getElementById('y-mindmap-styles')
  if (existing) return
  
  const style = document.createElement('style')
  style.id = 'y-mindmap-styles'
  style.textContent = STYLES
  document.head.appendChild(style)
}

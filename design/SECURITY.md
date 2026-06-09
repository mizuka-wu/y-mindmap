# SECURITY.md - 安全设计

> 思维导图编辑器安全防护设计

---

## 一、输入验证

### 1.1 XSS 防护

```typescript
// @y-mindmap/security/xss.ts

class XSSProtection {
  /**
   * 转义 HTML
   */
  escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
  
  /**
   * 清理 HTML
   */
  sanitizeHtml(html: string): string {
    const allowedTags = ['b', 'i', 'em', 'strong', 'a', 'p', 'br']
    const allowedAttrs = ['href', 'title']
    
    // 使用 DOMPurify 或类似库
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: allowedAttrs,
    })
  }
  
  /**
   * 验证 URL
   */
  isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url)
      return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
    } catch {
      return false
    }
  }
}
```

### 1.2 数据验证

```typescript
// @y-mindmap/security/validation.ts

class DataValidator {
  /**
   * 验证节点数据
   */
  validateNodeData(data: any): ValidationResult {
    const errors: string[] = []
    
    // 验证 ID
    if (!this.isValidId(data.id)) {
      errors.push('Invalid node ID')
    }
    
    // 验证标题
    if (typeof data.title !== 'string' || data.title.length > 1000) {
      errors.push('Invalid title')
    }
    
    // 验证类型
    if (!this.isValidType(data.type)) {
      errors.push('Invalid node type')
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
  
  private isValidId(id: any): boolean {
    return typeof id === 'string' && /^[a-zA-Z0-9_-]+$/.test(id)
  }
  
  private isValidType(type: any): boolean {
    const validTypes = ['root', 'attached', 'detached', 'summary', 'callout']
    return validTypes.includes(type)
  }
}
```

---

## 二、权限控制

### 2.1 权限模型

```typescript
// @y-mindmap/security/permissions.ts

class PermissionManager {
  private permissions: Map<string, Permission> = new Map()
  
  /**
   * 检查权限
   */
  hasPermission(userId: string, action: string, resourceId: string): boolean {
    const permission = this.permissions.get(userId)
    
    if (!permission) {
      return false
    }
    
    return permission.actions.includes(action) && 
           permission.resources.includes(resourceId)
  }
  
  /**
   * 授予权限
   */
  grant(userId: string, permission: Permission): void {
    this.permissions.set(userId, permission)
  }
  
  /**
   * 撤销权限
   */
  revoke(userId: string): void {
    this.permissions.delete(userId)
  }
}

interface Permission {
  actions: string[]
  resources: string[]
}
```

---

## 三、数据加密

### 3.1 加密工具

```typescript
// @y-mindmap/security/crypto.ts

class CryptoUtils {
  /**
   * 加密数据
   */
  async encrypt(data: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    )
    
    return btoa(String.fromCharCode(...iv, ...new Uint8Array(encrypted)))
  }
  
  /**
   * 解密数据
   */
  async decrypt(encrypted: string, key: CryptoKey): Promise<string> {
    const data = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
    const iv = data.slice(0, 12)
    const ciphertext = data.slice(12)
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
    
    return new TextDecoder().decode(decrypted)
  }
  
  /**
   * 生成密钥
   */
  async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  }
}
```

---

## 四、审计日志

### 4.1 审计日志

```typescript
// @y-mindmap/security/audit.ts

class AuditLogger {
  private logs: AuditLog[] = []
  
  /**
   * 记录操作
   */
  log(userId: string, action: string, resource: string, details?: any): void {
    this.logs.push({
      userId,
      action,
      resource,
      details,
      timestamp: Date.now(),
      ip: this.getClientIp(),
    })
  }
  
  /**
   * 获取日志
   */
  getLogs(filters?: AuditLogFilters): AuditLog[] {
    let filtered = [...this.logs]
    
    if (filters?.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId)
    }
    
    if (filters?.action) {
      filtered = filtered.filter(log => log.action === filters.action)
    }
    
    if (filters?.from) {
      filtered = filtered.filter(log => log.timestamp >= filters.from!)
    }
    
    if (filters?.to) {
      filtered = filtered.filter(log => log.timestamp <= filters.to!)
    }
    
    return filtered
  }
}

interface AuditLog {
  userId: string
  action: string
  resource: string
  details?: any
  timestamp: number
  ip: string
}

interface AuditLogFilters {
  userId?: string
  action?: string
  from?: number
  to?: number
}
```

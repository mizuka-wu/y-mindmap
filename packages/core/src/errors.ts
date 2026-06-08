export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'PERMISSION_DENIED'
  | 'CONFLICT'
  | 'INVALID_STATE'
  | 'INVALID_OPERATION'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN'

export interface ErrorDetails {
  code: ErrorCode
  message: string
  context?: Record<string, any>
  cause?: Error
}

export class MindMapError extends Error {
  readonly code: ErrorCode
  readonly context?: Record<string, any>
  readonly cause?: Error

  constructor(details: ErrorDetails) {
    super(details.message)
    this.name = 'MindMapError'
    this.code = details.code
    this.context = details.context
    this.cause = details.cause
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      stack: this.stack,
    }
  }
}

export class ValidationError extends MindMapError {
  readonly field?: string
  readonly value?: any

  constructor(message: string, field?: string, value?: any, context?: Record<string, any>) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      context: { ...context, field, value },
    })
    this.name = 'ValidationError'
    this.field = field
    this.value = value
  }
}

export class NotFoundError extends MindMapError {
  readonly resourceType: string
  readonly resourceId: string

  constructor(resourceType: string, resourceId: string, context?: Record<string, any>) {
    super({
      code: 'NOT_FOUND',
      message: `${resourceType} with id '${resourceId}' not found`,
      context: { ...context, resourceType, resourceId },
    })
    this.name = 'NotFoundError'
    this.resourceType = resourceType
    this.resourceId = resourceId
  }
}

export class AlreadyExistsError extends MindMapError {
  readonly resourceType: string
  readonly resourceId: string

  constructor(resourceType: string, resourceId: string, context?: Record<string, any>) {
    super({
      code: 'ALREADY_EXISTS',
      message: `${resourceType} with id '${resourceId}' already exists`,
      context: { ...context, resourceType, resourceId },
    })
    this.name = 'AlreadyExistsError'
    this.resourceType = resourceType
    this.resourceId = resourceId
  }
}

export class PermissionDeniedError extends MindMapError {
  readonly action: string
  readonly resource?: string

  constructor(action: string, resource?: string, context?: Record<string, any>) {
    super({
      code: 'PERMISSION_DENIED',
      message: `Permission denied for action '${action}'${resource ? ` on '${resource}'` : ''}`,
      context: { ...context, action, resource },
    })
    this.name = 'PermissionDeniedError'
    this.action = action
    this.resource = resource
  }
}

export class ConflictError extends MindMapError {
  readonly conflictType: string

  constructor(conflictType: string, message: string, context?: Record<string, any>) {
    super({
      code: 'CONFLICT',
      message,
      context: { ...context, conflictType },
    })
    this.name = 'ConflictError'
    this.conflictType = conflictType
  }
}

export class InvalidStateError extends MindMapError {
  readonly currentState: string
  readonly expectedState: string

  constructor(currentState: string, expectedState: string, context?: Record<string, any>) {
    super({
      code: 'INVALID_STATE',
      message: `Invalid state: expected '${expectedState}', got '${currentState}'`,
      context: { ...context, currentState, expectedState },
    })
    this.name = 'InvalidStateError'
    this.currentState = currentState
    this.expectedState = expectedState
  }
}

export class InvalidOperationError extends MindMapError {
  readonly operation: string

  constructor(operation: string, reason: string, context?: Record<string, any>) {
    super({
      code: 'INVALID_OPERATION',
      message: `Invalid operation '${operation}': ${reason}`,
      context: { ...context, operation, reason },
    })
    this.name = 'InvalidOperationError'
    this.operation = operation
  }
}

export function isMindMapError(error: unknown): error is MindMapError {
  return error instanceof MindMapError
}

export function getErrorCode(error: unknown): ErrorCode {
  if (isMindMapError(error)) {
    return error.code
  }
  return 'UNKNOWN'
}

export function formatError(error: unknown): string {
  if (isMindMapError(error)) {
    return `[${error.code}] ${error.message}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

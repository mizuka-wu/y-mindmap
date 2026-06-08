import { describe, it, expect } from 'vitest'
import {
  MindMapError,
  ValidationError,
  NotFoundError,
  AlreadyExistsError,
  PermissionDeniedError,
  ConflictError,
  InvalidStateError,
  InvalidOperationError,
  isMindMapError,
  getErrorCode,
  formatError,
} from './errors'

describe('Errors', () => {
  describe('MindMapError', () => {
    it('should create error with code and message', () => {
      const error = new MindMapError({
        code: 'VALIDATION_ERROR',
        message: 'Test error',
      })

      expect(error.name).toBe('MindMapError')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.message).toBe('Test error')
    })

    it('should include context', () => {
      const error = new MindMapError({
        code: 'VALIDATION_ERROR',
        message: 'Test error',
        context: { field: 'title' },
      })

      expect(error.context).toEqual({ field: 'title' })
    })

    it('should include cause', () => {
      const cause = new Error('Original error')
      const error = new MindMapError({
        code: 'UNKNOWN',
        message: 'Test error',
        cause,
      })

      expect(error.cause).toBe(cause)
    })

    it('should serialize to JSON', () => {
      const error = new MindMapError({
        code: 'VALIDATION_ERROR',
        message: 'Test error',
        context: { field: 'title' },
      })

      const json = error.toJSON()
      expect(json.code).toBe('VALIDATION_ERROR')
      expect(json.message).toBe('Test error')
      expect(json.context).toEqual({ field: 'title' })
    })
  })

  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Invalid value', 'title', '')

      expect(error.name).toBe('ValidationError')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.field).toBe('title')
      expect(error.value).toBe('')
    })
  })

  describe('NotFoundError', () => {
    it('should create not found error', () => {
      const error = new NotFoundError('Node', 'node-1')

      expect(error.name).toBe('NotFoundError')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.resourceType).toBe('Node')
      expect(error.resourceId).toBe('node-1')
      expect(error.message).toContain('node-1')
    })
  })

  describe('AlreadyExistsError', () => {
    it('should create already exists error', () => {
      const error = new AlreadyExistsError('Node', 'node-1')

      expect(error.name).toBe('AlreadyExistsError')
      expect(error.code).toBe('ALREADY_EXISTS')
    })
  })

  describe('PermissionDeniedError', () => {
    it('should create permission denied error', () => {
      const error = new PermissionDeniedError('edit', 'node-1')

      expect(error.name).toBe('PermissionDeniedError')
      expect(error.code).toBe('PERMISSION_DENIED')
      expect(error.action).toBe('edit')
      expect(error.resource).toBe('node-1')
    })
  })

  describe('ConflictError', () => {
    it('should create conflict error', () => {
      const error = new ConflictError('lock', 'Node is locked')

      expect(error.name).toBe('ConflictError')
      expect(error.code).toBe('CONFLICT')
      expect(error.conflictType).toBe('lock')
    })
  })

  describe('InvalidStateError', () => {
    it('should create invalid state error', () => {
      const error = new InvalidStateError('editing', 'idle')

      expect(error.name).toBe('InvalidStateError')
      expect(error.code).toBe('INVALID_STATE')
      expect(error.currentState).toBe('editing')
      expect(error.expectedState).toBe('idle')
    })
  })

  describe('InvalidOperationError', () => {
    it('should create invalid operation error', () => {
      const error = new InvalidOperationError('delete', 'Cannot delete root')

      expect(error.name).toBe('InvalidOperationError')
      expect(error.code).toBe('INVALID_OPERATION')
      expect(error.operation).toBe('delete')
    })
  })

  describe('Utility functions', () => {
    it('isMindMapError should identify MindMapError', () => {
      const error = new MindMapError({ code: 'UNKNOWN', message: 'test' })
      expect(isMindMapError(error)).toBe(true)
      expect(isMindMapError(new Error('test'))).toBe(false)
      expect(isMindMapError('string')).toBe(false)
    })

    it('getErrorCode should return error code', () => {
      const error = new ValidationError('test')
      expect(getErrorCode(error)).toBe('VALIDATION_ERROR')
      expect(getErrorCode(new Error('test'))).toBe('UNKNOWN')
    })

    it('formatError should format error message', () => {
      const error = new ValidationError('Invalid value')
      expect(formatError(error)).toContain('VALIDATION_ERROR')
      expect(formatError(new Error('test'))).toBe('test')
      expect(formatError('string')).toBe('string')
    })
  })
})

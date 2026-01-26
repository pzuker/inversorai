import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logAdminAudit,
  setAuditLogRepository,
  type AdminAuditEvent,
} from '../interfaces/http/audit/index.js';
import { SupabaseAuditLogRepository } from '../infrastructure/audit/SupabaseAuditLogRepository.js';

describe('AdminAuditLogger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('logAdminAudit', () => {
    it('outputs valid JSON string with required keys', () => {
      const event: AdminAuditEvent = {
        type: 'ADMIN_AUDIT',
        requestId: 'test-request-id',
        timestamp: '2026-01-26T12:00:00.000Z',
        action: 'USER_ROLE_CHANGED',
        result: 'success',
        actor: { id: 'actor-id', email: 'admin@example.com', role: 'ADMIN' },
        target: { id: 'target-id', email: 'user@example.com' },
        clientIp: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        metadata: { newRole: 'ADMIN' },
      };

      logAdminAudit(event);

      expect(consoleLogSpy).toHaveBeenCalledOnce();

      const loggedArg = consoleLogSpy.mock.calls[0]?.[0];
      expect(typeof loggedArg).toBe('string');

      const parsed = JSON.parse(loggedArg as string);

      // Verify required keys
      expect(parsed.type).toBe('ADMIN_AUDIT');
      expect(parsed.requestId).toBe('test-request-id');
      expect(parsed.timestamp).toBe('2026-01-26T12:00:00.000Z');
      expect(parsed.action).toBe('USER_ROLE_CHANGED');
      expect(parsed.result).toBe('success');
      expect(parsed.actor).toEqual({ id: 'actor-id', email: 'admin@example.com', role: 'ADMIN' });
      expect(parsed.target).toEqual({ id: 'target-id', email: 'user@example.com' });
      expect(parsed.clientIp).toBe('192.168.1.1');
      expect(parsed.userAgent).toBe('Mozilla/5.0');
      expect(parsed.metadata).toEqual({ newRole: 'ADMIN' });
    });

    it('only includes provided metadata keys (no sensitive data leakage)', () => {
      const event: AdminAuditEvent = {
        type: 'ADMIN_AUDIT',
        requestId: 'test-request-id',
        timestamp: '2026-01-26T12:00:00.000Z',
        action: 'PASSWORD_RESET_TRIGGERED',
        result: 'success',
        actor: { id: 'actor-id' },
        target: { id: 'target-id' },
        metadata: { redirectToProvided: true },
      };

      logAdminAudit(event);

      const loggedArg = consoleLogSpy.mock.calls[0]?.[0];
      const parsed = JSON.parse(loggedArg as string);

      // Verify only specified metadata is included
      expect(parsed.metadata).toEqual({ redirectToProvided: true });

      // Ensure no accidental keys that shouldn't be there
      expect(parsed).not.toHaveProperty('Authorization');
      expect(parsed).not.toHaveProperty('authorization');
      expect(parsed).not.toHaveProperty('body');
      expect(parsed).not.toHaveProperty('token');
      expect(parsed).not.toHaveProperty('password');
    });

    it('includes error field for error events', () => {
      const event: AdminAuditEvent = {
        type: 'ADMIN_AUDIT',
        requestId: 'test-request-id',
        timestamp: '2026-01-26T12:00:00.000Z',
        action: 'USER_ROLE_CHANGED',
        result: 'error',
        actor: { id: 'actor-id' },
        target: { id: 'target-id' },
        error: 'User not found',
      };

      logAdminAudit(event);

      const loggedArg = consoleLogSpy.mock.calls[0]?.[0];
      const parsed = JSON.parse(loggedArg as string);

      expect(parsed.result).toBe('error');
      expect(parsed.error).toBe('User not found');
    });

    it('omits optional fields when not provided', () => {
      const event: AdminAuditEvent = {
        type: 'ADMIN_AUDIT',
        requestId: 'test-request-id',
        timestamp: '2026-01-26T12:00:00.000Z',
        action: 'USER_ROLE_CHANGED',
        result: 'success',
        actor: { id: 'actor-id' },
        target: { id: 'target-id' },
      };

      logAdminAudit(event);

      const loggedArg = consoleLogSpy.mock.calls[0]?.[0];
      const parsed = JSON.parse(loggedArg as string);

      expect(parsed).not.toHaveProperty('clientIp');
      expect(parsed).not.toHaveProperty('userAgent');
      expect(parsed).not.toHaveProperty('metadata');
      expect(parsed).not.toHaveProperty('error');
    });

    it('omits actor email and role when not provided', () => {
      const event: AdminAuditEvent = {
        type: 'ADMIN_AUDIT',
        requestId: 'test-request-id',
        timestamp: '2026-01-26T12:00:00.000Z',
        action: 'USER_ROLE_CHANGED',
        result: 'success',
        actor: { id: 'actor-id' },
        target: { id: 'target-id' },
      };

      logAdminAudit(event);

      const loggedArg = consoleLogSpy.mock.calls[0]?.[0];
      const parsed = JSON.parse(loggedArg as string);

      expect(parsed.actor).toEqual({ id: 'actor-id' });
      expect(parsed.actor).not.toHaveProperty('email');
      expect(parsed.actor).not.toHaveProperty('role');
    });

    it('omits target email when not provided', () => {
      const event: AdminAuditEvent = {
        type: 'ADMIN_AUDIT',
        requestId: 'test-request-id',
        timestamp: '2026-01-26T12:00:00.000Z',
        action: 'PASSWORD_RESET_TRIGGERED',
        result: 'error',
        actor: { id: 'actor-id' },
        target: { id: 'target-id' },
        error: 'User not found',
      };

      logAdminAudit(event);

      const loggedArg = consoleLogSpy.mock.calls[0]?.[0];
      const parsed = JSON.parse(loggedArg as string);

      expect(parsed.target).toEqual({ id: 'target-id' });
      expect(parsed.target).not.toHaveProperty('email');
    });

    it('handles PASSWORD_RESET_TRIGGERED action', () => {
      const event: AdminAuditEvent = {
        type: 'ADMIN_AUDIT',
        requestId: 'test-request-id',
        timestamp: '2026-01-26T12:00:00.000Z',
        action: 'PASSWORD_RESET_TRIGGERED',
        result: 'success',
        actor: { id: 'actor-id', email: 'admin@example.com', role: 'ADMIN' },
        target: { id: 'target-id', email: 'user@example.com' },
        metadata: { redirectToProvided: false },
      };

      logAdminAudit(event);

      const loggedArg = consoleLogSpy.mock.calls[0]?.[0];
      const parsed = JSON.parse(loggedArg as string);

      expect(parsed.action).toBe('PASSWORD_RESET_TRIGGERED');
      expect(parsed.metadata).toEqual({ redirectToProvided: false });
    });
  });

  describe('persistence', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let mockSave: ReturnType<typeof vi.fn>;
    let mockRepository: SupabaseAuditLogRepository;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockSave = vi.fn().mockResolvedValue(undefined);
      mockRepository = { save: mockSave } as unknown as SupabaseAuditLogRepository;
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      setAuditLogRepository(null);
    });

    it('calls repository.save when persistence is enabled', async () => {
      setAuditLogRepository(mockRepository);

      const event: AdminAuditEvent = {
        type: 'ADMIN_AUDIT',
        requestId: 'test-request-id',
        timestamp: '2026-01-26T12:00:00.000Z',
        action: 'USER_ROLE_CHANGED',
        result: 'success',
        actor: { id: 'actor-id', email: 'admin@example.com', role: 'ADMIN' },
        target: { id: 'target-id', email: 'user@example.com' },
        metadata: { newRole: 'ADMIN' },
      };

      logAdminAudit(event);

      // Wait for async save to complete
      await vi.waitFor(() => {
        expect(mockSave).toHaveBeenCalledOnce();
      });

      // Verify console.log was also called (existing behavior preserved)
      expect(consoleLogSpy).toHaveBeenCalledOnce();

      // Verify save was called with correct data
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ADMIN_AUDIT',
          requestId: 'test-request-id',
          action: 'USER_ROLE_CHANGED',
          result: 'success',
        })
      );
    });

    it('does not call repository.save when persistence is disabled', () => {
      // Don't set repository (persistence disabled)
      setAuditLogRepository(null);

      const event: AdminAuditEvent = {
        type: 'ADMIN_AUDIT',
        requestId: 'test-request-id',
        timestamp: '2026-01-26T12:00:00.000Z',
        action: 'USER_ROLE_CHANGED',
        result: 'success',
        actor: { id: 'actor-id' },
        target: { id: 'target-id' },
      };

      logAdminAudit(event);

      // Console.log should still be called
      expect(consoleLogSpy).toHaveBeenCalledOnce();

      // Repository save should NOT be called
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('continues logging to stdout even if persistence fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSave.mockRejectedValue(new Error('Database connection failed'));
      setAuditLogRepository(mockRepository);

      const event: AdminAuditEvent = {
        type: 'ADMIN_AUDIT',
        requestId: 'test-request-id',
        timestamp: '2026-01-26T12:00:00.000Z',
        action: 'USER_ROLE_CHANGED',
        result: 'success',
        actor: { id: 'actor-id' },
        target: { id: 'target-id' },
      };

      logAdminAudit(event);

      // Console.log should be called (not blocked by persistence failure)
      expect(consoleLogSpy).toHaveBeenCalledOnce();

      // Wait for async error to be logged
      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });
});

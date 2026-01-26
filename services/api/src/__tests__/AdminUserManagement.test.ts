import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Response, NextFunction } from 'express';
import type { UserAdminPort, AdminUser } from '../application/ports/index.js';
import {
  ListAdminUsers,
  SetUserRole,
  LastAdminError,
  SetUserRoleUserNotFoundError,
  SendUserPasswordReset,
  SendUserPasswordResetUserNotFoundError,
} from '../application/use-cases/index.js';
import { requireRecentAuth } from '../interfaces/http/middlewares/index.js';
import type { AuthenticatedRequest } from '../interfaces/http/middlewares/index.js';

class FakeUserAdminService implements UserAdminPort {
  private users: AdminUser[] = [];
  private nextId = 1;
  public passwordResetCalls: { email: string; redirectTo?: string }[] = [];

  async listUsers(page: number, perPage: number): Promise<AdminUser[]> {
    const start = (page - 1) * perPage;
    return this.users.slice(start, start + perPage);
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async inviteUserByEmail(email: string, _redirectTo?: string): Promise<AdminUser> {
    const user: AdminUser = {
      id: `user-${this.nextId++}`,
      email,
      app_metadata: {},
    };
    this.users.push(user);
    return user;
  }

  async updateUserById(
    id: string,
    attributes: { app_metadata?: Record<string, unknown> }
  ): Promise<AdminUser> {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }
    if (attributes.app_metadata) {
      user.app_metadata = { ...user.app_metadata, ...attributes.app_metadata };
    }
    return user;
  }

  async sendPasswordResetEmail(email: string, redirectTo?: string): Promise<void> {
    this.passwordResetCalls.push({ email, redirectTo });
  }

  addUser(user: AdminUser): void {
    this.users.push(user);
  }

  getUser(id: string): AdminUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  clear(): void {
    this.users = [];
    this.nextId = 1;
    this.passwordResetCalls = [];
  }
}

describe('ListAdminUsers', () => {
  let userAdminService: FakeUserAdminService;
  let useCase: ListAdminUsers;

  beforeEach(() => {
    userAdminService = new FakeUserAdminService();
    useCase = new ListAdminUsers(userAdminService);
  });

  it('returns empty array when no users exist', async () => {
    const result = await useCase.execute({ page: 1, perPage: 50 });
    expect(result).toEqual([]);
  });

  it('derives role as ADMIN when app_metadata.inversorai_role is ADMIN', async () => {
    userAdminService.addUser({
      id: 'admin-id',
      email: 'admin@example.com',
      app_metadata: { inversorai_role: 'ADMIN' },
    });

    const result = await useCase.execute({ page: 1, perPage: 50 });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'admin-id',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
  });

  it('derives role as USER when app_metadata.inversorai_role is not ADMIN', async () => {
    userAdminService.addUser({
      id: 'user-id',
      email: 'user@example.com',
      app_metadata: { inversorai_role: 'USER' },
    });

    const result = await useCase.execute({ page: 1, perPage: 50 });

    expect(result[0]?.role).toBe('USER');
  });

  it('derives role as USER when app_metadata is undefined', async () => {
    userAdminService.addUser({
      id: 'user-id',
      email: 'user@example.com',
    });

    const result = await useCase.execute({ page: 1, perPage: 50 });

    expect(result[0]?.role).toBe('USER');
  });

  it('passes pagination parameters through', async () => {
    for (let i = 0; i < 10; i++) {
      userAdminService.addUser({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        app_metadata: {},
      });
    }

    const page1 = await useCase.execute({ page: 1, perPage: 3 });
    const page2 = await useCase.execute({ page: 2, perPage: 3 });

    expect(page1).toHaveLength(3);
    expect(page2).toHaveLength(3);
    expect(page1[0]?.id).toBe('user-0');
    expect(page2[0]?.id).toBe('user-3');
  });
});

describe('SetUserRole', () => {
  let userAdminService: FakeUserAdminService;
  let useCase: SetUserRole;

  beforeEach(() => {
    userAdminService = new FakeUserAdminService();
    useCase = new SetUserRole(userAdminService);
  });

  describe('promote user to ADMIN', () => {
    it('sets inversorai_role to ADMIN and merges app_metadata', async () => {
      userAdminService.addUser({
        id: 'user-id',
        email: 'user@example.com',
        app_metadata: { existing_key: 'value' },
      });

      const result = await useCase.execute({ targetUserId: 'user-id', role: 'ADMIN' });

      expect(result.role).toBe('ADMIN');
      const user = userAdminService.getUser('user-id');
      expect(user?.app_metadata).toEqual({
        existing_key: 'value',
        inversorai_role: 'ADMIN',
      });
    });
  });

  describe('demote user to USER', () => {
    it('sets inversorai_role to USER and merges app_metadata', async () => {
      // Add two admins so we can demote one
      userAdminService.addUser({
        id: 'admin-1',
        email: 'admin1@example.com',
        app_metadata: { inversorai_role: 'ADMIN' },
      });
      userAdminService.addUser({
        id: 'admin-2',
        email: 'admin2@example.com',
        app_metadata: { inversorai_role: 'ADMIN', other_key: 123 },
      });

      const result = await useCase.execute({ targetUserId: 'admin-2', role: 'USER' });

      expect(result.role).toBe('USER');
      const user = userAdminService.getUser('admin-2');
      expect(user?.app_metadata).toEqual({
        inversorai_role: 'USER',
        other_key: 123,
      });
    });
  });

  describe('last admin protection', () => {
    it('throws LastAdminError when demoting the only admin', async () => {
      userAdminService.addUser({
        id: 'only-admin',
        email: 'admin@example.com',
        app_metadata: { inversorai_role: 'ADMIN' },
      });

      await expect(
        useCase.execute({ targetUserId: 'only-admin', role: 'USER' })
      ).rejects.toThrow(LastAdminError);
    });

    it('allows demoting when multiple admins exist', async () => {
      userAdminService.addUser({
        id: 'admin-1',
        email: 'admin1@example.com',
        app_metadata: { inversorai_role: 'ADMIN' },
      });
      userAdminService.addUser({
        id: 'admin-2',
        email: 'admin2@example.com',
        app_metadata: { inversorai_role: 'ADMIN' },
      });

      const result = await useCase.execute({ targetUserId: 'admin-1', role: 'USER' });

      expect(result.role).toBe('USER');
    });
  });

  describe('user not found', () => {
    it('throws UserNotFoundError when user does not exist', async () => {
      await expect(
        useCase.execute({ targetUserId: 'non-existent', role: 'ADMIN' })
      ).rejects.toThrow(SetUserRoleUserNotFoundError);
    });
  });
});

describe('SendUserPasswordReset', () => {
  let userAdminService: FakeUserAdminService;
  let useCase: SendUserPasswordReset;

  beforeEach(() => {
    userAdminService = new FakeUserAdminService();
    useCase = new SendUserPasswordReset(userAdminService);
  });

  it('calls sendPasswordResetEmail with target user email', async () => {
    userAdminService.addUser({
      id: 'user-id',
      email: 'user@example.com',
      app_metadata: {},
    });

    await useCase.execute({ targetUserId: 'user-id' });

    expect(userAdminService.passwordResetCalls).toHaveLength(1);
    expect(userAdminService.passwordResetCalls[0]).toEqual({
      email: 'user@example.com',
      redirectTo: undefined,
    });
  });

  it('passes redirectTo to sendPasswordResetEmail', async () => {
    userAdminService.addUser({
      id: 'user-id',
      email: 'user@example.com',
      app_metadata: {},
    });

    await useCase.execute({
      targetUserId: 'user-id',
      redirectTo: 'https://example.com/reset',
    });

    expect(userAdminService.passwordResetCalls[0]).toEqual({
      email: 'user@example.com',
      redirectTo: 'https://example.com/reset',
    });
  });

  it('throws UserNotFoundError when user does not exist', async () => {
    await expect(
      useCase.execute({ targetUserId: 'non-existent' })
    ).rejects.toThrow(SendUserPasswordResetUserNotFoundError);
  });
});

describe('requireRecentAuth middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock as unknown as Response['status'] };
    mockNext = vi.fn();
    // Clear env override
    delete process.env['ADMIN_STEP_UP_MAX_AGE_SECONDS'];
  });

  it('calls next() when iat is recent (within 300s default)', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    mockReq = {
      user: { id: 'user-id', role: 'ADMIN', iat: nowSeconds - 100 },
    };

    requireRecentAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('returns 401 with REAUTH_REQUIRED when iat is missing', () => {
    mockReq = {
      user: { id: 'user-id', role: 'ADMIN' },
    };

    requireRecentAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Reauthentication required',
      code: 'REAUTH_REQUIRED',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 with REAUTH_REQUIRED when token is too old', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    mockReq = {
      user: { id: 'user-id', role: 'ADMIN', iat: nowSeconds - 400 }, // 400s old, > 300s default
    };

    requireRecentAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Reauthentication required',
      code: 'REAUTH_REQUIRED',
    });
  });

  it('respects ADMIN_STEP_UP_MAX_AGE_SECONDS env override', () => {
    process.env['ADMIN_STEP_UP_MAX_AGE_SECONDS'] = '60';
    const nowSeconds = Math.floor(Date.now() / 1000);
    mockReq = {
      user: { id: 'user-id', role: 'ADMIN', iat: nowSeconds - 100 }, // 100s old, > 60s override
    };

    requireRecentAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Reauthentication required',
      code: 'REAUTH_REQUIRED',
    });
  });

  it('passes when token age is exactly at the limit', () => {
    const nowSeconds = Math.floor(Date.now() / 1000);
    mockReq = {
      user: { id: 'user-id', role: 'ADMIN', iat: nowSeconds - 300 }, // exactly 300s
    };

    requireRecentAuth(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

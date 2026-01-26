import { describe, it, expect, beforeEach } from 'vitest';
import type { UserAdminPort, AdminUser } from '../application/ports/index.js';
import { BootstrapInitialAdmin } from '../application/use-cases/index.js';

class FakeUserAdminService implements UserAdminPort {
  private users: AdminUser[] = [];
  private nextId = 1;

  async listUsers(page: number, perPage: number): Promise<AdminUser[]> {
    const start = (page - 1) * perPage;
    return this.users.slice(start, start + perPage);
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

  async getUserById(id: string): Promise<AdminUser | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async sendPasswordResetEmail(_email: string, _redirectTo?: string): Promise<void> {
    // No-op for testing
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
  }
}

describe('BootstrapInitialAdmin', () => {
  let userAdminService: FakeUserAdminService;
  let useCase: BootstrapInitialAdmin;

  beforeEach(() => {
    userAdminService = new FakeUserAdminService();
    useCase = new BootstrapInitialAdmin(userAdminService);
  });

  describe('noop when admin already exists', () => {
    it('returns noop status when an ADMIN user already exists', async () => {
      userAdminService.addUser({
        id: 'existing-admin-id',
        email: 'existing@admin.com',
        app_metadata: { inversorai_role: 'ADMIN' },
      });

      const result = await useCase.execute({ email: 'new@admin.com' });

      expect(result.status).toBe('noop');
      expect(result.reason).toBe('admin_exists');
      expect(result.adminUserId).toBe('existing-admin-id');
      expect(result.adminEmail).toBe('existing@admin.com');
    });

    it('returns noop even when target email matches existing admin', async () => {
      userAdminService.addUser({
        id: 'existing-admin-id',
        email: 'admin@example.com',
        app_metadata: { inversorai_role: 'ADMIN' },
      });

      const result = await useCase.execute({ email: 'admin@example.com' });

      expect(result.status).toBe('noop');
      expect(result.reason).toBe('admin_exists');
    });
  });

  describe('promote existing user', () => {
    it('promotes existing user when no admin exists but email user exists', async () => {
      userAdminService.addUser({
        id: 'target-user-id',
        email: 'target@user.com',
        app_metadata: {},
      });

      const result = await useCase.execute({ email: 'target@user.com' });

      expect(result.status).toBe('promoted');
      expect(result.adminUserId).toBe('target-user-id');
      expect(result.adminEmail).toBe('target@user.com');

      const user = userAdminService.getUser('target-user-id');
      expect(user?.app_metadata?.['inversorai_role']).toBe('ADMIN');
    });

    it('handles case-insensitive email matching', async () => {
      userAdminService.addUser({
        id: 'target-user-id',
        email: 'Target@User.COM',
        app_metadata: {},
      });

      const result = await useCase.execute({ email: 'target@user.com' });

      expect(result.status).toBe('promoted');
      expect(result.adminUserId).toBe('target-user-id');
    });
  });

  describe('invite and promote new user', () => {
    it('invites and promotes when neither admin nor target user exists', async () => {
      const result = await useCase.execute({ email: 'new@admin.com' });

      expect(result.status).toBe('created');
      expect(result.adminEmail).toBe('new@admin.com');
      expect(result.adminUserId).toBeDefined();

      const user = userAdminService.getUser(result.adminUserId!);
      expect(user?.app_metadata?.['inversorai_role']).toBe('ADMIN');
    });

    it('normalizes email to lowercase when inviting', async () => {
      const result = await useCase.execute({ email: 'New@Admin.COM' });

      expect(result.status).toBe('created');
      expect(result.adminEmail).toBe('new@admin.com');
    });
  });

  describe('app_metadata preservation', () => {
    it('preserves existing app_metadata keys when promoting', async () => {
      userAdminService.addUser({
        id: 'target-user-id',
        email: 'target@user.com',
        app_metadata: {
          existing_key: 'existing_value',
          another_key: 123,
        },
      });

      await useCase.execute({ email: 'target@user.com' });

      const user = userAdminService.getUser('target-user-id');
      expect(user?.app_metadata).toEqual({
        existing_key: 'existing_value',
        another_key: 123,
        inversorai_role: 'ADMIN',
      });
    });

    it('does not wipe other metadata fields', async () => {
      userAdminService.addUser({
        id: 'target-user-id',
        email: 'target@user.com',
        app_metadata: {
          provider: 'google',
          custom_setting: true,
        },
      });

      await useCase.execute({ email: 'target@user.com' });

      const user = userAdminService.getUser('target-user-id');
      expect(user?.app_metadata?.['provider']).toBe('google');
      expect(user?.app_metadata?.['custom_setting']).toBe(true);
      expect(user?.app_metadata?.['inversorai_role']).toBe('ADMIN');
    });
  });

  describe('pagination', () => {
    it('finds admin across multiple pages', async () => {
      // Add 150 regular users
      for (let i = 0; i < 150; i++) {
        userAdminService.addUser({
          id: `user-${i}`,
          email: `user${i}@example.com`,
          app_metadata: {},
        });
      }
      // Add admin as user 151
      userAdminService.addUser({
        id: 'admin-user',
        email: 'admin@example.com',
        app_metadata: { inversorai_role: 'ADMIN' },
      });

      const result = await useCase.execute({ email: 'new@admin.com' });

      expect(result.status).toBe('noop');
      expect(result.adminUserId).toBe('admin-user');
    });

    it('finds target user across multiple pages when no admin exists', async () => {
      // Add 150 regular users
      for (let i = 0; i < 150; i++) {
        userAdminService.addUser({
          id: `user-${i}`,
          email: `user${i}@example.com`,
          app_metadata: {},
        });
      }
      // Add target user as user 151
      userAdminService.addUser({
        id: 'target-user',
        email: 'target@example.com',
        app_metadata: {},
      });

      const result = await useCase.execute({ email: 'target@example.com' });

      expect(result.status).toBe('promoted');
      expect(result.adminUserId).toBe('target-user');
    });
  });
});

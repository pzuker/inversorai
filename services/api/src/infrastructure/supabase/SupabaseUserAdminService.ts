import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserAdminPort, AdminUser } from '../../application/ports/index.js';

export class SupabaseUserAdminService implements UserAdminPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async listUsers(page: number, perPage: number): Promise<AdminUser[]> {
    const { data, error } = await this.supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    return data.users.map((user) => ({
      id: user.id,
      email: user.email ?? '',
      app_metadata: user.app_metadata as Record<string, unknown> | undefined,
    }));
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    const { data, error } = await this.supabase.auth.admin.getUserById(id);

    if (error) {
      if (error.message.includes('not found') || error.message.includes('User not found')) {
        return null;
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    if (!data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email ?? '',
      app_metadata: data.user.app_metadata as Record<string, unknown> | undefined,
    };
  }

  async inviteUserByEmail(email: string, redirectTo?: string): Promise<AdminUser> {
    const options = redirectTo ? { redirectTo } : undefined;

    const { data, error } = await this.supabase.auth.admin.inviteUserByEmail(
      email,
      options
    );

    if (error) {
      throw new Error(`Failed to invite user: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Failed to invite user: No user returned');
    }

    return {
      id: data.user.id,
      email: data.user.email ?? '',
      app_metadata: data.user.app_metadata as Record<string, unknown> | undefined,
    };
  }

  async updateUserById(
    id: string,
    attributes: { app_metadata?: Record<string, unknown> }
  ): Promise<AdminUser> {
    const { data, error } = await this.supabase.auth.admin.updateUserById(id, {
      app_metadata: attributes.app_metadata,
    });

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Failed to update user: No user returned');
    }

    return {
      id: data.user.id,
      email: data.user.email ?? '',
      app_metadata: data.user.app_metadata as Record<string, unknown> | undefined,
    };
  }

  async sendPasswordResetEmail(email: string, redirectTo?: string): Promise<void> {
    const options = redirectTo ? { redirectTo } : undefined;

    const { error } = await this.supabase.auth.resetPasswordForEmail(email, options);

    if (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }
}

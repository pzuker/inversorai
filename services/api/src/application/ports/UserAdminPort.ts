export interface AdminUser {
  id: string;
  email: string;
  app_metadata?: Record<string, unknown>;
}

export interface UserAdminPort {
  listUsers(page: number, perPage: number): Promise<AdminUser[]>;
  inviteUserByEmail(email: string, redirectTo?: string): Promise<AdminUser>;
  updateUserById(id: string, attributes: { app_metadata?: Record<string, unknown> }): Promise<AdminUser>;
}

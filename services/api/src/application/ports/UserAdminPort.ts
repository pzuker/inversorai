export interface AdminUser {
  id: string;
  email: string;
  app_metadata?: Record<string, unknown>;
}

export interface UserAdminPort {
  listUsers(page: number, perPage: number): Promise<AdminUser[]>;
  getUserById(id: string): Promise<AdminUser | null>;
  inviteUserByEmail(email: string, redirectTo?: string): Promise<AdminUser>;
  updateUserById(id: string, attributes: { app_metadata?: Record<string, unknown> }): Promise<AdminUser>;
  sendPasswordResetEmail(email: string, redirectTo?: string): Promise<void>;
}

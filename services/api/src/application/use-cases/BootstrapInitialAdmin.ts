import type { UserAdminPort, AdminUser } from '../ports/index.js';

export interface BootstrapInitialAdminInput {
  email: string;
  redirectTo?: string;
}

export type BootstrapStatus = 'created' | 'promoted' | 'noop';

export interface BootstrapInitialAdminResult {
  status: BootstrapStatus;
  reason?: string;
  adminUserId?: string;
  adminEmail?: string;
}

export class BootstrapInitialAdmin {
  constructor(private readonly userAdminService: UserAdminPort) {}

  async execute(input: BootstrapInitialAdminInput): Promise<BootstrapInitialAdminResult> {
    const { email, redirectTo } = input;
    const normalizedEmail = email.toLowerCase();

    let existingAdmin: AdminUser | null = null;
    let targetUser: AdminUser | null = null;

    // Paginate through all users to check for existing admin and target user
    const perPage = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const users = await this.userAdminService.listUsers(page, perPage);

      for (const user of users) {
        // Check if this user is already an admin
        if (user.app_metadata?.['inversorai_role'] === 'ADMIN') {
          existingAdmin = user;
        }

        // Check if this is the target user
        if (user.email?.toLowerCase() === normalizedEmail) {
          targetUser = user;
        }
      }

      // If we found an admin, we can stop early
      if (existingAdmin) {
        return {
          status: 'noop',
          reason: 'admin_exists',
          adminUserId: existingAdmin.id,
          adminEmail: existingAdmin.email,
        };
      }

      hasMore = users.length === perPage;
      page++;
    }

    // No admin exists, proceed with bootstrap
    if (targetUser) {
      // User exists, promote them
      const updatedUser = await this.promoteUser(targetUser);
      return {
        status: 'promoted',
        adminUserId: updatedUser.id,
        adminEmail: updatedUser.email,
      };
    } else {
      // User doesn't exist, invite and promote
      const invitedUser = await this.userAdminService.inviteUserByEmail(normalizedEmail, redirectTo);
      const promotedUser = await this.promoteUser(invitedUser);
      return {
        status: 'created',
        adminUserId: promotedUser.id,
        adminEmail: promotedUser.email,
      };
    }
  }

  private async promoteUser(user: AdminUser): Promise<AdminUser> {
    // Merge app_metadata to preserve existing keys
    const existingMetadata = user.app_metadata ?? {};
    const updatedMetadata = {
      ...existingMetadata,
      inversorai_role: 'ADMIN',
    };

    return this.userAdminService.updateUserById(user.id, {
      app_metadata: updatedMetadata,
    });
  }
}

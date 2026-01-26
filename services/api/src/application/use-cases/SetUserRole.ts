import type { UserAdminPort } from '../ports/index.js';

export type UserRole = 'ADMIN' | 'USER';

export interface SetUserRoleInput {
  targetUserId: string;
  role: UserRole;
}

export interface SetUserRoleResult {
  id: string;
  email: string;
  role: UserRole;
}

export class LastAdminError extends Error {
  constructor() {
    super('Cannot demote the last admin');
    this.name = 'LastAdminError';
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class SetUserRole {
  constructor(private readonly userAdminService: UserAdminPort) {}

  async execute(input: SetUserRoleInput): Promise<SetUserRoleResult> {
    const { targetUserId, role } = input;

    // Get target user
    const targetUser = await this.userAdminService.getUserById(targetUserId);
    if (!targetUser) {
      throw new UserNotFoundError(targetUserId);
    }

    const currentRole = targetUser.app_metadata?.['inversorai_role'] === 'ADMIN' ? 'ADMIN' : 'USER';

    // Check last admin protection when demoting
    if (currentRole === 'ADMIN' && role === 'USER') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new LastAdminError();
      }
    }

    // Merge app_metadata and set role
    const existingMetadata = targetUser.app_metadata ?? {};
    const updatedMetadata = {
      ...existingMetadata,
      inversorai_role: role,
    };

    const updatedUser = await this.userAdminService.updateUserById(targetUserId, {
      app_metadata: updatedMetadata,
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.app_metadata?.['inversorai_role'] === 'ADMIN' ? 'ADMIN' : 'USER',
    };
  }

  private async countAdmins(): Promise<number> {
    let adminCount = 0;
    const perPage = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const users = await this.userAdminService.listUsers(page, perPage);

      for (const user of users) {
        if (user.app_metadata?.['inversorai_role'] === 'ADMIN') {
          adminCount++;
        }
      }

      hasMore = users.length === perPage;
      page++;
    }

    return adminCount;
  }
}

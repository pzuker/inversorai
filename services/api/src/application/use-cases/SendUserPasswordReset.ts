import type { UserAdminPort } from '../ports/index.js';

export interface SendUserPasswordResetInput {
  targetUserId: string;
  redirectTo?: string;
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class SendUserPasswordReset {
  constructor(private readonly userAdminService: UserAdminPort) {}

  async execute(input: SendUserPasswordResetInput): Promise<void> {
    const { targetUserId, redirectTo } = input;

    // Get target user to get their email
    const targetUser = await this.userAdminService.getUserById(targetUserId);
    if (!targetUser) {
      throw new UserNotFoundError(targetUserId);
    }

    await this.userAdminService.sendPasswordResetEmail(targetUser.email, redirectTo);
  }
}

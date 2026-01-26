import type { UserAdminPort } from '../ports/index.js';

export interface AdminUserView {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export interface ListAdminUsersInput {
  page: number;
  perPage: number;
}

export class ListAdminUsers {
  constructor(private readonly userAdminService: UserAdminPort) {}

  async execute(input: ListAdminUsersInput): Promise<AdminUserView[]> {
    const { page, perPage } = input;

    const users = await this.userAdminService.listUsers(page, perPage);

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.app_metadata?.['inversorai_role'] === 'ADMIN' ? 'ADMIN' : 'USER',
    }));
  }
}

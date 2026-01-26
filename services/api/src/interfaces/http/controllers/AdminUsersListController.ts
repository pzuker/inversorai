import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import { ListAdminUsers } from '../../../application/use-cases/index.js';
import { createSupabaseClient, SupabaseUserAdminService } from '../../../infrastructure/supabase/index.js';
import { listUsersQuerySchema } from '../validation/index.js';

export class AdminUsersListController {
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Validate and transform query params with safe defaults and caps
      const queryResult = listUsersQuerySchema.safeParse(req.query);
      // Schema uses transforms with safe defaults, so parse always succeeds
      const { page, perPage } = queryResult.success
        ? queryResult.data
        : { page: 1, perPage: 50 };

      const supabaseClient = createSupabaseClient();
      const userAdminService = new SupabaseUserAdminService(supabaseClient);
      const useCase = new ListAdminUsers(userAdminService);

      const users = await useCase.execute({ page, perPage });

      res.status(200).json({ data: users });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
}

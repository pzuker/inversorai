import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import { ListAdminUsers } from '../../../application/use-cases/index.js';
import { createSupabaseClient, SupabaseUserAdminService } from '../../../infrastructure/supabase/index.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 50;
const MAX_PER_PAGE = 100;

export class AdminUsersListController {
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const pageParam = req.query['page'];
      const perPageParam = req.query['perPage'];

      let page = DEFAULT_PAGE;
      let perPage = DEFAULT_PER_PAGE;

      if (pageParam !== undefined) {
        const parsedPage = parseInt(String(pageParam), 10);
        if (isNaN(parsedPage) || parsedPage < 1) {
          res.status(400).json({ error: 'Invalid page parameter' });
          return;
        }
        page = parsedPage;
      }

      if (perPageParam !== undefined) {
        const parsedPerPage = parseInt(String(perPageParam), 10);
        if (isNaN(parsedPerPage) || parsedPerPage < 1) {
          res.status(400).json({ error: 'Invalid perPage parameter' });
          return;
        }
        perPage = Math.min(parsedPerPage, MAX_PER_PAGE);
      }

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

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import {
  SetUserRole,
  LastAdminError,
  SetUserRoleUserNotFoundError,
  type UserRole,
} from '../../../application/use-cases/index.js';
import { createSupabaseClient, SupabaseUserAdminService } from '../../../infrastructure/supabase/index.js';

interface SetRoleBody {
  role?: string;
}

export class AdminSetUserRoleController {
  async setRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params['id'] as string | undefined;
      const body = req.body as SetRoleBody;

      if (!userId) {
        res.status(400).json({ error: 'Missing user id' });
        return;
      }

      if (!body.role || (body.role !== 'ADMIN' && body.role !== 'USER')) {
        res.status(400).json({ error: 'Invalid role. Must be ADMIN or USER' });
        return;
      }

      const role = body.role as UserRole;

      const supabaseClient = createSupabaseClient();
      const userAdminService = new SupabaseUserAdminService(supabaseClient);
      const useCase = new SetUserRole(userAdminService);

      const result = await useCase.execute({ targetUserId: userId, role });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error instanceof SetUserRoleUserNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error instanceof LastAdminError) {
        res.status(409).json({ error: error.message });
        return;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
}

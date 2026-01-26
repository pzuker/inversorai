import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import {
  SendUserPasswordReset,
  SendUserPasswordResetUserNotFoundError,
} from '../../../application/use-cases/index.js';
import { createSupabaseClient, SupabaseUserAdminService } from '../../../infrastructure/supabase/index.js';

interface PasswordResetBody {
  redirectTo?: string;
}

export class AdminPasswordResetController {
  async sendReset(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.params['id'] as string | undefined;
      const body = req.body as PasswordResetBody;

      if (!userId) {
        res.status(400).json({ error: 'Missing user id' });
        return;
      }

      // Use body.redirectTo if provided, otherwise fall back to env var
      const redirectTo = body.redirectTo ?? process.env['PASSWORD_RESET_REDIRECT_TO'];

      const supabaseClient = createSupabaseClient();
      const userAdminService = new SupabaseUserAdminService(supabaseClient);
      const useCase = new SendUserPasswordReset(userAdminService);

      await useCase.execute({ targetUserId: userId, redirectTo });

      res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof SendUserPasswordResetUserNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }
}

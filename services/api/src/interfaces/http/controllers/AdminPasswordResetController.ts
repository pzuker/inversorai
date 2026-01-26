import type { Response } from 'express';
import { randomUUID } from 'crypto';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import {
  SendUserPasswordReset,
  SendUserPasswordResetUserNotFoundError,
} from '../../../application/use-cases/index.js';
import { createSupabaseClient, SupabaseUserAdminService } from '../../../infrastructure/supabase/index.js';
import { logAdminAudit } from '../audit/index.js';

interface PasswordResetBody {
  redirectTo?: string;
}

export class AdminPasswordResetController {
  async sendReset(req: AuthenticatedRequest, res: Response): Promise<void> {
    const requestId = randomUUID();
    const timestamp = new Date().toISOString();
    const clientIp = req.ip;
    const userAgent = req.get('user-agent');
    const actor = {
      id: req.user?.id ?? 'unknown',
      email: req.user?.email,
      role: req.user?.role,
    };

    try {
      const userId = req.params['id'] as string | undefined;
      const body = req.body as PasswordResetBody;

      if (!userId) {
        logAdminAudit({
          type: 'ADMIN_AUDIT',
          requestId,
          timestamp,
          action: 'PASSWORD_RESET_TRIGGERED',
          result: 'error',
          actor,
          target: { id: 'unknown' },
          clientIp,
          userAgent,
          error: 'Missing user id',
        });
        res.status(400).json({ error: 'Missing user id' });
        return;
      }

      // Use body.redirectTo if provided, otherwise fall back to env var
      const redirectTo = body.redirectTo ?? process.env['PASSWORD_RESET_REDIRECT_TO'];

      const supabaseClient = createSupabaseClient();
      const userAdminService = new SupabaseUserAdminService(supabaseClient);

      // Fetch target user for audit logging (email)
      const targetUser = await userAdminService.getUserById(userId);
      const targetEmail = targetUser?.email;

      const useCase = new SendUserPasswordReset(userAdminService);

      await useCase.execute({ targetUserId: userId, redirectTo });

      logAdminAudit({
        type: 'ADMIN_AUDIT',
        requestId,
        timestamp: new Date().toISOString(),
        action: 'PASSWORD_RESET_TRIGGERED',
        result: 'success',
        actor,
        target: { id: userId, email: targetEmail },
        clientIp,
        userAgent,
        metadata: { redirectToProvided: !!body.redirectTo },
      });

      res.status(200).json({ success: true });
    } catch (error) {
      const userId = (req.params['id'] as string | undefined) ?? 'unknown';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logAdminAudit({
        type: 'ADMIN_AUDIT',
        requestId,
        timestamp: new Date().toISOString(),
        action: 'PASSWORD_RESET_TRIGGERED',
        result: 'error',
        actor,
        target: { id: userId },
        clientIp,
        userAgent,
        error: errorMessage,
      });

      if (error instanceof SendUserPasswordResetUserNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: errorMessage });
    }
  }
}

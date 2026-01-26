import type { Response } from 'express';
import { randomUUID } from 'crypto';
import type { AuthenticatedRequest } from '../middlewares/index.js';
import {
  SetUserRole,
  LastAdminError,
  SetUserRoleUserNotFoundError,
} from '../../../application/use-cases/index.js';
import { createSupabaseClient, SupabaseUserAdminService } from '../../../infrastructure/supabase/index.js';
import { logAdminAudit } from '../audit/index.js';
import { setUserRoleBodySchema, formatZodError } from '../validation/index.js';

export class AdminSetUserRoleController {
  async setRole(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const body = req.body as SetRoleBody;

      if (!userId) {
        logAdminAudit({
          type: 'ADMIN_AUDIT',
          requestId,
          timestamp,
          action: 'USER_ROLE_CHANGED',
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

      // Validate request body with Zod
      const bodyResult = setUserRoleBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        const errorMessage = formatZodError(bodyResult.error);
        logAdminAudit({
          type: 'ADMIN_AUDIT',
          requestId,
          timestamp,
          action: 'USER_ROLE_CHANGED',
          result: 'error',
          actor,
          target: { id: userId },
          clientIp,
          userAgent,
          error: errorMessage,
        });
        res.status(400).json({ error: errorMessage });
        return;
      }

      const { role } = bodyResult.data;

      const supabaseClient = createSupabaseClient();
      const userAdminService = new SupabaseUserAdminService(supabaseClient);
      const useCase = new SetUserRole(userAdminService);

      const result = await useCase.execute({ targetUserId: userId, role });

      logAdminAudit({
        type: 'ADMIN_AUDIT',
        requestId,
        timestamp: new Date().toISOString(),
        action: 'USER_ROLE_CHANGED',
        result: 'success',
        actor,
        target: { id: result.id, email: result.email },
        clientIp,
        userAgent,
        metadata: { newRole: result.role },
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const userId = (req.params['id'] as string | undefined) ?? 'unknown';
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logAdminAudit({
        type: 'ADMIN_AUDIT',
        requestId,
        timestamp: new Date().toISOString(),
        action: 'USER_ROLE_CHANGED',
        result: 'error',
        actor,
        target: { id: userId },
        clientIp,
        userAgent,
        error: errorMessage,
      });

      if (error instanceof SetUserRoleUserNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error instanceof LastAdminError) {
        res.status(409).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: errorMessage });
    }
  }
}

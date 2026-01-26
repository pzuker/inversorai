import { z } from 'zod';

/**
 * Format Zod validation errors into a user-friendly string.
 * Returns a single-line summary for simple errors, or a list for multiple issues.
 */
export function formatZodError(error: z.ZodError): string {
  const issues = error.issues;

  if (issues.length === 1 && issues[0]) {
    const issue = issues[0];
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  }

  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
      return `${path}${issue.message}`;
    })
    .join('; ');
}

// Admin endpoint schemas

export const setUserRoleBodySchema = z.object({
  role: z.enum(['ADMIN', 'USER'], {
    message: 'role must be ADMIN or USER',
  }),
});

export const passwordResetBodySchema = z.object({
  redirectTo: z.string().url('redirectTo must be a valid URL').optional(),
}).strict();

export const listUsersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 1;
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  perPage: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 50;
      if (isNaN(parsed) || parsed < 1) return 50;
      return Math.min(parsed, 100); // Cap at 100
    }),
});

export type SetUserRoleBody = z.infer<typeof setUserRoleBodySchema>;
export type PasswordResetBody = z.infer<typeof passwordResetBodySchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

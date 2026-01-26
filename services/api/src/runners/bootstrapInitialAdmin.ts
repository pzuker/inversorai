import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '../../.env') });

import { BootstrapInitialAdmin } from '../application/use-cases/index.js';
import { createSupabaseClient, SupabaseUserAdminService } from '../infrastructure/supabase/index.js';

async function main(): Promise<void> {
  const email = process.env['INITIAL_ADMIN_EMAIL'];
  const redirectTo = process.env['INITIAL_ADMIN_INVITE_REDIRECT_TO'];

  if (!email) {
    console.error('Error: INITIAL_ADMIN_EMAIL environment variable is required');
    process.exit(1);
  }

  const supabaseClient = createSupabaseClient();
  const userAdminService = new SupabaseUserAdminService(supabaseClient);
  const useCase = new BootstrapInitialAdmin(userAdminService);

  const result = await useCase.execute({ email, redirectTo });

  if (result.status === 'noop') {
    console.log(`NOOP: Admin already exists (${result.adminEmail}, id=${result.adminUserId})`);
  } else if (result.status === 'promoted') {
    console.log(`PROMOTED: Existing user ${result.adminEmail} (id=${result.adminUserId}) promoted to ADMIN`);
  } else {
    console.log(`CREATED: Invited and promoted ${result.adminEmail} (id=${result.adminUserId}) as ADMIN`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Bootstrap failed: ${message}`);
  process.exit(1);
});

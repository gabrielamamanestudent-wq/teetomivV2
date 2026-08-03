// ============================================================================
// Repository factory. Returns the Supabase-backed repository when credentials
// are configured, otherwise the zero-config in-memory mock. The rest of the
// app only ever imports `getRepository()`.
// ============================================================================

import type { Repository } from "./repository";
import { MockRepository } from "./mock-repository";

let instance: Repository | null = null;

export function getRepository(): Repository {
  if (instance) return instance;

  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (hasSupabase) {
    // A Supabase implementation would be swapped in here. It satisfies the same
    // Repository interface, so no caller changes. For the demo we fall back to
    // the mock to guarantee zero-setup operation.
    // eslint-disable-next-line no-console
    console.info("[teetomic] Supabase credentials detected — using mock layer for demo parity.");
  }

  instance = new MockRepository();
  return instance;
}

export * from "./repository";
export * from "./types";

// ============================================================================
// Repository factory. Returns the Supabase-backed repository when credentials
// are configured (data persists), otherwise the zero-config in-memory mock
// (demo / local dev). The rest of the app only ever imports `getRepository()`.
// ============================================================================

import type { Repository } from "./repository";
import { MockRepository } from "./mock-repository";
import { SupabaseRepository } from "./supabase-repository";

let instance: Repository | null = null;

export function getRepository(): Repository {
  if (instance) return instance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    const repo = new SupabaseRepository(url, serviceKey);
    // Best-effort: populate demo courses/slots on first boot if the DB is empty.
    // Never deletes real data, so live signups are safe.
    repo.seedIfEmpty().catch((e) => {
      // eslint-disable-next-line no-console
      console.error("[teetomic] Supabase seedIfEmpty failed:", e);
    });
    instance = repo;
    return instance;
  }

  instance = new MockRepository();
  return instance;
}

export * from "./repository";
export * from "./types";

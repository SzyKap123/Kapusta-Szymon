import { config, required } from "../config";
import { seedDemo } from "./demoSeed";
import { MemoryRepository } from "./memoryRepo";
import type { Repository } from "./repository";
import { SupabaseRepository } from "./supabaseRepo";

const g = globalThis as unknown as { __repo?: Repository };

/** Repozytorium dla serwera: Supabase w produkcji, pamięć w trybie demo. */
export function getRepo(): Repository {
  if (g.__repo) return g.__repo;
  if (config.demoMode) {
    const repo = new MemoryRepository();
    seedDemo(repo);
    g.__repo = repo;
  } else {
    g.__repo = new SupabaseRepository(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SECRET_KEY"));
  }
  return g.__repo;
}

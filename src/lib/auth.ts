import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ANONYMOUS, type Viewer } from "./access";
import { config, required } from "./config";
import { getRepo } from "./db";
import { isSubscriptionActive } from "./db/repository";

export interface CurrentUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export const DEMO_COOKIE = "demo_user";

/** Klient Supabase z sesją użytkownika (ciasteczka). */
export async function getSupabase() {
  const store = await cookies();
  return createServerClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Wywołanie z komponentu serwerowego — sesję odświeża proxy.ts.
        }
      },
    },
  });
}

export function isAdminEmail(email: string): boolean {
  return config.adminEmails.includes(email.toLowerCase());
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (config.demoMode) {
    const id = (await cookies()).get(DEMO_COOKIE)?.value;
    const profile = id ? await getRepo().getProfile(id) : null;
    return profile ? { id: profile.id, email: profile.email, isAdmin: profile.id === "demo-admin" } : null;
  }
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return null;
  return { id: data.user.id, email: data.user.email, isAdmin: isAdminEmail(data.user.email) };
}

export async function getViewer(user?: CurrentUser | null): Promise<Viewer> {
  const u = user === undefined ? await getCurrentUser() : user;
  if (!u) return ANONYMOUS;
  const repo = getRepo();
  const [sub, purchased] = await Promise.all([repo.getSubscription(u.id), repo.listAccessibleCouponIds(u.id)]);
  return {
    userId: u.id,
    subscribed: isSubscriptionActive(sub, new Date()),
    purchasedCouponIds: new Set(purchased),
    isAdmin: u.isAdmin,
  };
}

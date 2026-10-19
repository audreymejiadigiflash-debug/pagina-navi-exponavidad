import "server-only";
import { redirect } from "next/navigation";
import { env, isSupabaseConfigured } from "./env";
import { createSessionClient } from "./supabase/server";

export type AdminUser = { id: string; email: string };

/** Returns the signed-in user only if their email is listed in ADMIN_EMAILS. */
export async function getAdminUser(): Promise<AdminUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  if (!user || !email || !env.adminEmails.includes(email)) return null;
  return { id: user.id, email };
}

/** Use at the top of every admin page and Server Action. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  return admin;
}

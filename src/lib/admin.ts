import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_EMAIL = "pedro.maia@brio.com.br";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email?.toLowerCase() !== ADMIN_EMAIL || user.app_metadata?.role !== "admin") redirect("/dashboard");
  return { supabase, user };
}

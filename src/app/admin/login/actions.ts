"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

export type LoginState = { error: string; email: string };

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa tus datos.", email };
  if (!isSupabaseConfigured()) {
    return { error: "El panel aún no está conectado a Supabase. Revisa las variables de entorno.", email };
  }
  if (!env.adminEmails.includes(parsed.data.email)) {
    // Same message as a wrong password, so the form does not reveal which emails are admins.
    return { error: "Correo o contraseña incorrectos.", email };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Correo o contraseña incorrectos.", email };
  redirect("/admin");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

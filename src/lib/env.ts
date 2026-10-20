import "server-only";

/*
 * Server-side environment access. Every integration is optional so the storefront
 * can run in demo mode (sample catalog, checkout disabled) before it is configured.
 */

function read(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export const env = {
  siteUrl: (read("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000").replace(/\/+$/, ""),
  supabaseUrl: read("NEXT_PUBLIC_SUPABASE_URL"),
  // Supabase renamed its keys (anon → publishable, service_role → secret); accept both.
  supabaseAnonKey: read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") || read("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: read("SUPABASE_SECRET_KEY") || read("SUPABASE_SERVICE_ROLE_KEY"),
  mercadoPagoAccessToken: read("MERCADOPAGO_ACCESS_TOKEN"),
  mercadoPagoWebhookSecret: read("MERCADOPAGO_WEBHOOK_SECRET"),
  adminEmails: read("ADMIN_EMAILS")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
};

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey);
}

export function isCheckoutConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(env.mercadoPagoAccessToken);
}

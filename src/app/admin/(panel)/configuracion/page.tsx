import type { Metadata } from "next";
import { AdminHeading } from "@/components/admin/admin-heading";
import { SettingsForm } from "@/components/admin/settings-form";
import { getAdminSettings } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Configuración" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getAdminSettings();
  return (
    <>
      <AdminHeading title="Configuración" description="Envíos, datos de contacto y textos de la tienda." />
      <SettingsForm settings={settings} />
    </>
  );
}

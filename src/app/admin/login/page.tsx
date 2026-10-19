import type { Metadata } from "next";
import { Logo } from "@/components/layout/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acceso al panel",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ivory px-4 py-16">
      <div className="w-full max-w-md border border-line bg-white p-8 md:p-10">
        <div className="mb-8 text-center">
          <Logo compact />
          <h1 className="mt-6 text-[2rem]">Panel de administración</h1>
          <p className="mt-2 text-[0.9rem] text-ink-soft">Entra con tu correo y contraseña de administrador.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}

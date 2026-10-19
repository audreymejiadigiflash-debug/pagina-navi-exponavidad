"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = { error: "", email: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="login-email" className="field-label">
          Correo electrónico
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className="input"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>
      <div>
        <label htmlFor="login-password" className="field-label">
          Contraseña
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>
      {state.error ? (
        <p id="login-error" role="alert" className="field-error">
          {state.error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary w-full" disabled={pending} aria-busy={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

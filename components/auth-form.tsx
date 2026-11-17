"use client";

import { useActionState } from "react";
import { authenticate, type AuthState } from "@/app/actions/auth";

const initialState: AuthState = {};

export function AuthForm() {
  const [state, formAction, pending] = useActionState(
    authenticate,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 rounded-lg border-2 border-stone-400 bg-white px-3 text-base font-normal text-stone-950 outline-none focus:border-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={6}
          required
          className="h-12 rounded-lg border-2 border-stone-400 bg-white px-3 text-base font-normal text-stone-950 outline-none focus:border-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-stone-700" role="status">
          {state.message}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          name="intent"
          value="signin"
          disabled={pending}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-stone-950 px-5 text-base font-bold text-white disabled:opacity-50"
        >
          {pending ? "Working…" : "Sign in"}
        </button>
        <button
          type="submit"
          name="intent"
          value="signup"
          disabled={pending}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-full border-2 border-stone-950 bg-white px-5 text-sm font-bold text-stone-950 disabled:opacity-50"
        >
          Create account
        </button>
      </div>
    </form>
  );
}

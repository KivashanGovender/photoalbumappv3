import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#f3eee6] px-4 py-10 text-stone-950 sm:px-6 sm:py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.2em] uppercase"
        >
          EventAlbum
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Host sign in
        </h1>
        <p className="mt-2 text-sm font-medium leading-6 text-stone-800">
          Sign in to manage your events, or create a host account.
        </p>
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
          <AuthForm />
        </div>
      </div>
    </main>
  );
}

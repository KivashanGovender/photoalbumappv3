import Link from "next/link";
import { signOut } from "@/app/actions/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-[#f3eee6] text-stone-950">
      <header className="border-b border-stone-300/80">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-[0.2em] uppercase"
          >
            EventAlbum
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/me" className="text-sm font-semibold text-stone-950 underline">
              Saved Albums
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm font-semibold text-stone-950 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </div>
    </div>
  );
}

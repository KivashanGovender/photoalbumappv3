import Link from "next/link";

export function InviteRequired() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 bg-[#f3eee6] px-5 text-stone-950">
      <p className="text-xs font-bold tracking-[0.2em] uppercase">EventAlbum</p>
      <h1 className="text-3xl font-bold tracking-tight">Invite Required</h1>
      <p className="text-sm font-medium leading-6 text-stone-800">
        This album is private. Open the invite link from the host to view it anytime.
      </p>
      <Link href="/me" className="w-fit text-sm font-semibold underline">
        Saved Albums
      </Link>
    </main>
  );
}

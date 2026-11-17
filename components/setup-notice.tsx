export function SetupNotice() {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
      Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
      <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
      <code className="font-mono">.env.local</code>, then restart{" "}
      <code className="font-mono">npm run dev</code>. Use the anon key from
      your Supabase project settings.
    </div>
  );
}

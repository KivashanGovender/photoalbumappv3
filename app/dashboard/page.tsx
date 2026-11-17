import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SetupNotice } from "@/components/setup-notice";
import { formatEventDate, type EventRecord } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="animate-pulse text-sm font-semibold text-stone-800">Loading events…</p>}>
      <HostEvents />
    </Suspense>
  );
}

async function HostEvents() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <section className="grid gap-6">
        <DashboardHeading />
        <SetupNotice />
      </section>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("events")
    .select("id, host_id, title, description, event_date, location, slug, is_public, created_at")
    .eq("host_id", user.id)
    .order("created_at", { ascending: false });

  const events = (data ?? []) as EventRecord[];

  return (
    <section className="grid gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <DashboardHeading email={user.email} />
        <Link
          href="/dashboard/new"
          className="inline-flex h-12 items-center justify-center rounded-full bg-stone-950 px-6 text-base font-bold text-white"
        >
          Create New Event
        </Link>
      </div>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error.message}
        </p>
      ) : null}
      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-16 text-center">
          <p className="text-lg font-medium">No events yet</p>
          <p className="mt-2 text-sm font-medium text-stone-800">
            Create an album and share the guest link.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/dashboard/${event.slug}`}
                className="block rounded-2xl border border-stone-200 bg-white px-5 py-4 hover:border-stone-400"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-medium">{event.title}</h2>
                    <p className="mt-1 text-sm font-medium text-stone-800">
                      {[
                        event.event_date
                          ? formatEventDate(event.event_date)
                          : null,
                        event.location,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Date and location not set"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold tracking-wide text-stone-800 uppercase">
                    {event.is_public ? "Public" : "Private"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DashboardHeading({ email }: { email?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-stone-800">Host dashboard</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Your events</h1>
      {email ? <p className="mt-2 text-sm font-medium text-stone-800">{email}</p> : null}
    </div>
  );
}

import Link from "next/link";
import { EventForm } from "@/components/event-form";

export default function NewEventPage() {
  return (
    <section className="mx-auto grid w-full max-w-xl gap-8">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-stone-950 underline">
          Back to events
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Create an event
        </h1>
        <p className="mt-2 text-sm font-medium leading-6 text-stone-800">
          A unique guest link is created when you save. The album is tied to
          your host account.
        </p>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <EventForm />
      </div>
    </section>
  );
}

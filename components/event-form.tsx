"use client";

import { useActionState } from "react";
import { createEvent, type CreateEventState } from "@/app/actions/events";

const initialState: CreateEventState = {};

const fieldClassName =
  "rounded-lg border-2 border-stone-400 bg-white px-3 text-base font-normal text-stone-950 outline-none focus:border-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950";

export function EventForm() {
  const [state, formAction, pending] = useActionState(createEvent, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Title
        <input
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder="Maya & Jordan"
          className={`h-11 ${fieldClassName}`}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-stone-800">
        Description
        <textarea
          name="description"
          rows={4}
          maxLength={2000}
          placeholder="What guests should know about the album"
          className={`py-2 ${fieldClassName}`}
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-stone-800">
          Date
          <input name="event_date" type="date" className={`h-11 ${fieldClassName}`} />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone-800">
          Location
          <input
            name="location"
            type="text"
            maxLength={200}
            placeholder="City or venue"
            className={`h-11 ${fieldClassName}`}
          />
        </label>
      </div>
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center rounded-full bg-stone-950 px-6 text-base font-bold text-white disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create event"}
      </button>
    </form>
  );
}

"use server";

import { redirect } from "next/navigation";
import { createEventSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export type CreateEventState = {
  error?: string;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function createEvent(
  _previous: CreateEventState,
  formData: FormData,
): Promise<CreateEventState> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      error:
        "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then restart the dev server.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!title || title.length > 120) {
    return { error: "Add a title of 120 characters or fewer." };
  }

  if (description.length > 2000) {
    return { error: "Keep the description under 2000 characters." };
  }

  if (location.length > 200) {
    return { error: "Keep the location under 200 characters." };
  }

  if (eventDate && !datePattern.test(eventDate)) {
    return { error: "Choose a valid date." };
  }

  let lastError = "Could not create the event.";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = createEventSlug(title);
    const { error } = await supabase.from("events").insert({
      host_id: user.id,
      title,
      description: description || null,
      event_date: eventDate || null,
      location: location || null,
      slug,
      is_public: false,
    });

    if (!error) {
      redirect(`/dashboard/${slug}`);
    }

    lastError = error.message;

    if (error.code !== "23505") {
      return { error: lastError };
    }
  }

  return { error: lastError };
}

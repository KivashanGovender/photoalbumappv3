import { connection } from "next/server";
import { redirect } from "next/navigation";
import { findEventBySlug, registerInvitedGuest } from "@/lib/album-access";
import { inviteTokenMatches } from "@/lib/invites";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; token: string }> },
) {
  await connection();
  const { slug, token } = await params;
  const event = await findEventBySlug(slug);

  if (!event || !inviteTokenMatches(event.id, decodeURIComponent(token))) {
    redirect(event ? `/e/${event.slug}` : "/");
  }

  const registered = await registerInvitedGuest(event.id);

  if (!registered) {
    return new Response("The invite could not be saved. Try the link again.", { status: 500 });
  }

  redirect(`/e/${event.slug}`);
}

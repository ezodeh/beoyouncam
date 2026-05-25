export type EventInfo = {
  token: string;
  start_at: string | null;
  end_at: string | null;
  is_album_published: boolean | null;
};

export function getGuestRoute(e: EventInfo, hasParticipant: boolean): string {
  const now = Date.now();
  const start = e.start_at ? new Date(e.start_at).getTime() : null;
  const end = e.end_at ? new Date(e.end_at).getTime() : null;

  if (start && now < start) return `/event/${e.token}/soon`;
  if (end && now > end) return `/event/${e.token}/ended`;
  if (!hasParticipant) return `/event/${e.token}/welcome`;
  return `/event/${e.token}/camera`;
}

export function participantKey(token: string) {
  return `participant:${token}`;
}

export function getStoredParticipantId(token: string): string | null {
  try {
    return localStorage.getItem(participantKey(token));
  } catch {
    return null;
  }
}

export function setStoredParticipantId(token: string, id: string) {
  try {
    localStorage.setItem(participantKey(token), id);
  } catch {
    /* ignore */
  }
}
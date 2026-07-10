export type PanelPage = "appearance" | "settings";

export interface PanelSession {
  page: PanelPage;
  // Transient: which channel to send the finished panel to. Not persisted —
  // it's specific to a single /ticketpanel invocation, not a durable setting.
  targetChannelId?: string;
}

const sessions = new Map<string, PanelSession>();

function key(guildId: string, userId: string): string {
  return `${guildId}:${userId}`;
}

export function getSession(guildId: string, userId: string): PanelSession {
  const sessionKey = key(guildId, userId);
  let session = sessions.get(sessionKey);
  if (!session) {
    session = { page: "appearance" };
    sessions.set(sessionKey, session);
  }
  return session;
}

export function startSession(guildId: string, userId: string): PanelSession {
  const session: PanelSession = { page: "appearance" };
  sessions.set(key(guildId, userId), session);
  return session;
}

export function clearSession(guildId: string, userId: string): void {
  sessions.delete(key(guildId, userId));
}

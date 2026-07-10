import { DEFAULT_COLOR } from "./constants.js";

export interface EmbedDraft {
  title?: string;
  description?: string;
  color: number;
  footer?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  authorText?: string;
  targetChannelId?: string;
}

// One in-progress draft per user. Ephemeral panels are only visible/clickable
// by the user who opened them, so keying by user ID (not message ID) is safe
// and lets a user's edits persist even if they close and reopen the panel.
const drafts = new Map<string, EmbedDraft>();

function createEmptyDraft(): EmbedDraft {
  return { color: DEFAULT_COLOR };
}

export function getDraft(userId: string): EmbedDraft {
  let draft = drafts.get(userId);
  if (!draft) {
    draft = createEmptyDraft();
    drafts.set(userId, draft);
  }
  return draft;
}

export function resetDraft(userId: string): EmbedDraft {
  const draft = createEmptyDraft();
  drafts.set(userId, draft);
  return draft;
}

export function clearDraft(userId: string): void {
  drafts.delete(userId);
}

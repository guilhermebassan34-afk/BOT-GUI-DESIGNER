// Ticket system configuration. Values are sourced from environment variables
// (set via the Replit secrets/env tool) instead of being hardcoded here.

export function getTicketCategoryId(): string {
  const value = process.env.TICKET_CATEGORY_ID;
  if (!value) {
    throw new Error(
      "TICKET_CATEGORY_ID is not set. Add it as an env var with the ID of the category tickets should be created under.",
    );
  }
  return value;
}

export function getStaffRoleId(): string {
  const value = process.env.STAFF_ROLE_ID;
  if (!value) {
    throw new Error(
      "STAFF_ROLE_ID is not set. Add it as an env var with the ID of the role that should have access to tickets.",
    );
  }
  return value;
}

export function getLogChannelId(): string {
  const value = process.env.LOG_CHANNEL_ID;
  if (!value) {
    throw new Error(
      "LOG_CHANNEL_ID is not set. Add it as an env var with the ID of the channel where ticket logs should be posted.",
    );
  }
  return value;
}

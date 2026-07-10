export const TICKETPANEL_PREFIX = "ticketpanel";

// Buttons
export const BTN_TITLE = "ticketpanel:btn:title";
export const BTN_DESCRIPTION = "ticketpanel:btn:description";
export const BTN_FOOTER = "ticketpanel:btn:footer";
export const BTN_AUTHOR = "ticketpanel:btn:author";
export const BTN_IMAGE = "ticketpanel:btn:image";
export const BTN_THUMBNAIL = "ticketpanel:btn:thumbnail";
export const BTN_CUSTOM_COLOR = "ticketpanel:btn:customcolor";
export const BTN_ADD_BUTTON = "ticketpanel:btn:addbutton";
export const BTN_PREVIEW = "ticketpanel:btn:preview";
export const BTN_RESET = "ticketpanel:btn:reset";
export const BTN_SEND = "ticketpanel:btn:send";
export const BTN_PAGE_APPEARANCE = "ticketpanel:btn:page:appearance";
export const BTN_PAGE_SETTINGS = "ticketpanel:btn:page:settings";

// Modals
export const MODAL_TITLE = "ticketpanel:modal:title";
export const MODAL_DESCRIPTION = "ticketpanel:modal:description";
export const MODAL_FOOTER = "ticketpanel:modal:footer";
export const MODAL_AUTHOR = "ticketpanel:modal:author";
export const MODAL_IMAGE = "ticketpanel:modal:image";
export const MODAL_THUMBNAIL = "ticketpanel:modal:thumbnail";
export const MODAL_CUSTOM_COLOR = "ticketpanel:modal:customcolor";
export const MODAL_ADD_BUTTON = "ticketpanel:modal:addbutton";

export const MODAL_INPUT_ID = "value";
export const MODAL_ADD_BUTTON_LABEL_ID = "label";
export const MODAL_ADD_BUTTON_EMOJI_ID = "emoji";

// Select menus
export const SELECT_COLOR = "ticketpanel:select:color";
export const SELECT_REMOVE_BUTTON = "ticketpanel:select:removebutton";
export const SELECT_STAFF_ROLE = "ticketpanel:select:staffrole";
export const SELECT_CATEGORY = "ticketpanel:select:category";
export const SELECT_LOG_CHANNEL = "ticketpanel:select:logchannel";
export const SELECT_TARGET_CHANNEL = "ticketpanel:select:targetchannel";

export const MAX_BUTTONS = 5;

export const COLOR_PRESETS: Array<{ label: string; value: string; color: number; emoji: string }> = [
  { label: "Azul (Blurple)", value: "blurple", color: 0x5865f2, emoji: "🔵" },
  { label: "Verde", value: "green", color: 0x57f287, emoji: "🟢" },
  { label: "Vermelho", value: "red", color: 0xed4245, emoji: "🔴" },
  { label: "Amarelo", value: "yellow", color: 0xfee75c, emoji: "🟡" },
  { label: "Roxo", value: "purple", color: 0xeb459e, emoji: "🟣" },
  { label: "Branco", value: "white", color: 0xffffff, emoji: "⚪" },
  { label: "Preto", value: "black", color: 0x23272a, emoji: "⚫" },
];

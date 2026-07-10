import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_COLOR } from "../tickets/embeds.js";
import {
  getLogChannelId as getEnvLogChannelId,
  getStaffRoleId as getEnvStaffRoleId,
  getTicketCategoryId as getEnvTicketCategoryId,
} from "../config.js";

export interface TicketOptionConfig {
  id: string;
  label: string;
  description?: string;
  emoji?: string;
}

export interface TicketPanelConfig {
  title?: string;
  description?: string;
  color: number;
  thumbnailUrl?: string;
  imageUrl?: string;
  footer?: string;
  authorText?: string;
  options: TicketOptionConfig[];
  categoryId?: string;
  staffRoleId?: string;
  logChannelId?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Persisted to disk (not just in-memory) so settings survive a bot restart.
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "ticket-panel-config.json");

function defaultConfig(): TicketPanelConfig {
  return {
    title: "🎫 Central de Suporte",
    description:
      "Precisa de ajuda? Clique em um dos botões abaixo para abrir um ticket privado com a nossa equipe.",
    color: BRAND_COLOR,
    options: [
      { id: "default", label: "Suporte", description: "Abra um ticket para atendimento geral.", emoji: "🎫" },
    ],
  };
}

function cloneConfig(config: TicketPanelConfig): TicketPanelConfig {
  return { ...config, options: config.options.map((option) => ({ ...option })) };
}

type Store = Record<string, TicketPanelConfig>;

let cache: Store | null = null;

function load(): Store {
  if (cache) return cache;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      cache = JSON.parse(raw) as Store;
    } else {
      cache = {};
    }
  } catch (error) {
    console.error("Failed to load ticket panel config, starting fresh:", error);
    cache = {};
  }
  return cache;
}

function persist(): void {
  if (!cache) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

export function getGuildConfig(guildId: string): TicketPanelConfig {
  const store = load();
  const existing = store[guildId];
  return cloneConfig(existing ?? defaultConfig());
}

export function setGuildConfig(guildId: string, config: TicketPanelConfig): void {
  const store = load();
  store[guildId] = config;
  persist();
}

export function updateGuildConfig(guildId: string, patch: Partial<TicketPanelConfig>): TicketPanelConfig {
  const current = getGuildConfig(guildId);
  const updated: TicketPanelConfig = { ...current, ...patch };
  setGuildConfig(guildId, updated);
  return updated;
}

export function resetGuildConfig(guildId: string): TicketPanelConfig {
  const fresh = defaultConfig();
  setGuildConfig(guildId, fresh);
  return fresh;
}

export function addTicketOption(guildId: string, option: TicketOptionConfig): TicketPanelConfig {
  const current = getGuildConfig(guildId);
  return updateGuildConfig(guildId, { options: [...current.options, option] });
}

export function removeTicketOption(guildId: string, optionId: string): TicketPanelConfig {
  const current = getGuildConfig(guildId);
  return updateGuildConfig(guildId, { options: current.options.filter((option) => option.id !== optionId) });
}

export function updateTicketOption(
  guildId: string,
  optionId: string,
  patch: Partial<Omit<TicketOptionConfig, "id">>,
): TicketPanelConfig {
  const current = getGuildConfig(guildId);
  const options = current.options.map((option) => (option.id === optionId ? { ...option, ...patch } : option));
  return updateGuildConfig(guildId, { options });
}

export function moveTicketOption(guildId: string, optionId: string, direction: "up" | "down"): TicketPanelConfig {
  const current = getGuildConfig(guildId);
  const index = current.options.findIndex((option) => option.id === optionId);
  if (index === -1) return current;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= current.options.length) return current;

  const options = [...current.options];
  [options[index], options[swapWith]] = [options[swapWith], options[index]];
  return updateGuildConfig(guildId, { options });
}

// Per-guild ticket system settings (category / staff role / log channel) can
// be configured via /ticketpanel and are preferred over the env-var
// fallbacks used before this feature existed, so existing setups keep working.
export function resolveTicketCategoryId(guildId: string): string {
  const config = getGuildConfig(guildId);
  if (config.categoryId) return config.categoryId;
  return getEnvTicketCategoryId();
}

export function resolveStaffRoleId(guildId: string): string {
  const config = getGuildConfig(guildId);
  if (config.staffRoleId) return config.staffRoleId;
  return getEnvStaffRoleId();
}

export function resolveLogChannelId(guildId: string): string {
  const config = getGuildConfig(guildId);
  if (config.logChannelId) return config.logChannelId;
  return getEnvLogChannelId();
}

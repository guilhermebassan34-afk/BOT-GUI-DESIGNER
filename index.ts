import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import * as ping from "./ping.js";
import * as roll from "./roll.js";
import * as painel from "./painel.js";
import * as fechar from "./fechar.js";
import * as adicionar from "./adicionar.js";
import * as remover from "./remover.js";
import * as embed from "./embed.js";
import * as embedpanel from "./embedpanel.js";
import * as ticketpanel from "./ticketpanel.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commandModules: Command[] = [ping, roll, painel, fechar, adicionar, remover, embed, embedpanel, ticketpanel];

export const commands = new Map<string, Command>(
  commandModules.map((command) => [command.data.name, command]),
);

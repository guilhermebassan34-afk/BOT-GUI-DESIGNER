import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

type ConfigRow =
  | ActionRowBuilder<ButtonBuilder>
  | ActionRowBuilder<StringSelectMenuBuilder>
  | ActionRowBuilder<RoleSelectMenuBuilder>
  | ActionRowBuilder<ChannelSelectMenuBuilder>;
import { buildTicketOpenCustomId } from "../tickets/constants.js";
import type { TicketPanelConfig } from "./store.js";
import type { PanelSession } from "./session.js";
import {
  BTN_ADD_BUTTON,
  BTN_AUTHOR,
  BTN_CUSTOM_COLOR,
  BTN_DESCRIPTION,
  BTN_FOOTER,
  BTN_IMAGE,
  BTN_PAGE_APPEARANCE,
  BTN_PAGE_SETTINGS,
  BTN_PREVIEW,
  BTN_RESET,
  BTN_SEND,
  BTN_THUMBNAIL,
  BTN_TITLE,
  COLOR_PRESETS,
  MAX_BUTTONS,
  SELECT_CATEGORY,
  SELECT_COLOR,
  SELECT_LOG_CHANNEL,
  SELECT_REMOVE_BUTTON,
  SELECT_STAFF_ROLE,
  SELECT_TARGET_CHANNEL,
} from "./constants.js";

export function buildTicketPanelEmbed(config: TicketPanelConfig): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(config.color);
  if (config.title) embed.setTitle(config.title);
  embed.setDescription(config.description ?? "*Nenhuma descrição definida ainda.*");
  if (config.footer) embed.setFooter({ text: config.footer });
  if (config.imageUrl) embed.setImage(config.imageUrl);
  if (config.thumbnailUrl) embed.setThumbnail(config.thumbnailUrl);
  if (config.authorText) embed.setAuthor({ name: config.authorText });
  return embed;
}

export function buildTicketButtonRow(config: TicketPanelConfig): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();
  for (const button of config.buttons) {
    const builder = new ButtonBuilder()
      .setCustomId(buildTicketOpenCustomId(button.id))
      .setLabel(button.label)
      .setStyle(ButtonStyle.Primary);
    if (button.emoji) {
      try {
        builder.setEmoji(button.emoji);
      } catch {
        // Ignore invalid emoji at render time; validated earlier when added.
      }
    }
    row.addComponents(builder);
  }
  return row;
}

function summarizeButtons(config: TicketPanelConfig): string {
  if (!config.buttons.length) return "*nenhum botão configurado*";
  return config.buttons.map((button) => `${button.emoji ?? "🎫"} **${button.label}**`).join(" • ");
}

export function buildConfigContent(config: TicketPanelConfig, session: PanelSession): string {
  const lines = [
    "**🛠️ Configuração do Painel de Tickets**",
    `Página atual: ${session.page === "appearance" ? "🎨 Aparência" : "⚙️ Configurações"}`,
    `Botões de ticket: ${summarizeButtons(config)}`,
  ];

  if (session.page === "settings") {
    lines.push(`Categoria: ${config.categoryId ? `<#${config.categoryId}>` : "*usa variável de ambiente, se definida*"}`);
    lines.push(
      `Cargo da equipe: ${config.staffRoleId ? `<@&${config.staffRoleId}>` : "*usa variável de ambiente, se definida*"}`,
    );
    lines.push(
      `Canal de logs: ${config.logChannelId ? `<#${config.logChannelId}>` : "*usa variável de ambiente, se definida*"}`,
    );
    lines.push(`Canal de envio: ${session.targetChannelId ? `<#${session.targetChannelId}>` : "*não selecionado*"}`);
  }

  lines.push("_As alterações são salvas automaticamente e permanecem após reiniciar o bot._");
  return lines.join("\n");
}

export function buildConfigComponents(config: TicketPanelConfig, session: PanelSession): ConfigRow[] {
  if (session.page === "appearance") {
    return buildAppearancePage(config);
  }
  return buildSettingsPage(config, session);
}

function buildAppearancePage(config: TicketPanelConfig): ConfigRow[] {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(BTN_TITLE).setLabel("Título").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN_DESCRIPTION).setLabel("Descrição").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN_AUTHOR).setLabel("Autor").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN_FOOTER).setLabel("Rodapé").setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(BTN_IMAGE).setLabel("Imagem").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN_THUMBNAIL).setLabel("Thumbnail").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN_CUSTOM_COLOR).setLabel("Cor Personalizada").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(BTN_ADD_BUTTON)
      .setLabel("+ Botão de Ticket")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(config.buttons.length >= MAX_BUTTONS),
  );

  const colorSelect = new StringSelectMenuBuilder()
    .setCustomId(SELECT_COLOR)
    .setPlaceholder("Cor predefinida")
    .addOptions(
      COLOR_PRESETS.map((preset) => ({
        label: preset.label,
        value: preset.value,
        emoji: preset.emoji,
        default: preset.color === config.color,
      })),
    );
  const row3 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(colorSelect);

  const rows: ConfigRow[] = [row1, row2, row3];

  if (config.buttons.length > 0) {
    const removeSelect = new StringSelectMenuBuilder()
      .setCustomId(SELECT_REMOVE_BUTTON)
      .setPlaceholder("Remover um botão de ticket")
      .addOptions(
        config.buttons.map((button) => ({
          label: button.label,
          value: button.id,
          emoji: button.emoji || undefined,
        })),
      );
    rows.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(removeSelect));
  }

  const row5 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(BTN_PREVIEW).setLabel("Visualizar").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(BTN_PAGE_SETTINGS).setLabel("Configurações ⚙️").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN_RESET).setLabel("Resetar").setStyle(ButtonStyle.Danger),
  );
  rows.push(row5);

  return rows;
}

function buildSettingsPage(config: TicketPanelConfig, session: PanelSession): ConfigRow[] {
  const roleSelect = new RoleSelectMenuBuilder().setCustomId(SELECT_STAFF_ROLE).setPlaceholder("Cargo da equipe");
  if (config.staffRoleId) roleSelect.setDefaultRoles(config.staffRoleId);
  const row1 = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(roleSelect);

  const categorySelect = new ChannelSelectMenuBuilder()
    .setCustomId(SELECT_CATEGORY)
    .setPlaceholder("Categoria de tickets")
    .setChannelTypes(ChannelType.GuildCategory);
  if (config.categoryId) categorySelect.setDefaultChannels(config.categoryId);
  const row2 = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(categorySelect);

  const logSelect = new ChannelSelectMenuBuilder()
    .setCustomId(SELECT_LOG_CHANNEL)
    .setPlaceholder("Canal de logs")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);
  if (config.logChannelId) logSelect.setDefaultChannels(config.logChannelId);
  const row3 = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(logSelect);

  const targetSelect = new ChannelSelectMenuBuilder()
    .setCustomId(SELECT_TARGET_CHANNEL)
    .setPlaceholder("Canal para enviar o painel")
    .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);
  if (session.targetChannelId) targetSelect.setDefaultChannels(session.targetChannelId);
  const row4 = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(targetSelect);

  const row5 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(BTN_PAGE_APPEARANCE).setLabel("🎨 Aparência").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(BTN_PREVIEW).setLabel("Visualizar").setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(BTN_SEND)
      .setLabel("Enviar Painel")
      .setStyle(ButtonStyle.Success)
      .setDisabled(!session.targetChannelId || config.buttons.length === 0),
  );

  return [row1, row2, row3, row4, row5];
}

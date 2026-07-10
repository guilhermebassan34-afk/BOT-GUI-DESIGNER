import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelSelectMenuInteraction,
  GuildMember,
  ModalBuilder,
  ModalSubmitInteraction,
  PermissionFlagsBits,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
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
  MODAL_ADD_BUTTON,
  MODAL_ADD_BUTTON_EMOJI_ID,
  MODAL_ADD_BUTTON_LABEL_ID,
  MODAL_AUTHOR,
  MODAL_CUSTOM_COLOR,
  MODAL_DESCRIPTION,
  MODAL_FOOTER,
  MODAL_IMAGE,
  MODAL_INPUT_ID,
  MODAL_THUMBNAIL,
  MODAL_TITLE,
  SELECT_CATEGORY,
  SELECT_COLOR,
  SELECT_LOG_CHANNEL,
  SELECT_REMOVE_BUTTON,
  SELECT_STAFF_ROLE,
  SELECT_TARGET_CHANNEL,
} from "./constants.js";
import { buildConfigComponents, buildConfigContent, buildTicketButtonRow, buildTicketPanelEmbed } from "./ui.js";
import {
  addTicketButton,
  getGuildConfig,
  removeTicketButton,
  resetGuildConfig,
  TicketButtonConfig,
  updateGuildConfig,
} from "./store.js";
import { clearSession, getSession } from "./session.js";
import { errorEmbed } from "../tickets/embeds.js";

type PanelInteraction =
  | ButtonInteraction
  | StringSelectMenuInteraction
  | ChannelSelectMenuInteraction
  | RoleSelectMenuInteraction
  | ModalSubmitInteraction;

function hasPermission(interaction: PanelInteraction): boolean {
  const member = interaction.member as GuildMember | null;
  return member?.permissions.has(PermissionFlagsBits.Administrator) ?? false;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidHexColor(value: string): number | null {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(value.trim());
  if (!match) return null;
  return parseInt(match[1], 16);
}

function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24) || "botao";
}

function uniqueButtonId(base: string, existing: TicketButtonConfig[]): string {
  let candidate = base;
  let suffix = 2;
  while (existing.some((button) => button.id === candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function refreshPanel(interaction: PanelInteraction, guildId: string): Promise<void> {
  const config = getGuildConfig(guildId);
  const session = getSession(guildId, interaction.user.id);
  const payload = {
    content: buildConfigContent(config, session),
    embeds: [buildTicketPanelEmbed(config)],
    components: buildConfigComponents(config, session),
  };

  // ModalSubmitInteraction only exposes `.update()` when it originated from a
  // message component, narrowed via `isFromMessage()`. Our modals always
  // open from a panel button, but fall back to `editReply` defensively.
  if (interaction.isModalSubmit()) {
    if (interaction.isFromMessage()) {
      await interaction.update(payload);
    } else {
      await interaction.editReply(payload);
    }
    return;
  }

  await interaction.update(payload);
}

function buildFieldModal(
  customId: string,
  title: string,
  options: {
    label: string;
    style: TextInputStyle;
    required: boolean;
    currentValue?: string;
    maxLength?: number;
    placeholder?: string;
  },
): ModalBuilder {
  const input = new TextInputBuilder()
    .setCustomId(MODAL_INPUT_ID)
    .setLabel(options.label)
    .setStyle(options.style)
    .setRequired(options.required);
  if (options.currentValue) input.setValue(options.currentValue);
  if (options.maxLength) input.setMaxLength(options.maxLength);
  if (options.placeholder) input.setPlaceholder(options.placeholder);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
  return new ModalBuilder().setCustomId(customId).setTitle(title).addComponents(row);
}

function buildAddButtonModal(): ModalBuilder {
  const labelInput = new TextInputBuilder()
    .setCustomId(MODAL_ADD_BUTTON_LABEL_ID)
    .setLabel("Nome do botão")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(80)
    .setPlaceholder("Ex: Suporte, Compras, Dúvidas");

  const emojiInput = new TextInputBuilder()
    .setCustomId(MODAL_ADD_BUTTON_EMOJI_ID)
    .setLabel("Emoji (opcional)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(10)
    .setPlaceholder("🎫");

  return new ModalBuilder()
    .setCustomId(MODAL_ADD_BUTTON)
    .setTitle("Adicionar Botão de Ticket")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(labelInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(emojiInput),
    );
}

async function handleButton(interaction: ButtonInteraction, guildId: string): Promise<void> {
  const config = getGuildConfig(guildId);

  switch (interaction.customId) {
    case BTN_TITLE:
      await interaction.showModal(
        buildFieldModal(MODAL_TITLE, "Editar Título", {
          label: "Título do painel de tickets",
          style: TextInputStyle.Short,
          required: false,
          currentValue: config.title,
          maxLength: 256,
        }),
      );
      return;

    case BTN_DESCRIPTION:
      await interaction.showModal(
        buildFieldModal(MODAL_DESCRIPTION, "Editar Descrição", {
          label: "Descrição do painel de tickets",
          style: TextInputStyle.Paragraph,
          required: false,
          currentValue: config.description,
          maxLength: 4000,
        }),
      );
      return;

    case BTN_AUTHOR:
      await interaction.showModal(
        buildFieldModal(MODAL_AUTHOR, "Editar Autor", {
          label: "Texto do autor",
          style: TextInputStyle.Short,
          required: false,
          currentValue: config.authorText,
          maxLength: 256,
        }),
      );
      return;

    case BTN_FOOTER:
      await interaction.showModal(
        buildFieldModal(MODAL_FOOTER, "Editar Rodapé", {
          label: "Texto do rodapé",
          style: TextInputStyle.Short,
          required: false,
          currentValue: config.footer,
          maxLength: 2048,
        }),
      );
      return;

    case BTN_IMAGE:
      await interaction.showModal(
        buildFieldModal(MODAL_IMAGE, "Editar Imagem", {
          label: "URL da imagem/banner",
          style: TextInputStyle.Short,
          required: false,
          currentValue: config.imageUrl,
          placeholder: "https://exemplo.com/banner.png",
        }),
      );
      return;

    case BTN_THUMBNAIL:
      await interaction.showModal(
        buildFieldModal(MODAL_THUMBNAIL, "Editar Thumbnail", {
          label: "URL da thumbnail",
          style: TextInputStyle.Short,
          required: false,
          currentValue: config.thumbnailUrl,
          placeholder: "https://exemplo.com/thumbnail.png",
        }),
      );
      return;

    case BTN_CUSTOM_COLOR:
      await interaction.showModal(
        buildFieldModal(MODAL_CUSTOM_COLOR, "Cor Personalizada", {
          label: "Cor em hexadecimal",
          style: TextInputStyle.Short,
          required: true,
          currentValue: `#${config.color.toString(16).padStart(6, "0")}`,
          placeholder: "#2B6CB0",
          maxLength: 7,
        }),
      );
      return;

    case BTN_ADD_BUTTON:
      if (config.buttons.length >= MAX_BUTTONS) {
        await interaction.reply({
          embeds: [errorEmbed(`Limite de ${MAX_BUTTONS} botões de ticket atingido.`)],
          ephemeral: true,
        });
        return;
      }
      await interaction.showModal(buildAddButtonModal());
      return;

    case BTN_PAGE_SETTINGS:
      getSession(guildId, interaction.user.id).page = "settings";
      await refreshPanel(interaction, guildId);
      return;

    case BTN_PAGE_APPEARANCE:
      getSession(guildId, interaction.user.id).page = "appearance";
      await refreshPanel(interaction, guildId);
      return;

    case BTN_PREVIEW:
      await interaction.reply({
        content: "🔎 Pré-visualização do painel de tickets:",
        embeds: [buildTicketPanelEmbed(config)],
        components: config.buttons.length ? [buildTicketButtonRow(config)] : [],
        ephemeral: true,
      });
      return;

    case BTN_RESET:
      resetGuildConfig(guildId);
      await refreshPanel(interaction, guildId);
      return;

    case BTN_SEND:
      await handleSend(interaction, guildId);
      return;

    default:
      return;
  }
}

async function handleSend(interaction: ButtonInteraction, guildId: string): Promise<void> {
  const config = getGuildConfig(guildId);
  const session = getSession(guildId, interaction.user.id);

  if (!session.targetChannelId) {
    await interaction.reply({
      embeds: [errorEmbed("Selecione um canal de destino na página Configurações antes de enviar.")],
      ephemeral: true,
    });
    return;
  }
  if (config.buttons.length === 0) {
    await interaction.reply({
      embeds: [errorEmbed("Adicione pelo menos um botão de ticket antes de enviar.")],
      ephemeral: true,
    });
    return;
  }

  const channel = await interaction.guild?.channels.fetch(session.targetChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ embeds: [errorEmbed("Canal de destino inválido.")], ephemeral: true });
    return;
  }

  try {
    await (channel as TextChannel).send({
      embeds: [buildTicketPanelEmbed(config)],
      components: [buildTicketButtonRow(config)],
    });
  } catch (error) {
    console.error("Failed to send ticket panel:", error);
    await interaction.reply({
      embeds: [errorEmbed("Não foi possível enviar o painel. Verifique as permissões do bot no canal selecionado.")],
      ephemeral: true,
    });
    return;
  }

  clearSession(guildId, interaction.user.id);
  await interaction.update({
    content: `✅ Painel de tickets enviado com sucesso em <#${session.targetChannelId}>!`,
    embeds: [],
    components: [],
  });
}

async function handleColorSelect(interaction: StringSelectMenuInteraction, guildId: string): Promise<void> {
  const preset = COLOR_PRESETS.find((entry) => entry.value === interaction.values[0]);
  if (preset) {
    updateGuildConfig(guildId, { color: preset.color });
  }
  await refreshPanel(interaction, guildId);
}

async function handleRemoveButtonSelect(interaction: StringSelectMenuInteraction, guildId: string): Promise<void> {
  removeTicketButton(guildId, interaction.values[0]);
  await refreshPanel(interaction, guildId);
}

async function handleStaffRoleSelect(interaction: RoleSelectMenuInteraction, guildId: string): Promise<void> {
  updateGuildConfig(guildId, { staffRoleId: interaction.values[0] });
  await refreshPanel(interaction, guildId);
}

async function handleChannelSelect(interaction: ChannelSelectMenuInteraction, guildId: string): Promise<void> {
  switch (interaction.customId) {
    case SELECT_CATEGORY:
      updateGuildConfig(guildId, { categoryId: interaction.values[0] });
      break;
    case SELECT_LOG_CHANNEL:
      updateGuildConfig(guildId, { logChannelId: interaction.values[0] });
      break;
    case SELECT_TARGET_CHANNEL:
      getSession(guildId, interaction.user.id).targetChannelId = interaction.values[0];
      break;
    default:
      return;
  }
  await refreshPanel(interaction, guildId);
}

async function handleModalSubmit(interaction: ModalSubmitInteraction, guildId: string): Promise<void> {
  switch (interaction.customId) {
    case MODAL_TITLE: {
      const value = interaction.fields.getTextInputValue(MODAL_INPUT_ID).trim();
      updateGuildConfig(guildId, { title: value || undefined });
      break;
    }

    case MODAL_DESCRIPTION: {
      const value = interaction.fields.getTextInputValue(MODAL_INPUT_ID).trim();
      updateGuildConfig(guildId, { description: value || undefined });
      break;
    }

    case MODAL_AUTHOR: {
      const value = interaction.fields.getTextInputValue(MODAL_INPUT_ID).trim();
      updateGuildConfig(guildId, { authorText: value || undefined });
      break;
    }

    case MODAL_FOOTER: {
      const value = interaction.fields.getTextInputValue(MODAL_INPUT_ID).trim();
      updateGuildConfig(guildId, { footer: value || undefined });
      break;
    }

    case MODAL_IMAGE: {
      const value = interaction.fields.getTextInputValue(MODAL_INPUT_ID).trim();
      if (value && !isValidHttpUrl(value)) {
        await interaction.reply({ embeds: [errorEmbed("URL de imagem inválida. Use um link http(s) válido.")], ephemeral: true });
        return;
      }
      updateGuildConfig(guildId, { imageUrl: value || undefined });
      break;
    }

    case MODAL_THUMBNAIL: {
      const value = interaction.fields.getTextInputValue(MODAL_INPUT_ID).trim();
      if (value && !isValidHttpUrl(value)) {
        await interaction.reply({ embeds: [errorEmbed("URL de thumbnail inválida. Use um link http(s) válido.")], ephemeral: true });
        return;
      }
      updateGuildConfig(guildId, { thumbnailUrl: value || undefined });
      break;
    }

    case MODAL_CUSTOM_COLOR: {
      const value = interaction.fields.getTextInputValue(MODAL_INPUT_ID).trim();
      const parsed = isValidHexColor(value);
      if (parsed === null) {
        await interaction.reply({ embeds: [errorEmbed("Cor inválida. Use um hexadecimal de 6 dígitos, ex: #2B6CB0.")], ephemeral: true });
        return;
      }
      updateGuildConfig(guildId, { color: parsed });
      break;
    }

    case MODAL_ADD_BUTTON: {
      const label = interaction.fields.getTextInputValue(MODAL_ADD_BUTTON_LABEL_ID).trim();
      const emojiRaw = interaction.fields.getTextInputValue(MODAL_ADD_BUTTON_EMOJI_ID).trim();
      if (!label) {
        await interaction.reply({ embeds: [errorEmbed("O nome do botão é obrigatório.")], ephemeral: true });
        return;
      }

      const config = getGuildConfig(guildId);
      if (config.buttons.length >= MAX_BUTTONS) {
        await interaction.reply({ embeds: [errorEmbed(`Limite de ${MAX_BUTTONS} botões de ticket atingido.`)], ephemeral: true });
        return;
      }

      const emoji = emojiRaw || undefined;
      if (emoji) {
        try {
          new ButtonBuilder().setCustomId("emoji-check").setLabel("t").setStyle(ButtonStyle.Primary).setEmoji(emoji);
        } catch {
          await interaction.reply({ embeds: [errorEmbed("Emoji inválido. Use um emoji padrão do Discord.")], ephemeral: true });
          return;
        }
      }

      const id = uniqueButtonId(slugify(label), config.buttons);
      addTicketButton(guildId, { id, label, emoji });
      break;
    }

    default:
      return;
  }

  await refreshPanel(interaction, guildId);
}

export async function handleTicketPanelInteraction(interaction: PanelInteraction): Promise<void> {
  if (!interaction.guildId) return;

  if (!hasPermission(interaction)) {
    await interaction.reply({
      embeds: [errorEmbed("Você precisa da permissão **Administrador** para usar este painel.")],
      ephemeral: true,
    });
    return;
  }

  const guildId = interaction.guildId;

  if (interaction.isButton()) {
    await handleButton(interaction, guildId);
    return;
  }
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === SELECT_COLOR) {
      await handleColorSelect(interaction, guildId);
      return;
    }
    if (interaction.customId === SELECT_REMOVE_BUTTON) {
      await handleRemoveButtonSelect(interaction, guildId);
      return;
    }
    return;
  }
  if (interaction.isRoleSelectMenu()) {
    await handleStaffRoleSelect(interaction, guildId);
    return;
  }
  if (interaction.isChannelSelectMenu()) {
    await handleChannelSelect(interaction, guildId);
    return;
  }
  if (interaction.isModalSubmit()) {
    await handleModalSubmit(interaction, guildId);
    return;
  }
}

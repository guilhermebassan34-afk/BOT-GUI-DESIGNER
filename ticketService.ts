import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  ButtonInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  TextChannel,
  User,
} from "discord.js";
import { resolveLogChannelId, resolveStaffRoleId, resolveTicketCategoryId, getGuildConfig } from "../ticketpanel/store.js";
import { TICKET_CLOSE_BUTTON_ID } from "./constants.js";
import { errorEmbed, logEmbed, successEmbed, ticketClosedEmbed, ticketWelcomeEmbed } from "./embeds.js";
import { buildTranscript } from "./transcript.js";

function sanitizeName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 20);
  return cleaned || "user";
}

function findExistingTicket(guild: Guild, ownerId: string): TextChannel | undefined {
  const categoryId = resolveTicketCategoryId(guild.id);
  return guild.channels.cache.find(
    (channel): channel is TextChannel =>
      channel.type === ChannelType.GuildText && channel.parentId === categoryId && channel.topic === ownerId,
  );
}

/**
 * A channel only counts as a ticket if it's a text channel, has an owner ID
 * stored in its topic, AND lives inside the configured ticket category.
 * Scoping on category membership (not just "has a topic") prevents ticket
 * commands from acting on unrelated channels that happen to have a topic set.
 */
export function isTicketChannel(channel: unknown): channel is TextChannel {
  if (!channel || typeof channel !== "object") return false;
  const candidate = channel as TextChannel;
  if (candidate.type !== ChannelType.GuildText) return false;
  if (!candidate.topic) return false;
  const guildId = (candidate as TextChannel).guild?.id;
  if (!guildId) return false;
  try {
    return candidate.parentId === resolveTicketCategoryId(guildId);
  } catch {
    return false;
  }
}

// Users currently in the middle of creating a ticket, keyed by user ID.
// Prevents a double-click / double-submit from creating two ticket channels.
const pendingOpens = new Set<string>();

// Channels currently in the middle of closing, keyed by channel ID.
// Prevents a double-click on "Fechar Ticket" (or button + /fechar together)
// from generating two transcripts / delete attempts.
const closingChannels = new Set<string>();

async function logTicketEvent(guild: Guild, embed: EmbedBuilder, files: unknown[] = []): Promise<void> {
  try {
    const logChannelId = resolveLogChannelId(guild.id);
    const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({ embeds: [embed], files: files as never[] });
    }
  } catch (error) {
    console.error("Failed to send ticket log:", error);
  }
}

export async function openTicket(interaction: ButtonInteraction, buttonId?: string): Promise<void> {
  const guild = interaction.guild;
  if (!guild) return;

  await interaction.deferReply({ ephemeral: true });

  let categoryId: string;
  let staffRoleId: string;
  try {
    categoryId = resolveTicketCategoryId(guild.id);
    staffRoleId = resolveStaffRoleId(guild.id);
  } catch (error) {
    console.error(error);
    await interaction.editReply({
      embeds: [errorEmbed("O sistema de tickets ainda não foi configurado corretamente. Avise a equipe.")],
    });
    return;
  }

  const category = guild.channels.cache.get(categoryId);
  if (!category || category.type !== ChannelType.GuildCategory) {
    await interaction.editReply({
      embeds: [errorEmbed("A categoria de tickets configurada não foi encontrada. Avise a equipe.")],
    });
    return;
  }

  const existing = findExistingTicket(guild, interaction.user.id);
  if (existing) {
    await interaction.editReply({ embeds: [errorEmbed(`Você já possui um ticket aberto: ${existing}`)] });
    return;
  }

  if (pendingOpens.has(interaction.user.id)) {
    await interaction.editReply({ embeds: [errorEmbed("Seu ticket já está sendo criado, aguarde um instante.")] });
    return;
  }
  pendingOpens.add(interaction.user.id);

  const typeLabel = buttonId
    ? getGuildConfig(guild.id).buttons.find((button) => button.id === buttonId)?.label
    : undefined;

  let channel: TextChannel;
  try {
    channel = await createTicketChannel(interaction, guild, category.id, staffRoleId, typeLabel);
  } finally {
    pendingOpens.delete(interaction.user.id);
  }

  await interaction.editReply({ embeds: [successEmbed(`Seu ticket foi criado: ${channel}`)] });
}

async function createTicketChannel(
  interaction: ButtonInteraction,
  guild: Guild,
  categoryId: string,
  staffRoleId: string,
  typeLabel?: string,
): Promise<TextChannel> {
  const namePrefix = typeLabel ? sanitizeName(typeLabel) : "ticket";
  const channel = await guild.channels.create({
    name: `${namePrefix}-${sanitizeName(interaction.user.username)}`,
    type: ChannelType.GuildText,
    parent: categoryId,
    topic: interaction.user.id,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: staffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: interaction.client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ],
  });

  const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(TICKET_CLOSE_BUTTON_ID)
      .setLabel("Fechar Ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger),
  );

  await channel.send({
    content: `<@${interaction.user.id}> | <@&${staffRoleId}>`,
    embeds: [ticketWelcomeEmbed(interaction.user, typeLabel)],
    components: [closeRow],
    allowedMentions: { users: [interaction.user.id], roles: [staffRoleId] },
  });

  await logTicketEvent(
    guild,
    logEmbed(
      "🎫 Ticket aberto",
      `**Canal:** ${channel}\n**Aberto por:** ${interaction.user.tag} (${interaction.user.id})`,
      0x57f287,
    ),
  );

  return channel;
}

export async function closeTicket(
  interaction: ButtonInteraction | ChatInputCommandInteraction,
  channel: TextChannel,
): Promise<void> {
  const guild = channel.guild;

  if (!isTicketChannel(channel)) {
    await interaction.reply({ embeds: [errorEmbed("Este canal não é um ticket válido.")], ephemeral: true });
    return;
  }
  const ownerId = channel.topic!;

  if (closingChannels.has(channel.id)) {
    await interaction.reply({
      embeds: [errorEmbed("Este ticket já está sendo fechado.")],
      ephemeral: true,
    });
    return;
  }

  let staffRoleId: string;
  try {
    staffRoleId = resolveStaffRoleId(guild.id);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      embeds: [errorEmbed("O sistema de tickets ainda não foi configurado corretamente. Avise a equipe.")],
      ephemeral: true,
    });
    return;
  }

  const member = interaction.member as GuildMember | null;
  const isStaff = member?.roles.cache.has(staffRoleId) ?? false;
  const isOwner = interaction.user.id === ownerId;
  if (!isStaff && !isOwner) {
    await interaction.reply({
      embeds: [errorEmbed("Você não tem permissão para fechar este ticket.")],
      ephemeral: true,
    });
    return;
  }

  closingChannels.add(channel.id);

  await interaction.reply({ embeds: [successEmbed("Fechando o ticket e gerando o transcript...")] });

  const attachments = [];
  try {
    attachments.push(await buildTranscript(channel));
  } catch (error) {
    console.error("Failed to build transcript:", error);
  }

  const owner = await guild.client.users.fetch(ownerId).catch(() => null);

  await logTicketEvent(
    guild,
    logEmbed(
      "🔒 Ticket fechado",
      `**Canal:** #${channel.name}\n**Dono:** ${owner ? `${owner.tag} (${owner.id})` : ownerId}\n**Fechado por:** ${interaction.user.tag} (${interaction.user.id})`,
      0xed4245,
    ),
    attachments,
  );

  await channel.send({ embeds: [ticketClosedEmbed(interaction.user)] });

  // Note: closingChannels is intentionally not cleared on success — the
  // channel is about to be deleted, so there is no window left to re-close it.
  setTimeout(() => {
    channel.delete(`Ticket fechado por ${interaction.user.tag}`).catch((error) => {
      console.error("Failed to delete ticket channel:", error);
      closingChannels.delete(channel.id);
    });
  }, 5000);
}

export async function addMember(
  interaction: ChatInputCommandInteraction,
  channel: TextChannel,
  user: User,
): Promise<void> {
  if (!isTicketChannel(channel)) {
    await interaction.reply({ embeds: [errorEmbed("Este canal não é um ticket válido.")], ephemeral: true });
    return;
  }
  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
    AttachFiles: true,
  });
  await interaction.reply({ embeds: [successEmbed(`${user} foi adicionado ao ticket.`)] });
}

export async function removeMember(
  interaction: ChatInputCommandInteraction,
  channel: TextChannel,
  user: User,
): Promise<void> {
  if (!isTicketChannel(channel)) {
    await interaction.reply({ embeds: [errorEmbed("Este canal não é um ticket válido.")], ephemeral: true });
    return;
  }
  if (user.id === channel.topic) {
    await interaction.reply({ embeds: [errorEmbed("Não é possível remover o dono do ticket.")], ephemeral: true });
    return;
  }
  await channel.permissionOverwrites.edit(user.id, {
    ViewChannel: false,
    SendMessages: false,
  });
  await interaction.reply({ embeds: [successEmbed(`${user} foi removido do ticket.`)] });
}

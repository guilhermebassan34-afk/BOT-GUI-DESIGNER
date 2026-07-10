import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed } from "../tickets/embeds.js";
import { getGuildConfig } from "../ticketpanel/store.js";
import { startSession } from "../ticketpanel/session.js";
import { buildConfigComponents, buildConfigContent, buildTicketPanelEmbed } from "../ticketpanel/ui.js";

export const data = new SlashCommandBuilder()
  .setName("ticketpanel")
  .setDescription("Abre o painel avançado de configuração do sistema de tickets")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember | null;
  if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      embeds: [errorEmbed("Você precisa da permissão **Administrador** para usar este comando.")],
      ephemeral: true,
    });
    return;
  }
  if (!interaction.guildId) {
    await interaction.reply({ embeds: [errorEmbed("Este comando só pode ser usado em um servidor.")], ephemeral: true });
    return;
  }

  const config = getGuildConfig(interaction.guildId);
  // Each invocation starts a fresh session (page reset to "appearance", no
  // target channel carried over) while keeping the persisted config as-is.
  const session = startSession(interaction.guildId, interaction.user.id);

  await interaction.reply({
    content: buildConfigContent(config, session),
    embeds: [buildTicketPanelEmbed(config)],
    components: buildConfigComponents(config, session),
    ephemeral: true,
  });
}

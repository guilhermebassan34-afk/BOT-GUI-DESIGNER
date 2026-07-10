import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed, successEmbed } from "../tickets/embeds.ts";
import { getGuildConfig } from "../ticketpanel/store.js";
import { buildTicketButtonRow, buildTicketPanelEmbed } from "../ticketpanel/ui.js";

export const data = new SlashCommandBuilder()
  .setName("painel")
  .setDescription("Envia o painel de abertura de tickets neste canal")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.channel;
  if (!interaction.guild || !channel || !channel.isTextBased() || !("send" in channel)) {
    await interaction.reply({
      embeds: [errorEmbed("Este comando só pode ser usado em um canal de texto do servidor.")],
      ephemeral: true,
    });
    return;
  }

  const config = getGuildConfig(interaction.guild.id);
  if (config.buttons.length === 0) {
    await interaction.reply({
      embeds: [errorEmbed("Nenhum botão de ticket configurado. Use /ticketpanel para configurar o painel primeiro.")],
      ephemeral: true,
    });
    return;
  }

  await channel.send({ embeds: [buildTicketPanelEmbed(config)], components: [buildTicketButtonRow(config)] });
  await interaction.reply({ embeds: [successEmbed("Painel enviado com sucesso!")], ephemeral: true });
}

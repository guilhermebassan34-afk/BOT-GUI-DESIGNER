import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { errorEmbed } from "../tickets/embeds.js";
import { closeTicket, isTicketChannel } from "../tickets/ticketService.js";

export const data = new SlashCommandBuilder()
  .setName("fechar")
  .setDescription("Fecha o ticket atual e gera um transcript");

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.channel;
  if (!isTicketChannel(channel)) {
    await interaction.reply({
      embeds: [errorEmbed("Este comando só pode ser usado dentro de um canal de ticket.")],
      ephemeral: true,
    });
    return;
  }

  await closeTicket(interaction, channel);
}

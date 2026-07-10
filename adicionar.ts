import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder } from "discord.js";
import { getStaffRoleId } from "../config.js";
import { errorEmbed } from "../tickets/embeds.js";
import { addMember, isTicketChannel } from "../tickets/ticketService.js";

export const data = new SlashCommandBuilder()
  .setName("adicionar")
  .setDescription("Adiciona um usuário ao ticket atual")
  .addUserOption((option) =>
    option.setName("usuario").setDescription("Usuário a ser adicionado").setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const channel = interaction.channel;
  if (!isTicketChannel(channel)) {
    await interaction.reply({
      embeds: [errorEmbed("Este comando só pode ser usado dentro de um canal de ticket.")],
      ephemeral: true,
    });
    return;
  }

  let staffRoleId: string;
  try {
    staffRoleId = getStaffRoleId();
  } catch (error) {
    console.error(error);
    await interaction.reply({
      embeds: [errorEmbed("O sistema de tickets ainda não foi configurado corretamente. Avise a equipe.")],
      ephemeral: true,
    });
    return;
  }

  const member = interaction.member as GuildMember | null;
  if (!member?.roles.cache.has(staffRoleId)) {
    await interaction.reply({ embeds: [errorEmbed("Apenas a equipe pode usar este comando.")], ephemeral: true });
    return;
  }

  const user = interaction.options.getUser("usuario", true);
  await addMember(interaction, channel, user);
}

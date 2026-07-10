import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

const EMBED_COLOR = 0x3498db; // default blue

export const data = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("Envia uma mensagem em formato de embed")
  .addStringOption((option) =>
    option.setName("message").setDescription("Conteúdo da embed").setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const message = interaction.options.getString("message", true);

  const embed = new EmbedBuilder().setColor(EMBED_COLOR).setDescription(message);

  await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
}

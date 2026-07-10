import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Check whether the bot is alive and see its latency");

export async function execute(interaction: ChatInputCommandInteraction) {
  const sent = await interaction.reply({ content: "Pinging...", withResponse: true });
  const latency = sent.resource?.message
    ? sent.resource.message.createdTimestamp - interaction.createdTimestamp
    : 0;
  await interaction.editReply(
    `Pong! Roundtrip: ${latency}ms · API latency: ${Math.round(interaction.client.ws.ping)}ms`,
  );
}

import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("roll")
  .setDescription("Roll one or more dice")
  .addStringOption((option) =>
    option
      .setName("dice")
      .setDescription('Dice notation, e.g. "1d6" or "2d20" (defaults to 1d6)')
      .setRequired(false),
  );

const DICE_PATTERN = /^(\d{1,2})d(\d{1,4})$/i;

export async function execute(interaction: ChatInputCommandInteraction) {
  const notation = interaction.options.getString("dice") ?? "1d6";
  const match = DICE_PATTERN.exec(notation.trim());

  if (!match) {
    await interaction.reply({
      content: "That isn't valid dice notation. Try something like `1d6` or `2d20`.",
      ephemeral: true,
      allowedMentions: { parse: [] },
    });
    return;
  }

  const count = Number(match[1]);
  const sides = Number(match[2]);

  if (count < 1 || count > 20 || sides < 2 || sides > 1000) {
    await interaction.reply({
      content: "Please use between 1-20 dice with 2-1000 sides each.",
      ephemeral: true,
      allowedMentions: { parse: [] },
    });
    return;
  }

  const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
  const total = rolls.reduce((sum, roll) => sum + roll, 0);

  await interaction.reply({
    content:
      count === 1
        ? `You rolled a **${total}** (d${sides})`
        : `You rolled ${rolls.map((roll) => `**${roll}**`).join(", ")} — total **${total}** (${count}d${sides})`,
    allowedMentions: { parse: [] },
  });
}

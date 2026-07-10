import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { errorEmbed } from "../tickets/embeds.js";
import { resetDraft } from "../embedbuilder/state.js";
import { buildDraftEmbed, buildPanelComponents, buildPanelContent } from "../embedbuilder/ui.js";

export const data = new SlashCommandBuilder()
  .setName("embedpanel")
  .setDescription("Abre o painel avançado de criação de embeds")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction: ChatInputCommandInteraction) {
  const member = interaction.member as GuildMember | null;
  if (!member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      embeds: [errorEmbed("Você precisa da permissão **Gerenciar Servidor** para usar este comando.")],
      ephemeral: true,
    });
    return;
  }

  // Start each /embedpanel invocation from a clean draft so a stale value
  // from a previous, already-sent embed doesn't leak into a new one.
  const draft = resetDraft(interaction.user.id);

  await interaction.reply({
    content: buildPanelContent(draft),
    embeds: [buildDraftEmbed(draft)],
    components: buildPanelComponents(draft),
    ephemeral: true,
  });
}

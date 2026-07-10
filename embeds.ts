import { EmbedBuilder, User } from "discord.js";

export const BRAND_COLOR = 0x2b6cb0;
export const SUCCESS_COLOR = 0x57f287;
export const ERROR_COLOR = 0xed4245;

export function ticketWelcomeEmbed(owner: User, typeLabel?: string) {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle("🎫 Ticket Aberto")
    .setDescription(
      `Olá, ${owner}! Obrigado por entrar em contato${typeLabel ? ` sobre **${typeLabel}**` : ""}.\n\nDescreva seu problema com o máximo de detalhes possível e aguarde um de nossos atendentes. Quando o assunto for resolvido, clique em **Fechar Ticket**.`,
    )
    .setFooter({ text: `Aberto por ${owner.tag}` })
    .setTimestamp();
}

export function ticketClosedEmbed(closedBy: User) {
  return new EmbedBuilder()
    .setColor(ERROR_COLOR)
    .setTitle("🔒 Ticket Fechado")
    .setDescription(`Este ticket foi fechado por ${closedBy}. O canal será removido em instantes.`)
    .setTimestamp();
}

export function logEmbed(title: string, description: string, color: number) {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();
}

export function successEmbed(message: string) {
  return new EmbedBuilder().setColor(SUCCESS_COLOR).setDescription(`✅ ${message}`);
}

export function errorEmbed(message: string) {
  return new EmbedBuilder().setColor(ERROR_COLOR).setDescription(`❌ ${message}`);
}

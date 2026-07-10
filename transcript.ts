import { AttachmentBuilder, Collection, Message, TextChannel } from "discord.js";

const MAX_BATCHES = 20; // up to 2000 messages

export async function buildTranscript(channel: TextChannel): Promise<AttachmentBuilder> {
  const messages: Message[] = [];
  let beforeId: string | undefined;

  for (let i = 0; i < MAX_BATCHES; i++) {
    const batch: Collection<string, Message> = await channel.messages.fetch({ limit: 100, before: beforeId });
    if (batch.size === 0) break;
    messages.push(...batch.values());
    beforeId = batch.last()?.id;
    if (batch.size < 100) break;
  }

  messages.reverse();

  const lines = messages.map((message) => {
    const timestamp = new Date(message.createdTimestamp).toISOString();
    const attachments = message.attachments.map((attachment) => attachment.url).join(" ");
    const content = message.content || (attachments ? "" : "[sem conteúdo]");
    return `[${timestamp}] ${message.author.tag}: ${content}${attachments ? ` ${attachments}` : ""}`;
  });

  const header = `Transcript do canal #${channel.name} (${channel.id})\nGerado em: ${new Date().toISOString()}\n${"=".repeat(60)}\n`;
  const body = lines.join("\n") || "(nenhuma mensagem encontrada)";

  return new AttachmentBuilder(Buffer.from(header + body, "utf-8"), {
    name: `transcript-${channel.name}.txt`,
  });
}

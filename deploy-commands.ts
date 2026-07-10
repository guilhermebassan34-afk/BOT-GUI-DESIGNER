import { REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  throw new Error("DISCORD_BOT_TOKEN is not set. Add it via the secrets tool before deploying commands.");
}

const clientId = process.env.DISCORD_CLIENT_ID;
if (!clientId) {
  throw new Error(
    "DISCORD_CLIENT_ID is not set. Find it on your bot's application page (General Information > Application ID) and add it as an env var.",
  );
}

const guildId = process.env.DISCORD_GUILD_ID;

const body = Array.from(commands.values()).map((command) => command.data.toJSON());
const rest = new REST().setToken(token);

async function main() {
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId!, guildId), { body });
    console.log(`Registered ${body.length} command(s) to guild ${guildId}.`);
  } else {
    await rest.put(Routes.applicationCommands(clientId!), { body });
    console.log(`Registered ${body.length} command(s) globally (may take up to an hour to appear).`);
  }
}

main().catch((error) => {
  console.error("Failed to register commands:", error);
  process.exit(1);
});

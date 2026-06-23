import 'dotenv/config';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

const commands = [];
const files = readdirSync(resolve(__dirname, '../commands'));

for (const file of files) {
  if (!file.endsWith('.js')) continue;

  const { default: cmd } = await import(`../commands/${file}`);
  if (cmd.name) {
    const cmdData = { name: cmd.name, description: cmd.description ?? 'No description' };
    if (cmd.options) cmdData.options = cmd.options;
    commands.push(cmdData);
  }
}

try {
  console.log(`Registering ${commands.length} slash commands...`);
  await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
  console.log('Slash commands registered!');
} catch (err) {
  console.error('Failed to register commands:', err);
}

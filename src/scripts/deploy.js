import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

const commands = [
  { name: 'ping', description: 'Check if the bot is responsive' },
  { name: 'stats', description: 'Show bot stats like uptime and version' },
  { name: '8ball', description: 'Ask the Magic 8-Ball a question', options: [{ type: 3, name: 'question', description: 'Your question for the 8-ball', required: true }] },
  { name: 'coinflip', description: 'Flip a coin and get heads or tails' },
  { name: 'guess', description: 'Start a number guessing game (1-100). Type numbers in chat to guess!' },
  { name: 'choose', description: 'Have the bot pick between options', options: [{ type: 3, name: 'options', description: 'Options separated by commas (e.g. Pizza, Sushi, Tacos)', required: true }] },
  { name: 'hug', description: 'Give someone a hug', options: [{ type: 6, name: 'user', description: 'Who to hug', required: true }] },
];

try {
  console.log('Registering slash commands...');
  await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
  console.log('Slash commands registered!');
} catch (err) {
  console.error('Failed to register commands:', err);
}

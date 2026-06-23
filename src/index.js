import 'dotenv/config';
import { Client, GatewayDispatchEvents, GatewayIntentBits } from '@discordjs/core';
import { REST } from '@discordjs/rest';
import { WebSocketManager } from '@discordjs/ws';

import { setupBot } from './handlers/bot.js';
import { setupCommands } from './handlers/command.js';
import { setupEvents } from './handlers/event.js';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

const gateway = new WebSocketManager({
  token: process.env.DISCORD_TOKEN,
  intents:
    GatewayIntentBits.Guilds |
    GatewayIntentBits.GuildMessages |
    GatewayIntentBits.MessageContent |
    GatewayIntentBits.GuildMembers,
  rest,
});

const bot = new Client({ rest, gateway });

setupBot(bot);
await setupCommands(bot);
await setupEvents(bot);

gateway.connect();

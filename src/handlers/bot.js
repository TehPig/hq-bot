import config from '../bot.js';

export function setupBot(bot) {
  bot.commands = config.commands;
  bot.uptime = config.uptime;
  bot.version = config.version;
  bot.cache = config.cache;
  bot.lastPosts = config.lastPosts;
  bot.ids = config.ids;
}

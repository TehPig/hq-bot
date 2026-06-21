export default {
  name: 'MESSAGE_CREATE',
  run: async (bot, { data: msg, api }) => {
    if (msg.author.bot) return;
    if (!msg.guild_id) return;
    if (msg.guild_id !== bot.ids.guildId) return;

    const userId = msg.author.id;
    const game = bot.cache.games?.get(userId);
    if (!game) return;

    const trimmed = msg.content.trim();
    if (!/^\d{1,3}$/.test(trimmed)) return;

    const num = parseInt(trimmed, 10);
    if (num < 1 || num > 100) return;

    game.attempts++;

    if (num === game.number) {
      bot.cache.games.delete(userId);
      await api.channels.createMessage(msg.channel_id, {
        embeds: [{
          description: `🎉 **${msg.author.username}** guessed **${game.number}** in **${game.attempts}** attempt${game.attempts > 1 ? 's' : ''}!`,
          color: 0x2ECC71,
        }],
      });
      return;
    }

    if (num < game.number) game.min = Math.max(game.min, num + 1);
    else game.max = Math.min(game.max, num - 1);

    const hint = num < game.number ? '⬆️ Too low' : '⬇️ Too high';
    api.channels.createMessage(msg.channel_id, {
      embeds: [{
        description: `${hint} → Range: **${game.min}–${game.max}** (Attempts: **${game.attempts}**)`,
        color: 0x9B59B6,
      }],
    });
  },
};

import { formatTime } from '../utils/formatTime.js';

export default {
  name: 'stats',
  run: async (bot, interaction, api) => {
    const uptime = formatTime(Math.floor((Date.now() - bot.uptime) / 1000));
    const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const user = interaction.member?.user || interaction.user;

    api.interactions.reply(interaction.id, interaction.token, {
      embeds: [{
        title: '📊 Bot Statistics',
        color: 0x9B59B6,
        fields: [
          { name: '⏱ Uptime', value: `\`${uptime}\``, inline: true },
          { name: '\u200B', value: '\u200B', inline: true },
          { name: '\u200B', value: '\u200B', inline: true },
          { name: '💾 Memory', value: `\`${mem} MB\``, inline: true },
          { name: '📌 Version', value: `\`${bot.version}\``, inline: true },
        ],
        footer: { text: `Requested by ${user?.username}` },
        timestamp: new Date().toISOString(),
      }],
    });
  },
};

import { formatTime } from "../utils/formatTime.js";
import Embed from "../utils/Embed.js";

export default {
  name: "stats",
  description: "Show bot stats like uptime and version",
  run: async (bot, interaction, api) => {
    const uptime = formatTime(Math.floor((Date.now() - bot.uptime) / 1000));
    const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

    const embed = new Embed()
      .setTitle("📊 Bot Statistics")
      .setColor("#9B59B6")
      .addFields([
        { name: "⏱ Uptime", value: `${uptime}`, inline: true },
        { name: "\u200B", value: "\u200B", inline: true },
        { name: "\u200B", value: "\u200B", inline: true },
        { name: "💾 Memory", value: `\`${mem} MB\``, inline: true },
        { name: "📌 Version", value: `\`${bot.version}\``, inline: true },
      ]);

    api.interactions.reply(interaction.id, interaction.token, {
      embeds: [embed],
    });
  },
};

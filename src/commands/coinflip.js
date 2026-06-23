import Embed from "../utils/Embed.js";

export default {
  name: "coinflip",
  description: "Flip a coin and get heads or tails",
  run: async (bot, interaction, api) => {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    const emoji = result === "Heads" ? "🪙" : "🪙";

    api.interactions.reply(interaction.id, interaction.token, {
      content: "Flipping the coin...",
    });

    setTimeout(() => {
      const embed = new Embed()
        .setTitle(`${emoji} - Coin Flip`)
        .setColor("#9B59B6")
        .setDescription(`The coin landed on **${result}**!`);

      api.interactions.edit(interaction.id, interaction.token, {
        embeds: embed,
      });
    }, 2000);
  },
};

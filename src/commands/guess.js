import Embed from "../utils/Embed.js";

export default {
  name: "guess",
  description:
    "Start a number guessing game (1-100). Type numbers in chat to guess!",
  run: async (bot, interaction, api) => {
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const user = interaction.member?.user || interaction.user;
    const games = bot.cache.games;

    if (games.has(userId)) {
      return api.interactions.reply(interaction.id, interaction.token, {
        content:
          "You already have a game running! Just type a **number** in chat to guess.",
        flags: 64,
      });
    }

    const number = Math.floor(Math.random() * 100) + 1;
    games.set(userId, { number, attempts: 0, min: 1, max: 100 });

    const embed = new Embed()
      .setTitle("🔢 Guess the Number!")
      .setColor("#9B59B6")
      .setDescription(
        "I'm thinking of a number between **1 and 100**.\nJust type a **number** in chat to make your guess!",
      );

    api.interactions.reply(interaction.id, interaction.token, {
      embeds: [embed],
    });
  },
};

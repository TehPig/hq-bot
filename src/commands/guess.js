export default {
  name: 'guess',
  run: async (bot, interaction, api) => {
    const userId = interaction.member?.user?.id || interaction.user?.id;
    const user = interaction.member?.user || interaction.user;
    const games = bot.cache.games;

    if (games.has(userId)) {
      return api.interactions.reply(interaction.id, interaction.token, {
        embeds: [{
          title: '🎮 Game Already Active',
          color: 0xF1C40F,
          description: 'You already have a game running! Just type a **number** in chat to guess.',
          footer: { text: user?.username },
          timestamp: new Date().toISOString(),
        }],
        flags: 64,
      });
    }

    const number = Math.floor(Math.random() * 100) + 1;
    games.set(userId, { number, attempts: 0, min: 1, max: 100 });

    api.interactions.reply(interaction.id, interaction.token, {
      embeds: [{
        title: '🔢 Guess the Number!',
        color: 0x9B59B6,
        description: "I'm thinking of a number between **1 and 100**.\nJust type a **number** in chat to make your guess!",
        footer: { text: `Started by ${user?.username}` },
        timestamp: new Date().toISOString(),
      }],
    });
  },
};

export default {
  name: 'coinflip',
  run: async (bot, interaction, api) => {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const emoji = result === 'Heads' ? '🪙' : '🪙';
    const user = interaction.member?.user || interaction.user;

    api.interactions.reply(interaction.id, interaction.token, {
      embeds: [{
        title: `${emoji} Coin Flip`,
        color: 0x9B59B6,
        description: `The coin landed on **${result}**!`,
        footer: { text: `Flipped by ${user?.username}` },
        timestamp: new Date().toISOString(),
      }],
    });
  },
};

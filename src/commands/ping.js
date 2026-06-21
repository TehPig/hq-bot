export default {
  name: 'ping',
  run: async (bot, interaction, api) => {
    const user = interaction.member?.user || interaction.user;

    api.interactions.reply(interaction.id, interaction.token, {
      embeds: [{
        title: 'Pong! 🏓',
        color: 0x9B59B6,
        description: 'Bot is online and ready!',
        footer: { text: `Requested by ${user?.username}` },
        timestamp: new Date().toISOString(),
      }],
    });
  },
};

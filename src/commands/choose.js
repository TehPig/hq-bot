export default {
  name: 'choose',
  run: async (bot, interaction, api) => {
    const raw = interaction.data.options?.[0]?.value || '';
    const user = interaction.member?.user || interaction.user;
    const options = raw.split(',').map(s => s.trim()).filter(Boolean);

    if (options.length < 2) {
      return api.interactions.reply(interaction.id, interaction.token, {
        embeds: [{
          title: '❌ Not Enough Options',
          color: 0xE74C3C,
          description: 'Please provide at least **2 options** separated by commas.\nExample: `/choose Pizza, Sushi, Tacos`',
          footer: { text: user?.username },
          timestamp: new Date().toISOString(),
        }],
        flags: 64,
      });
    }

    const choice = options[Math.floor(Math.random() * options.length)];

    api.interactions.reply(interaction.id, interaction.token, {
      embeds: [{
        title: '🤔 The Bot Has Spoken',
        color: 0x9B59B6,
        description: `I choose... **${choice}**!`,
        fields: [{ name: 'Options', value: options.map(o => `• ${o}`).join('\n') }],
        footer: { text: `Requested by ${user?.username}` },
        timestamp: new Date().toISOString(),
      }],
    });
  },
};

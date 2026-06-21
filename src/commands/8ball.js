const responses = [
  'It is certain.', 'It is decidedly so.', 'Without a doubt.',
  'Yes – definitely.', 'You may rely on it.', 'As I see it, yes.',
  'Most likely.', 'Outlook good.', 'Yes.',
  'Signs point to yes.', 'Reply hazy, try again.', 'Ask again later.',
  'Better not tell you now.', 'Cannot predict now.', 'Concentrate and ask again.',
  "Don't count on it.", 'My reply is no.', 'My sources say no.',
  'Outlook not so good.', 'Very doubtful.',
];

export default {
  name: '8ball',
  run: async (bot, interaction, api) => {
    const question = interaction.data.options?.[0]?.value || 'No question provided.';
    const answer = responses[Math.floor(Math.random() * responses.length)];
    const user = interaction.member?.user || interaction.user;

    api.interactions.reply(interaction.id, interaction.token, {
      embeds: [{
        title: '🎱 Magic 8-Ball',
        color: 0x9B59B6,
        fields: [
          { name: 'Question', value: `*${question}*` },
          { name: 'Answer', value: `**${answer}**` },
        ],
        footer: { text: `Asked by ${user?.username}` },
        timestamp: new Date().toISOString(),
      }],
    });
  },
};

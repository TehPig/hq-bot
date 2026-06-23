import Embed from "../utils/Embed.js";

const responses = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes – definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
];

export default {
  name: "8ball",
  description: "Ask the Magic 8-Ball a question",
  options: [
    {
      type: 3,
      name: "question",
      description: "Your question for the 8-ball",
      required: true,
    },
  ],
  run: async (bot, interaction, api) => {
    const question =
      interaction.data.options?.[0]?.value || "No question provided.";
    const answer = responses[Math.floor(Math.random() * responses.length)];
    const user = interaction.member?.user || interaction.user;

    api.interactions.reply(interaction.id, interaction.otken, {
      content: "🎱 Predicting the future...",
    });

    setTimeout(() => {
      const embed = new Embed()
        .setTitle("🎱 - Magic 8-Ball")
        .setColor("#9B59B6")
        .addFields([
          { name: "Question", value: `*${question}*` },
          { name: "Answer", value: `**${answer}**` },
        ]);

      api.interactions.editReply(interaction.id, interaction.token, {
        embeds: [embed],
      });
    }, 2000);
  },
};

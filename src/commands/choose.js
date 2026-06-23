import Embed from "../utils/Embed.js";

export default {
  name: "choose",
  description: "Have the bot pick between options",
  options: [
    {
      type: 3,
      name: "options",
      description: "Options separated by commas (e.g. Pizza, Sushi, Tacos)",
      required: true,
    },
  ],
  run: async (bot, interaction, api) => {
    const raw = interaction.data.options?.[0]?.value || "";
    const options = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (options.length < 2) {
      return api.interactions.reply(interaction.id, interaction.token, {
        content:
          "Please provide at least **2 options** separated by commas.\nExample: `/choose Pizza, Sushi, Tacos`",
        flags: 64,
      });
    }

    api.interactions.reply(interaction.id, interaction.otken, {
      content: "🗨️ The Assistant is thinking...",
    });

    setTimeout(() => {
      const choice = options[Math.floor(Math.random() * options.length)];

      const embed = new Embed()
        .setTitle("🤔 The Assistant has Decided")
        .setColor("#9B59B6")
        .setDescription(`I choose... **${choice}**!`)
        .addFields([
          { name: "Options", value: options.map((o) => `• ${o}`).join("\n") },
        ]);

      api.interactions.editReply(interaction.id, interaction.token, {
        embeds: embed,
      });
    }, 2000);
  },
};

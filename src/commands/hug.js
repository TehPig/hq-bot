import Embed from "../utils/Embed.js";

export default {
  name: "hug",
  description: "Give someone a hug",
  options: [
    {
      type: 6,
      name: "user",
      description: "Who do you want to hug?",
      required: true,
    },
  ],
  run: async (bot, interaction, api) => {
    const targetId = interaction.data.options?.[0]?.value;
    const user = interaction.member?.user || interaction.user;

    if (!targetId) {
      return api.interactions.reply(interaction.id, interaction.token, {
        content: "You need to mention someone to hug!",
        flags: 64,
      });
    }

    await api.interactions.defer(interaction.id, interaction.token);

    let files;
    try {
      const res = await fetch("https://nekos.life/api/v2/img/hug");
      const { url } = await res.json();
      const img = await fetch(url);
      const buffer = Buffer.from(await img.arrayBuffer());
      files = [{ data: buffer, name: "hug.gif", contentType: "image/gif" }];
    } catch {}

    const embed = new Embed()
      .setTitle("🤗 Hug!")
      .setColor("#9B59B6")
      .setDescription(`<@${user.id}> gave <@${targetId}> a hug!`)
      .setImage(files ? { url: "attachment://hug.gif" } : undefined);

    await api.interactions.editReply(
      interaction.application_id,
      interaction.token,
      {
        embeds: [embed],
        files,
      },
    );
  },
};

export default {
  name: 'hug',
  run: async (bot, interaction, api) => {
    const targetId = interaction.data.options?.[0]?.value;
    const user = interaction.member?.user || interaction.user;

    if (!targetId) {
      return api.interactions.reply(interaction.id, interaction.token, {
        content: 'You need to mention someone to hug!',
        flags: 64,
      });
    }

    await api.interactions.defer(interaction.id, interaction.token);

    let files;
    try {
      const res = await fetch('https://nekos.life/api/v2/img/hug');
      const { url } = await res.json();
      const img = await fetch(url);
      const buffer = Buffer.from(await img.arrayBuffer());
      files = [{ data: buffer, name: 'hug.gif', contentType: 'image/gif' }];
    } catch {}

    await api.interactions.editReply(interaction.application_id, interaction.token, {
      embeds: [{
        title: '🤗 Hug!',
        color: 0x9B59B6,
        description: `<@${user.id}> gave <@${targetId}> a hug!`,
        image: files ? { url: 'attachment://hug.gif' } : undefined,
        timestamp: new Date().toISOString(),
      }],
      files,
    });
  },
};

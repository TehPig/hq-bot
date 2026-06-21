export default {
  name: 'GUILD_MEMBER_ADD',
  run: async (bot, { data: member, api }) => {
    if (member.guild_id !== bot.ids.guildId) return;

    api.channels.createMessage(bot.ids.channels.welcome, {
      content: `Welcome <@${member.user.id}> to the server! :wave:\n> Feel free to introduce yourself and make yourself at home!`,
    });
  },
};

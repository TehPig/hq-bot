export default {
  name: 'PRESENCE_UPDATE',
  run: async (bot, { data: presence, api }) => {
    if (presence.guild_id !== bot.ids.guildId) return;

    const isStreaming = presence.activities?.some(
      (a) =>
        a.type === 1 &&
        a.url &&
        (a.url.startsWith('https://www.twitch.tv/') ||
          a.url.startsWith('https://twitch.tv/') ||
          a.url.startsWith('https://www.youtube.com/') ||
          a.url.startsWith('https://youtube.com/')),
    );

    const { guildId, roles } = bot.ids;
    const userId = presence.user.id;
    const roleId = roles.streaming;

    if (isStreaming) {
      try {
        await api.guilds.addRoleToMember(guildId, userId, roleId, {
          reason: 'User is livestreaming',
        });
      } catch (e) {
        console.error(`[StreamRole] Failed to add role to ${userId}:`, e);
      }
    } else {
      try {
        await api.guilds.removeRoleFromMember(guildId, userId, roleId, {
          reason: 'User stopped livestreaming',
        });
      } catch (e) {
        console.error(`[StreamRole] Failed to remove role from ${userId}:`, e);
      }
    }
  },
};

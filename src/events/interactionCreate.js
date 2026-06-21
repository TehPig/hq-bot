import { InteractionType } from '@discordjs/core';

export default {
  name: 'INTERACTION_CREATE',
  run: async (bot, { data: interaction, api }) => {
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    const cmd = bot.commands.get(interaction.data.name);
    if (!cmd) return;

    try {
      await cmd.run(bot, interaction, api);
    } catch (err) {
      console.error(`[Error] Command ${interaction.data.name}:`, err);
      api.interactions.reply(interaction.id, interaction.token, {
        content: 'An error occurred while running that command.',
        flags: 64,
      });
    }
  },
};

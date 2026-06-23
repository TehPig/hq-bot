import Embed from "../utils/Embed.js";

export default {
  name: "projects",
  description:
    "Posts an embed with all of the past Discord projects I've worked on.",
  run: async (bot, interaction, api) => {
    if (interaction.member.id !== "298432708269441034")
      return api.interactions.reply(interaction.id, interaction.token, {
        content: "This command is not for you!",
        flags: 64,
      });

    const embed_old = new Embed()
      .setDescription(
        `# Old / Abandoned Projects
[T_Bot's Team Advertising Server](https://discord.gg/CPvCXcsj89) - An old server where people could advertise their Discord servers and social media.
[|A_Net | teN_A|](https://discord.gg/TS6pbquh63) - A casual community server
[Some Linking Bot Support](https://discord.gg/Z3rWZVERCC) - A support server for the Discord bot "Some Linking Bot". The bot allows the user to link their accounts from popular games and check out statistics without having to rely on other third party solutions.
[OpenMC Network]https://discord.gg/HjhgNxVFBZ - Serves as a Discord server where users could add their own Minecraft servers to the network, exchange advice and connect with other players and server owners!
[LibrertyMC](https://discord.gg/RhbWnqASjS) - An old vanilla Minecraft server that served as a community for a short period of time.
[RobloxianGamers](https://discord.gg/U7kpzCfnuv) - The Discord server for my Roblox group, RobloxianGamers!
[The Coding Line](https://discord.gg/QrDj9SP33n) - An old hosting service that was changed into a community Discord server.`,
      )
      .setColor("#9B59B6");

    const embed_current = new Embed()
      .setDescription(
        `# Current Projects
[HQ Bot](https://github.com/TechPigYT/hq-bot) - The HQ Discord bot you're talking to right now!
[TODO: Add your current projects here]`,
      )
      .setColor("#9B59B6");

    await api.interactions.reply(interaction.id, interaction.token, {
      content: "📋 Projects posted!",
      flags: 64,
    });

    await api.channels.createMessage(interaction.channel_id, {
      embeds: [embed_old, embed_current],
    });
  },
};

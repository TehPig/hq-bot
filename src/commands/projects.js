import Embed from "../utils/Embed.js";

export default {
  name: "projects",
  description:
    "Posts an embed with all of the past Discord projects I've worked on.",
  run: async (bot, interaction, api) => {
    if (interaction.member?.user?.id !== "298432708269441034")
      return api.interactions.reply(interaction.id, interaction.token, {
        content: "This command is not for you!",
        flags: 64,
      });

    const embed_old = new Embed()
      .setDescription(
        `> # 🌵 Old / Abandoned Projects
[T_Bot's Team Advertising Server](https://discord.gg/CPvCXcsj89) - An old server where people could advertise their Discord servers and social media.
[|A_Net | teN_A|](https://discord.gg/TS6pbquh63) - A casual community server created for fun.
[Some Linking Bot](https://discord.gg/Z3rWZVERCC) - A support server for the Discord bot "Some Linking Bot". The bot allows the user to link their accounts from popular games and check out statistics without having to rely on third party solutions.
[OpenMC Network](https://discord.gg/HjhgNxVFBZ) - Serves as a Discord server where users could add their own Minecraft servers to the network, exchange advice and connect with other players and server owners!
[LibrertyMC](https://discord.gg/RhbWnqASjS) - An old vanilla Minecraft server that served as a community for a short period of time.
[RobloxianGamers](https://discord.gg/U7kpzCfnuv) - The Discord server for my Roblox group, RobloxianGamers!
[The Coding Line](https://discord.gg/QrDj9SP33n) - An old hosting service that was later transformed into a community Discord server.

*There are also more projects that are not listed here.*`,)
      .setColor("#9B59B6");

    const embed_current = new Embed()
      .setDescription(
        `> # 🏅 Currently Active / Maintained Communities
### [T_Bot Team](<https://discord.gg/nH8EqjKkJv>) - The home of my Bots. Been around since **2018**.
### [TehCraft SMP](<https://discord.gg/5DHFBBcD3F>) - My Minecraft Server which I maintain to this day! Started back in **2020**.`)
      .setColor("#9B59B6");

    const embed_github = new Embed()
    .setDescription(`> # ⚙️ Currently Active / Maintained Projects
      
[T_Music_Bot RPC](https://github.com/T-Bot-Team/t-music-bot-rpc) - Share your current tracks with friends on Discord and your viewers on stream—all with one tool.
[MindLeap](https://github.com/TehPig/MindLeap) - A simple deck-based flashcard app inspired by Anki.
[euphoria-logger](https://github.com/TehPig/euphoria-logger) - A feature-packed console logger for Javascript.
[SoundRPC](https://github.com/T-Bot-Team/SoundRPC) - A discord-rpc based package that exclusively focuses on voice-related features.

*Only projects with active public links are shown. More are under active development.*`)

    api.interactions.reply(interaction.id, interaction.token, {
      content: "📋 Projects posted!",
      flags: 64,
    });

    api.channels.createMessage(interaction.channel_id, {
      embeds: [embed_old, embed_current, embed_github],
    });
  },
};

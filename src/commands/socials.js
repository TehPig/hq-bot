import Embed from "../utils/Embed.js";

export default {
  name: "socials",
  description: "Show all of my social media links.",
  run: async (bot, interaction, api) => {
    if (interaction.member.user.id !== "298432708269441034")
      return api.interactions.reply(interaction.id, interaction.token, {
        content: "This command is not for you!",
        flags: 64,
      });

    const embed = new Embed().setTitle("🌐 Social Links").setColor("#9B59B6")
      .setDescription(`**GitHub**: https://github.com/TehPig
**Reddit**: https://reddit.com/user/TechPigYT
**Twitter / X**: https://twitter.com/TechPigYT
**TikTok**: https://www.tiktok.com/@tehpigyt
**Bluesky**: https://bsky.app/profile/techpig.bsky.social
**Threads**: https://www.threads.com/@tehpigyt
**Instagram**: https://www.instagram.com/tehpigyt

**YouTube**
- https://youtube.com/@TechPigYT
- https://youtube.com/@TechPigExtra

**Twitch**
- https://twitch.tv/TechPigYT
- https://twitch.tv/TechPigLIVE`);

    api.interactions.reply(interaction.id, interaction.token, {
      content: "🌐 Socials posted!",
      flags: 64,
    });

    api.channels.createMessage(interaction.channel_id, {
      embeds: [embed],
    });
  },
};

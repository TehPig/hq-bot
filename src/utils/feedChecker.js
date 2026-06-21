const TWITTER_RSS = (handle) => `https://rsshub.app/twitter/user/${handle}`;
const YOUTUBE_RSS = (handle) => `https://www.youtube.com/feeds/videos.xml?handle=${handle}`;
const TWITCH_OAUTH = 'https://id.twitch.tv/oauth2/token';
const TWITCH_API = 'https://api.twitch.tv/helix/streams';

let twitchToken = null;
let twitchTokenExpiry = 0;

async function getTwitchToken() {
  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (twitchToken && Date.now() < twitchTokenExpiry) return twitchToken;

  try {
    const res = await fetch(`${TWITCH_OAUTH}?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`, { method: 'POST' });
    const data = await res.json();
    twitchToken = data.access_token;
    twitchTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return twitchToken;
  } catch {
    return null;
  }
}

export async function startFeedChecker(bot) {
  const channelId = bot.ids.channels.feeds;

  const checkTweet = async (handle) => {
    try {
      const res = await fetch(TWITTER_RSS(handle));
      const text = await res.text();
      const idMatch = text.match(/<guid[^>]*>([^<]+)<\/guid>/);
      if (!idMatch) return;

      const tweetId = idMatch[1];
      const lastId = bot.lastPosts.tweets.get(handle);
      if (lastId && tweetId !== lastId) {
        const url = `https://twitter.com/${handle}/status/${tweetId.split('/').pop()}`;
        await bot.api.channels.createMessage(channelId, { content: `New tweet from **${handle}**: ${url}` });
      } else if (!lastId) {
        bot.lastPosts.tweets.set(handle, tweetId);
      }
    } catch (err) {
      console.error(`[Feed] Twitter check failed for ${handle}:`, err.message);
    }
  };

  const checkVideo = async (handle) => {
    try {
      const res = await fetch(YOUTUBE_RSS(handle));
      const text = await res.text();
      const idMatch = text.match(/<yt:videoId[^>]*>([^<]+)<\/yt:videoId>/);
      if (!idMatch) return;

      const videoId = idMatch[1];
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/);
      const title = titleMatch ? titleMatch[1].replace(/^[^:]+:\s*/, '') : 'New video';
      const lastId = bot.lastPosts.videos.get(handle);

      if (lastId && videoId !== lastId) {
        await bot.api.channels.createMessage(channelId, {
          content: `**${handle}** uploaded: ${title}\nhttps://youtu.be/${videoId}`,
        });
      } else if (!lastId) {
        bot.lastPosts.videos.set(handle, videoId);
      }
    } catch (err) {
      console.error(`[Feed] YouTube check failed for ${handle}:`, err.message);
    }
  };

  const checkStream = async (handle) => {
    try {
      const token = await getTwitchToken();
      if (!token) return;

      const res = await fetch(`${TWITCH_API}?user_login=${handle}`, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${token}`,
        },
      });
      const { data } = await res.json();
      const isLive = data && data.length > 0;
      const wasLive = bot.lastPosts.streams.get(handle);

      if (isLive && !wasLive) {
        const stream = data[0];
        await bot.api.channels.createMessage(channelId, {
          content: `**${handle}** is now live on Twitch!\n${stream.title}\nhttps://twitch.tv/${handle}`,
        });
      }
      bot.lastPosts.streams.set(handle, !!isLive);
    } catch (err) {
      console.error(`[Feed] Twitch check failed for ${handle}:`, err.message);
    }
  };

  setTimeout(async () => {
    for (const handle of bot.ids.twitter) checkTweet(handle);
    for (const handle of bot.ids.youtube) checkVideo(handle);
    for (const handle of bot.ids.twitch) checkStream(handle);
  }, 10 * 1000);

  setInterval(async () => {
    for (const handle of bot.ids.twitter) checkTweet(handle);
    for (const handle of bot.ids.youtube) checkVideo(handle);
    for (const handle of bot.ids.twitch) checkStream(handle);
  }, 5 * 60 * 1000);
}

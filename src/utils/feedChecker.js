import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TWITTER_RSS = (handle) => `https://rsshub.app/twitter/user/${handle}`;
const YOUTUBE_RSS = (handle) =>
  `https://www.youtube.com/feeds/videos.xml?handle=${handle}`;
const TWITCH_OAUTH = "https://id.twitch.tv/oauth2/token";
const TWITCH_API = "https://api.twitch.tv/helix/streams";
const BLUESKY_API = (handle) =>
  `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=1`;
const THREADS_RSS = (handle) => `https://rsshub.app/threads/user/${handle}`;

const CROSSPOST_TIMEOUT = 30 * 60 * 1000;
const CACHE_FILE = resolve(__dirname, "../../feed-cache.json");

function loadCache(bot) {
  if (!existsSync(CACHE_FILE)) return;
  try {
    const data = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
    for (const [key, entries] of Object.entries(data)) {
      if (!bot.lastPosts[key]) continue;
      for (const [handle, value] of Object.entries(entries)) {
        bot.lastPosts[key].set(handle, value);
      }
    }
    console.log("[Feed] Cache loaded from", CACHE_FILE);
  } catch (err) {
    console.error("[Feed] Failed to load cache:", err.message);
  }
}

function saveCache(bot) {
  try {
    const data = {};
    for (const [key, map] of Object.entries(bot.lastPosts)) {
      if (map instanceof Map && map.size > 0) {
        data[key] = Object.fromEntries(map);
      }
    }
    writeFileSync(CACHE_FILE, JSON.stringify(data), "utf-8");
  } catch (err) {
    console.error("[Feed] Failed to save cache:", err.message);
  }
}

let twitchToken = null;
let twitchTokenExpiry = 0;

async function getTwitchToken() {
  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (!id || !secret) {
    console.error("[Feed] Twitch credentials missing in .env");
    return null;
  }

  if (twitchToken && Date.now() < twitchTokenExpiry) return twitchToken;

  try {
    const res = await fetch(
      `${TWITCH_OAUTH}?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`,
      { method: "POST" },
    );
    const data = await res.json();
    if (!data.access_token) {
      console.error("[Feed] Twitch OAuth failed:", data);
      return null;
    }
    twitchToken = data.access_token;
    twitchTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return twitchToken;
  } catch (err) {
    console.error("[Feed] Twitch OAuth error:", err.message);
    return null;
  }
}

function normalizeText(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildCrosspostContent(handle, text, links) {
  const isCrosspost = links.length > 1;
  const header = isCrosspost
    ? `**Cross-post from @${handle}**`
    : `**New post from @${handle}**`;
  const linkStr = links.map((l) => `[${l.platform}](${l.url})`).join(" · ");
  const displayText =
    text.length > 500 ? text.slice(0, 497) + "..." : text || "(media)";
  return `${header}\n\n${displayText}\n\n🔗 ${linkStr}`;
}

async function handleSocialPost(platform, handle, text, url, bot, channelId) {
  const key = normalizeText(text);
  if (!key) return;

  const existing = bot.lastPosts.crossposts.get(key);
  const isRecent =
    existing && Date.now() - existing.timestamp < CROSSPOST_TIMEOUT;

  if (existing && isRecent) {
    existing.links.push({ platform, url });
    existing.timestamp = Date.now();
    const content = buildCrosspostContent(handle, text, existing.links);
    try {
      await bot.api.channels.editMessage(channelId, existing.messageId, {
        content,
      });
    } catch {
      const msg = await bot.api.channels.createMessage(channelId, { content });
      existing.messageId = msg.id;
    }
    bot.lastPosts.crossposts.set(key, existing);
  } else {
    const links = [{ platform, url }];
    const content = buildCrosspostContent(handle, text, links);
    const msg = await bot.api.channels.createMessage(channelId, { content });
    bot.lastPosts.crossposts.set(key, {
      messageId: msg.id,
      channelId,
      timestamp: Date.now(),
      handle,
      text,
      links,
    });
  }
}

function cleanCrosspostCache(bot) {
  const cutoff = Date.now() - CROSSPOST_TIMEOUT;
  for (const [key, entry] of bot.lastPosts.crossposts) {
    if (entry.timestamp < cutoff) bot.lastPosts.crossposts.delete(key);
  }
}

export async function startFeedChecker(bot) {
  loadCache(bot);
  const channelId = bot.ids.channels.feeds;

  const checkTweet = async (handle) => {
    try {
      const res = await fetch(TWITTER_RSS(handle));
      const xml = await res.text();
      const idMatch = xml.match(/<guid[^>]*>([^<]+)<\/guid>/);
      if (!idMatch) return;

      const tweetId = idMatch[1];
      const lastId = bot.lastPosts.tweets.get(handle);
      if (lastId && tweetId !== lastId) {
        const url = `https://twitter.com/${handle}/status/${tweetId.split("/").pop()}`;
        const titleMatch = xml.match(/<title[^>]*>([^<]+)<\/title>/);
        const titleText = titleMatch
          ? titleMatch[1].replace(/^[^:]+:\s*/, "")
          : "";
        bot.lastPosts.tweets.set(handle, tweetId);
        await handleSocialPost(
          "Twitter",
          handle,
          titleText,
          url,
          bot,
          channelId,
        );
        saveCache(bot);
      } else if (!lastId) {
        bot.lastPosts.tweets.set(handle, tweetId);
        saveCache(bot);
      }
    } catch (err) {
      console.error(`[Feed] Twitter check failed for ${handle}:`, err.message);
    }
  };

  const checkVideo = async (handle) => {
    try {
      const res = await fetch(YOUTUBE_RSS(handle));
      const xml = await res.text();
      const idMatch = xml.match(/<yt:videoId[^>]*>([^<]+)<\/yt:videoId>/);
      if (!idMatch) return;

      const videoId = idMatch[1];
      const titleMatch = xml.match(/<title[^>]*>([^<]+)<\/title>/);
      const title = titleMatch
        ? titleMatch[1].replace(/^[^:]+:\s*/, "")
        : "New video";
      const lastId = bot.lastPosts.videos.get(handle);

      if (lastId && videoId !== lastId) {
        bot.lastPosts.videos.set(handle, videoId);
        await bot.api.channels.createMessage(channelId, {
          content: `🎥 | **${handle}** uploaded a new video!\n\n>>> **${title}**\nhttps://youtu.be/${videoId}`,
        });
        saveCache(bot);
      } else if (!lastId) {
        bot.lastPosts.videos.set(handle, videoId);
        saveCache(bot);
      }
    } catch (err) {
      console.error(`[Feed] YouTube check failed for ${handle}:`, err.message);
    }
  };

  const checkStream = async (handle) => {
    try {
      const token = await getTwitchToken();
      if (!token) {
        console.error(`[Feed] Twitch check skipped for ${handle}: no token`);
        return;
      }

      const res = await fetch(`${TWITCH_API}?user_login=${handle}`, {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${token}`,
        },
      });
      const { data } = await res.json();
      const isLive = data && data.length > 0;
      const wasLive = bot.lastPosts.streams.get(handle);
      console.log(
        `[Feed] Twitch check for ${handle}: isLive=${isLive}, wasLive=${wasLive}`,
      );

      if (isLive && !wasLive) {
        const stream = data[0];
        await bot.api.channels.createMessage(channelId, {
          content: `🔴 | **${handle}** is now live on Twitch!\n\n>>> **${stream.title}**\nhttps://twitch.tv/${handle}`,
        });
      }
      bot.lastPosts.streams.set(handle, !!isLive);
      saveCache(bot);
    } catch (err) {
      console.error(`[Feed] Twitch check failed for ${handle}:`, err.message);
    }
  };

  const checkBluesky = async (handle) => {
    try {
      const res = await fetch(BLUESKY_API(handle));
      const data = await res.json();
      const post = data?.feed?.[0]?.post;
      if (!post) return;

      const uri = post.uri;
      const rkey = uri.split("/").pop();
      const postText = post.record?.text || "";
      const lastUri = bot.lastPosts.bluesky.get(handle);

      if (lastUri && uri !== lastUri) {
        const url = `https://bsky.app/profile/${handle}/post/${rkey}`;
        bot.lastPosts.bluesky.set(handle, uri);
        await handleSocialPost(
          "Bluesky",
          handle,
          postText,
          url,
          bot,
          channelId,
        );
        saveCache(bot);
      } else if (!lastUri) {
        bot.lastPosts.bluesky.set(handle, uri);
        saveCache(bot);
      }
    } catch (err) {
      console.error(`[Feed] Bluesky check failed for ${handle}:`, err.message);
    }
  };

  const checkThreads = async (handle) => {
    try {
      const res = await fetch(THREADS_RSS(handle));
      const xml = await res.text();
      const idMatch = xml.match(/<guid[^>]*>([^<]+)<\/guid>/);
      if (!idMatch) return;

      const postId = idMatch[1];
      const lastId = bot.lastPosts.threads.get(handle);

      if (lastId && postId !== lastId) {
        const titleMatch = xml.match(/<title[^>]*>([^<]+)<\/title>/);
        const titleText = titleMatch
          ? titleMatch[1].replace(/^[^:]+:\s*/, "")
          : "";
        const url = `https://www.threads.net/@${handle}/post/${postId.split("/").pop()}`;
        bot.lastPosts.threads.set(handle, postId);
        await handleSocialPost(
          "Threads",
          handle,
          titleText,
          url,
          bot,
          channelId,
        );
        saveCache(bot);
      } else if (!lastId) {
        bot.lastPosts.threads.set(handle, postId);
        saveCache(bot);
      }
    } catch (err) {
      console.error(`[Feed] Threads check failed for ${handle}:`, err.message);
    }
  };

  setTimeout(async () => {
    for (const handle of bot.ids.twitter ?? []) await checkTweet(handle);
    for (const handle of bot.ids.youtube ?? []) await checkVideo(handle);
    for (const handle of bot.ids.twitch ?? []) await checkStream(handle);
    for (const handle of bot.ids.bluesky ?? []) await checkBluesky(handle);
    for (const handle of bot.ids.threads ?? []) await checkThreads(handle);
    saveCache(bot);
  }, 10 * 1000);

  setInterval(
    async () => {
      for (const handle of bot.ids.twitter ?? []) await checkTweet(handle);
      for (const handle of bot.ids.youtube ?? []) await checkVideo(handle);
      for (const handle of bot.ids.twitch ?? []) await checkStream(handle);
      for (const handle of bot.ids.bluesky ?? []) await checkBluesky(handle);
      for (const handle of bot.ids.threads ?? []) await checkThreads(handle);
      cleanCrosspostCache(bot);
      saveCache(bot);
    },
    5 * 60 * 1000,
  );
}

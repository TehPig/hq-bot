import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import threadsApi from "threads-api";

const { ThreadsAPI } = threadsApi;

const __dirname = dirname(fileURLToPath(import.meta.url));

const TWITTER_RSS = (handle) => `https://fxtwitter.com/${handle}/feed.xml`;
const YOUTUBE_RSS = (channelId) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
const TWITCH_OAUTH = "https://id.twitch.tv/oauth2/token";
const TWITCH_API = "https://api.twitch.tv/helix/streams";
const BLUESKY_API = (handle) =>
  `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=1`;
// Threads uses threads-api npm package (GraphQL via Barcelona API)

const CROSSPOST_TIMEOUT = 24 * 60 * 60 * 1000;
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

const URL_REGEX = /https?:\/\/[^\s]+/g;
const BARE_DOMAIN_REGEX = /(?:[\w-]+\.)+[\w-]+(?:\/[^\s]*)?/g;

function extractUrls(text) {
  const matches = text.match(URL_REGEX) || [];
  const bare = text.match(BARE_DOMAIN_REGEX) || [];
  return [...new Set([...matches, ...bare])];
}

function normalizeUrl(url) {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

const STOP_WORDS = new Set([
  "a","an","the","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","can","need","shall",
  "i","me","my","myself","we","us","our","ours","you","your","yours","he","him","his",
  "she","her","hers","they","them","their","theirs","it","its","in","on","at","to",
  "for","of","with","and","or","but","not","this","that","these","those","all","each",
  "every","both","few","more","most","some","any","no","none","etc","vs","up","out",
  "off","over","under","again","further","then","once","here","there","when","where",
  "why","how","what","which","who","whom","so","if","than","too","very","just","also",
  "now","get","got","like","make","made","much","still","well","back","even","yet",
  "way","down","into","about","don","doesn","didn","won","can","couldn",
]);

function getKeywords(text) {
  const cleaned = text.replace(URL_REGEX, " ").replace(BARE_DOMAIN_REGEX, " ").replace(/[^a-z0-9#']+/gi, " ");
  return new Set(
    cleaned
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

function keywordsOverlap(a, b) {
  if (a.size === 0 || b.size === 0) return false;
  for (const w of a) {
    if (b.has(w)) return true;
  }
  return false;
}

function buildCrosspostContent(handle, text, links) {
  const isCrosspost = links.length > 1;
  const header = isCrosspost
    ? `## 📢 | **New Cross-post**`
    : `## 📢 | **New post on social media**`;
  const linkStr = links.map((l) => `[${l.platform}](${l.url})`).join(" · ");
  //const displayText =
  //  text.length > 500 ? text.slice(0, 497) + "..." : text || "(media)";
  return `${header}\n### 🔗 ${linkStr}`;
}

async function handleSocialPost(platform, handle, text, url, bot, channelId) {
  const key = normalizeText(text);
  if (!key) return;

  bot.cache.pendingCrossposts.push({
    key,
    platform,
    handle,
    text,
    url,
    normalUrls: extractUrls(text).map(normalizeUrl),
    keywords: getKeywords(text),
  });
}

async function flushPendingCrossposts(bot, channelId) {
  const pending = bot.cache.pendingCrossposts;
  bot.cache.pendingCrossposts = [];
  if (pending.length === 0) return;

  // Group pending posts by URL overlap
  const groups = [];
  const used = new Set();

  for (let i = 0; i < pending.length; i++) {
    if (used.has(i)) continue;
    const group = [pending[i]];
    used.add(i);

    // Try to match against cache first
    let cacheHit = null;
    const post = pending[i];
    cacheHit = bot.lastPosts.crossposts.get(post.key);
    if (!cacheHit && post.normalUrls.length > 0) {
      for (const [, entry] of bot.lastPosts.crossposts) {
        if (entry.normalUrls?.some((u) => post.normalUrls.includes(u))) {
          cacheHit = entry;
          break;
        }
      }
    }

    // Group with other pending posts that share a URL or keywords
    const groupUrls = new Set(post.normalUrls);
    const groupKeywords = post.keywords;
    for (let j = i + 1; j < pending.length; j++) {
      if (used.has(j)) continue;
      const other = pending[j];
      if (other.normalUrls.some((u) => groupUrls.has(u)) ||
          keywordsOverlap(groupKeywords, other.keywords)) {
        group.push(other);
        used.add(j);
        for (const u of other.normalUrls) groupUrls.add(u);
      }
    }

    groups.push({ posts: group, cacheHit });
  }

  for (const { posts, cacheHit } of groups) {
    const target = cacheHit;

    if (target) {
      for (const post of posts) {
        if (!target.links.some((l) => l.url === post.url)) {
          target.links.push({ platform: post.platform, url: post.url });
        }
        bot.lastPosts.crossposts.set(post.key, target);
      }
      target.timestamp = Date.now();
      const content = buildCrosspostContent(posts[0].handle, posts[0].text, target.links);
      try {
        await bot.api.channels.editMessage(channelId, target.messageId, { content });
      } catch {
        const msg = await bot.api.channels.createMessage(channelId, { content });
        target.messageId = msg.id;
      }
    } else {
      const links = posts.map((p) => ({ platform: p.platform, url: p.url }));
      const content = buildCrosspostContent(posts[0].handle, posts[0].text, links);
      const msg = await bot.api.channels.createMessage(channelId, { content });
      const entry = {
        messageId: msg.id,
        channelId,
        timestamp: Date.now(),
        handle: posts[0].handle,
        text: posts[0].text,
        normalUrls: [...new Set(posts.flatMap((p) => p.normalUrls))],
        links,
      };
      for (const post of posts) {
        bot.lastPosts.crossposts.set(post.key, entry);
      }
    }
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
  bot.cache.pendingCrossposts = [];
  console.log('[Feed] Monitoring:', JSON.stringify({
    twitter: bot.ids.twitter,
    youtube: bot.ids.youtube,
    twitch: bot.ids.twitch,
    bluesky: bot.ids.bluesky,
    threads: bot.ids.threads,
  }));
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
        const titleMatch = xml.match(/<item>[\s\S]*?<title[^>]*>([^<]+)<\/title>/);
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

  const checkVideo = async ({ handle, channelId }) => {
    try {
      const res = await fetch(YOUTUBE_RSS(channelId));
      const xml = await res.text();
      const idMatch = xml.match(/<yt:videoId[^>]*>([^<]+)<\/yt:videoId>/);
      if (!idMatch) return;

      const videoId = idMatch[1];
      const titleMatch = xml.match(/<entry>[\s\S]*?<title[^>]*>([^<]+)<\/title>/);
      const title = titleMatch
        ? titleMatch[1]
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
      const bskyData = await res.json();
      if (bskyData.error) { console.log(`[Feed] Bluesky for ${handle}: API error - ${bskyData.error}`); return; }
      const post = bskyData?.feed?.[0]?.post;
      if (!post) { console.log(`[Feed] Bluesky for ${handle}: no post in feed`); return; }

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

  const threadsApiClient = new ThreadsAPI({ verbose: false });
  const threadsUserIdCache = {};
  const getThreadsUserId = async (handle) => {
    if (threadsUserIdCache[handle]) return threadsUserIdCache[handle];
    const uid = await threadsApiClient.getUserIDfromUsername(handle);
    if (uid) threadsUserIdCache[handle] = uid;
    return uid;
  };

  const checkThreads = async (handle) => {
    try {
      const userId = await getThreadsUserId(handle);
      if (!userId) {
        console.error(`[Feed] Threads: could not get userID for ${handle}`);
        return;
      }

      const posts = await threadsApiClient.getUserProfileThreads(handle, userId);
      if (!posts || posts.length === 0) return;

      const latest = posts[0];
      const threadItem = latest.thread_items?.[0];
      if (!threadItem) return;

      const post = threadItem.post;
      const postId = post.pk;
      const text = post.caption?.text || "";
      const code = post.code;
      const url = `https://www.threads.net/t/${code}`;

      const lastId = bot.lastPosts.threads.get(handle);
      if (lastId && postId !== lastId) {
        bot.lastPosts.threads.set(handle, postId);
        await handleSocialPost("Threads", handle, text, url, bot, channelId);
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
    for (const yt of bot.ids.youtube ?? []) await checkVideo(yt);
    for (const handle of bot.ids.twitch ?? []) await checkStream(handle);
    for (const handle of bot.ids.bluesky ?? []) await checkBluesky(handle);
    for (const handle of bot.ids.threads ?? []) await checkThreads(handle);
    await flushPendingCrossposts(bot, channelId);
    saveCache(bot);
  }, 10 * 1000);

  setInterval(
    async () => {
      for (const handle of bot.ids.twitter ?? []) await checkTweet(handle);
      for (const yt of bot.ids.youtube ?? []) await checkVideo(yt);
      for (const handle of bot.ids.twitch ?? []) await checkStream(handle);
      for (const handle of bot.ids.bluesky ?? []) await checkBluesky(handle);
      for (const handle of bot.ids.threads ?? []) await checkThreads(handle);
      await flushPendingCrossposts(bot, channelId);
      cleanCrosspostCache(bot);
      saveCache(bot);
    },
    5 * 60 * 1000,
  );
}

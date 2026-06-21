export default {
  uptime: Date.now(),
  version: '1.0.0',
  commands: new Map(),
  cache: {
    guildData: new Map(),
    users: new Map(),
  },
  lastPosts: {
    tweets: new Map(),
    videos: new Map(),
    streams: new Map(),
  },
  ids: {
    guildId: '1518196109309120614',
    channels: {
      welcome: '1518196111456731168',
      feeds: '1518198192741810197',
    },
    twitter: ['TechPigYT'],
    youtube: ['@TechPigYT', '@TechPigExtra'],
    twitch: ['TechPigYT', 'TechPigExtra'],
  },
};

export default {
  uptime: Date.now(),
  version: '1.1.0',
  commands: new Map(),
  cache: {
    guildData: new Map(),
    users: new Map(),
  },
  lastPosts: {
    tweets: new Map(),
    videos: new Map(),
    streams: new Map(),
    bluesky: new Map(),
    threads: new Map(),
    crossposts: new Map(),
  },
  ids: {
    guildId: '1518196109309120614',
    roles: {
      streaming: '1519141863309836389',
    },
    channels: {
      welcome: '1518196111456731168',
      feeds: '1518198192741810197',
    },
    twitter: ['TechPigYT'],
    youtube: [
      { handle: '@TechPigYT', channelId: 'UCZSeLRViO3nVeZUon2eOscw' },
      { handle: '@TechPigExtra', channelId: 'UC5ir67ugxcQH2_taceOE3Fg' },
    ],
    twitch: ['TechPigYT', 'TechPigLIVE'],
    bluesky: ['techpig.tehcraft.xyz'],
    threads: ['tehpigyt'],
  },
};

const statuses = [
  { name: 'Custom Status', type: 4, state: '👀 lurking in the shadows' },
  { name: 'Custom Status', type: 4, state: '☕ sipping virtual coffee' },
  { name: 'Custom Status', type: 4, state: '🤖 ready for commands' },
  { name: 'Custom Status', type: 4, state: '🎲 waiting for your next move' },
  { name: 'Custom Status', type: 4, state: '💤 taking a power nap' },
  { name: 'Custom Status', type: 4, state: '🔮 predicting the future' },
  { name: 'Custom Status', type: 4, state: '🎯 vibing in the HQ' },
  { name: 'Custom Status', type: 4, state: '🗿 pondering existence' },
  { name: 'Custom Status', type: 4, state: '💀 gatekeeping the server' },
  { name: 'Custom Status', type: 4, state: '🎪 running a circus' },
  { name: 'Custom Status', type: 4, state: '🧠 thinking about life' },
  { name: 'Custom Status', type: 4, state: '🌀 causing chaos' },
];

export default {
  name: 'READY',
  once: true,
  run: async (bot) => {
    console.log('[Info] HQ Bot is live!');

    bot.cache.games = new Map();

    bot.updatePresence(0, {
      activities: [statuses[0]],
      status: 'online',
      since: 0,
      afk: false,
    }).catch(err => console.error('[Presence]', err));

    let i = 1;
    setInterval(() => {
      const activity = statuses[i % statuses.length];
      bot.updatePresence(0, {
        activities: [activity],
        status: 'online',
        since: 0,
        afk: false,
      }).catch(err => console.error('[Presence]', err));
      i++;
    }, 5 * 60 * 60 * 1000);

    const { startFeedChecker } = await import('../utils/feedChecker.js');
    startFeedChecker(bot);
  },
};

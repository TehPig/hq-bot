const statuses = [
  { name: '👀 lurking in the shadows', type: 3 },
  { name: '☕ sipping virtual coffee', type: 3 },
  { name: '🤖 ready for commands', type: 0 },
  { name: '🎲 waiting for your next move', type: 0 },
  { name: '💤 taking a power nap', type: 3 },
  { name: '🔮 predicting the future', type: 3 },
  { name: '🎯 vibing in the HQ', type: 0 },
  { name: '🗿 pondering existence', type: 2 },
  { name: '💀 gatekeeping the server', type: 3 },
  { name: '🎪 running a circus', type: 0 },
  { name: '🧠 thinking about life', type: 2 },
  { name: '🌀 causing chaos', type: 0 },
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

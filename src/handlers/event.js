import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function setupEvents(bot) {
  const files = readdirSync(resolve(__dirname, '../events'));
  const promises = [];

  for (const file of files) {
    if (!file.endsWith('.js')) continue;

    promises.push(
      import(`../events/${file}`).then(({ default: event }) => {
        if (!event.name) return;

        const fn = (...args) => event.run(bot, ...args);
        if (event.once) bot.once(event.name, fn);
        else bot.on(event.name, fn);
      })
    );
  }

  await Promise.all(promises);
}

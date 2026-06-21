import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function setupCommands(bot) {
  const files = readdirSync(resolve(__dirname, '../commands'));
  const promises = [];

  for (const file of files) {
    if (!file.endsWith('.js')) continue;

    promises.push(
      import(`../commands/${file}`).then(({ default: cmd }) => {
        if (cmd.name) bot.commands.set(cmd.name, cmd);
      })
    );
  }

  await Promise.all(promises);
}

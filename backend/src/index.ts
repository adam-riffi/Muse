import 'dotenv/config';
import { buildServer } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = buildServer({ config });

async function start(): Promise<void> {
  try {
    const address = await app.listen({ port: config.port, host: config.host });
    app.log.info(`Muse backend listening at ${address}`);
  } catch (error) {
    app.log.error({ err: error }, 'failed to start server');
    process.exit(1);
  }
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void app.close().then(() => {
      process.exit(0);
    });
  });
}

void start();

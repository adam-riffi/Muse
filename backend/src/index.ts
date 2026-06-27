import 'dotenv/config';
import { buildServer } from './app.js';
import { loadConfig } from './config.js';
import { detectAgentCli } from './services/cli-detect.js';

const config = loadConfig();
const app = buildServer({ config });

async function start(): Promise<void> {
  try {
    const address = await app.listen({ port: config.port, host: config.host });
    app.log.info(`Muse backend listening at ${address}`);

    const agent = await detectAgentCli(config);
    if (agent.available) {
      app.log.info(`${agent.provider} CLI detected (${agent.bin} ${agent.version ?? '?'})`);
    } else {
      app.log.warn(
        `${agent.provider} CLI not found on PATH (bin: ${agent.bin}). ` +
          `Discovery and propositions will fail until it is installed and authenticated, ` +
          `or set AGENT_CLI / CODEX_BIN / COPILOT_BIN.`,
      );
    }
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

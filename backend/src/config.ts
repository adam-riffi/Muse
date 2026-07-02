import { z } from 'zod';

const LogLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().min(1).default('127.0.0.1'),
  LOG_LEVEL: LogLevelSchema.default('info'),
  IMAGE_SOURCE: z.enum(['none', 'openverse', 'unsplash']).default('openverse'),
  UNSPLASH_ACCESS_KEY: z.string().min(1).optional(),
  AGENT_CLI: z.enum(['codex', 'copilot']).default('codex'),
  VLM_PROVIDER: z.enum(['none', 'anthropic', 'openai', 'copilot']).default('anthropic'),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  VLM_MODEL: z.string().min(1).optional(),
});

export type AppConfig = Readonly<{
  nodeEnv: z.infer<typeof EnvSchema>['NODE_ENV'];
  port: number;
  host: string;
  logLevel: z.infer<typeof LogLevelSchema>;
  imageSource: z.infer<typeof EnvSchema>['IMAGE_SOURCE'];
  unsplashAccessKey?: string;
  agentCli: z.infer<typeof EnvSchema>['AGENT_CLI'];
  vlmProvider: z.infer<typeof EnvSchema>['VLM_PROVIDER'];
  anthropicApiKey?: string;
  openaiApiKey?: string;
  vlmModel?: string;
}>;

// Pure: reads from the provided env (defaults to process.env) so it is trivially testable.
// dotenv is loaded by the entrypoint, not here.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.parse(env);
  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    host: parsed.HOST,
    logLevel: parsed.LOG_LEVEL,
    imageSource: parsed.IMAGE_SOURCE,
    ...(parsed.UNSPLASH_ACCESS_KEY !== undefined
      ? { unsplashAccessKey: parsed.UNSPLASH_ACCESS_KEY }
      : {}),
    agentCli: parsed.AGENT_CLI,
    vlmProvider: parsed.VLM_PROVIDER,
    ...(parsed.ANTHROPIC_API_KEY !== undefined
      ? { anthropicApiKey: parsed.ANTHROPIC_API_KEY }
      : {}),
    ...(parsed.OPENAI_API_KEY !== undefined ? { openaiApiKey: parsed.OPENAI_API_KEY } : {}),
    ...(parsed.VLM_MODEL !== undefined ? { vlmModel: parsed.VLM_MODEL } : {}),
  };
}

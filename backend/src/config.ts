import { z } from 'zod';

const LogLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().min(1).default('127.0.0.1'),
  LOG_LEVEL: LogLevelSchema.default('info'),
});

export type AppConfig = Readonly<{
  nodeEnv: z.infer<typeof EnvSchema>['NODE_ENV'];
  port: number;
  host: string;
  logLevel: z.infer<typeof LogLevelSchema>;
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
  };
}

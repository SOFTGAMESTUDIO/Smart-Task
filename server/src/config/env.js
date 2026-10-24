import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5005),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Direct MongoDB URI or individual encoded Atlas credentials
  MONGODB_URI: z.string().optional(),
  MONGODB_USERNAME: z.string().optional(),
  MONGODB_PASSWORD: z.string().optional(),
  MONGODB_CLUSTER: z.string().optional(),
  MONGODB_DB_NAME: z.string().default('AiTaksManagemt'),
  MONGODB_AUTH_SOURCE: z.string().optional(),
  MONGODB_AUTH_MECHANISM: z.string().optional(),

  // Local Ollama AI Runtime (default to Qwen per user instruction)
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5-coder:latest'),
  OLLAMA_TIMEOUT_MS: z.coerce.number().default(60000),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();

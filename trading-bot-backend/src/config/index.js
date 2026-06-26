require('dotenv').config();

const { z } = require('zod');

const envSchema = z.object({
  PORT: z.string().or(z.number()).default(5000),
  NODE_ENV: z.string().default('development'),
  JWT_SECRET: z.string({
    required_error: "JWT_SECRET is required",
  }).min(1, "JWT_SECRET cannot be empty"),
  REFRESH_SECRET: z.string({
    required_error: "REFRESH_SECRET is required",
  }).min(1, "REFRESH_SECRET cannot be empty"),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
  DATABASE_URL: z.string({
    required_error: "DATABASE_URL is required",
  }).min(1, "DATABASE_URL cannot be empty"),
  OUTLOOK_CLIENT_ID: z.string().optional(),
  OUTLOOK_CLIENT_SECRET: z.string().optional(),
  OUTLOOK_REDIRECT_URI: z.string().default('http://localhost:5000/api/outlook/callback'),
  RATE_LIMIT_GLOBAL_MAX: z.string().or(z.number()).default(300).transform(Number),
  RATE_LIMIT_GLOBAL_WINDOW_MS: z.string().or(z.number()).default(60000).transform(Number),
  RATE_LIMIT_STRICT_MAX: z.string().or(z.number()).default(20).transform(Number),
  RATE_LIMIT_STRICT_WINDOW_MS: z.string().or(z.number()).default(60000).transform(Number)
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error('❌ Missing or invalid environment variables:');
  console.error(envParsed.error.errors.map(err => `- ${err.path.join('.')}: ${err.message}`).join('\n'));
  process.exit(1);
}

module.exports = envParsed.data;

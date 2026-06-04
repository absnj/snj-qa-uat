// tests/config/Environments.ts
function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const env = {
  base: requiredEnv('UAT_URL'),
};
function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export function getBaseUrl(): string {
  return requiredEnv('UAT_URL');
}

export function getApiBaseUrl(): string {
  return requiredEnv('UAT_API_URL');
}

export function getApiTestMerchantStoreId(): string {
  return requiredEnv('UAT_API_MERCHANT_STORE_ID');
}

export function getApiTestBranchId(): string {
  return requiredEnv('UAT_API_BRANCH_ID');
}

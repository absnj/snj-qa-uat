import path from 'path';
import dotenv from 'dotenv';

const testEnvPath = path.resolve(__dirname, '..', '..', '.env');

export function loadTestEnv(): void {
  const result = dotenv.config({ path: testEnvPath });

  if (result.error) {
    throw new Error(`Missing test environment file: ${testEnvPath}`);
  }
}

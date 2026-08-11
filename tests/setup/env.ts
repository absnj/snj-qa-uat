import path from 'path';
import dotenv from 'dotenv';

const testEnvPath = path.resolve(__dirname, '..', '..', '.env');

export function loadTestEnv(): void {
  // quiet: dotenv v17 prints a banner (and rotating promo tips) on every
  // config() call. Playwright reloads this config in the main process, in
  // globalSetup, and in every worker, so that is one line per process
  // interleaved into the test output.
  const result = dotenv.config({ path: testEnvPath, quiet: true });

  if (result.error) {
    throw new Error(`Missing test environment file: ${testEnvPath}`);
  }
}

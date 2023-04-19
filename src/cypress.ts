import { readFile } from 'fs/promises'
import { CypressSauceConfig } from './types';

export async function loadCypressJobConfig (configFilePath: string): Promise<CypressSauceConfig> {
  try {
    const content = await readFile(configFilePath);
    const data = JSON.parse(content.toString());
    return data;
  } catch (e) {
    throw `Failed to read config from ${configFilePath}`;
  }
}

export async function runCypressJob (configFilePath: string) {
  const runnerConfig = await loadCypressJobConfig(configFilePath);

  console.log(runnerConfig);
  // Build Cypress Configuration
  // Execute Cypress
  // Execute Reporter
}
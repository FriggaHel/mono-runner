

// Global
export type CliParams = {
  configFile: string;
  suiteName: string;
  nodeBin: string;
}

export type KindContainer = {
  apiVersion: string;
  kind: string;
};

export type SauceConfig = {
  path: string;
  resultsDir: string;
};

// Cypress Config
export type CypressSuite = {
  name: string;
  browser: string;
  browserVersion: string;
  platformName: string;
  screenResolution: string;
  timeout: number;
  headless: boolean;

  config: {
    testingType: Cypress.TestingType ;
    specPattern: string[];
    excludeSpecPattern: string[];
    env: { [key: string]: string };
  };
}

export type CypressConfig = {
  configFile: string;
  version: string;
  record: boolean;
  key: string;
  reporters: string[] | null;
}

export type CypressConfigContainer = {
  cypress: CypressConfig;
  suites: CypressSuite[];
};

export type CypressSauceConfig = KindContainer & SauceConfig & CypressConfigContainer;

// Playwright Config
export type PlaywrightParams = {
  project?: string;
  timeout?: number;
  globalTimeout?: number;
  browserName?: string;
  headless?: boolean;
}

export type PlaywrightSuite = {
  name: string;
  platformName: string;
  testMatch: string[];
  params: PlaywrightParams;
  env: { [key: string]: string };
};

export type PlaywrightConfig = {
  configFile: string;
};

export type PlaywrightConfigContainer = {
  playwright: PlaywrightConfig;
  suites: PlaywrightSuite[];
};

export type PlaywrightSauceConfig = KindContainer & SauceConfig & PlaywrightConfigContainer & {
  junitFile: string;
  sauceReportFile: string;
};


// Global
export type CliParams = {
  configFile: string;
  suiteName: string;
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

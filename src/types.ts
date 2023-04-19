

// Global
export type CliParams = {
  configFile: string;
}

export type KindContainer = {
  apiVersion: string;
  kind: string;
};

export type SauceConfig = {
  dummy: string;
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
    testingType: string;
    specPattern: string[];
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

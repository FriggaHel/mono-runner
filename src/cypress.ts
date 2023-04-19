import { existsSync } from 'fs';
import { readFile } from 'fs/promises'
import cypress from 'cypress';
import * as path from 'path';
import { shouldRecordVideo, getAbsolutePath, loadRunConfig, prepareNpmEnv, getArgs, getEnv, preExec } from 'sauce-testrunner-utils';
import { CliParams, CypressSauceConfig, CypressSuite } from './types';

async function loadCypressJobConfig (configFilePath: string): Promise<CypressSauceConfig> {
  try {
    const content = await readFile(configFilePath);
    const data = JSON.parse(content.toString());
    return data;
  } catch (e) {
    throw `Failed to read config from ${configFilePath}`;
  }
}

function getSuite(runCfg: CypressSauceConfig, suiteName: string): CypressSuite {
  const suite = runCfg.suites.find((s) => s.name === suiteName);
  if (suite) {
    return suite;
  }

  const suiteNames = runCfg.suites.map((s) => s.name);
  throw new Error(`Could not find suite named '${suiteName}'; available suites=${JSON.stringify(suiteNames)}`);
}

function getCypressOpts(runCfg: CypressSauceConfig, suiteName: string): Partial<CypressCommandLine.CypressRunOptions> {
  const suite = getSuite(runCfg, suiteName);

  const projectDir = path.dirname(getAbsolutePath(runCfg.path));
  const cypressCfgFile = path.join(projectDir, runCfg.cypress.configFile);
  if (!existsSync(getAbsolutePath(cypressCfgFile))) {
    throw new Error(`Unable to locate the cypress config file. Looked for '${getAbsolutePath(cypressCfgFile)}'.`);
  }

  const testingType = suite.config.testingType || 'e2e';

  const opts = {
    project: projectDir,
    configFile: cypressCfgFile,
    browser: process.env.SAUCE_BROWSER || suite.browser || 'chrome',
    headed: !suite.headless,
    headless: !(!suite.headless),
    testingType,

    config: {
      [testingType]: {
        specPattern: suite.config.specPattern,
        excludeSpecPattern: suite.config.excludeSpecPattern || [],
      },
      video: shouldRecordVideo(),
      videosFolder: runCfg.resultsDir,
      screenshotsFolder: runCfg.resultsDir,
      videoCompression: false,
      videoUploadOnPasses: false,
      env: getEnv(suite),
    },
  } as Partial<CypressCommandLine.CypressRunOptions>;

  if (runCfg.cypress.record && runCfg.cypress.key !== undefined) {
    opts.record = runCfg.cypress.record;
    opts.key = runCfg.cypress.key;
    if (opts.config) {
      opts.config.videoUploadOnPasses = true;
    }
  }

  // Add reporters
  // opts = configureReporters(runCfg, opts);

  // Configure Webkit
  // configureWebkitOptions(process.env, opts, suite);

  return opts;
}

export async function runCypressJob (args: CliParams) {
  const runCfgPath = getAbsolutePath(args.configFile);
  const runCfg = await loadCypressJobConfig(runCfgPath);

  runCfg.path = runCfgPath;
  runCfg.resultsDir = path.join(path.dirname(runCfgPath), '__assets__');

  console.log(runCfg);
  const config = getCypressOpts(runCfg, args.suiteName);
  // FIXME: Run try-catch
  const res = await cypress.run(config);
  console.log(res);
  // Execute Reporter
}
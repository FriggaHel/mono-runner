import { existsSync, copyFileSync } from 'fs';
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import * as path from 'path';
import * as _ from 'lodash';
import { getAbsolutePath } from 'sauce-testrunner-utils';
import { CliParams, PlaywrightConfigContainer, PlaywrightSauceConfig, PlaywrightSuite } from './types';

async function loadPlaywrightJobConfig (configFilePath: string): Promise<PlaywrightSauceConfig> {
  try {
    const content = await readFile(configFilePath);
    const data = JSON.parse(content.toString());
    return data;
  } catch (e) {
    throw `Failed to read config from ${configFilePath}`;
  }
}

function getSuite(runCfg: PlaywrightConfigContainer, suiteName: string): PlaywrightSuite {
  const suite = runCfg.suites.find((s) => s.name === suiteName);
  if (suite) {
    return suite;
  }

  const suiteNames = runCfg.suites.map((s) => s.name);
  throw new Error(`Could not find suite named '${suiteName}'; available suites=${JSON.stringify(suiteNames)}`);
}
function toHyphenated (str: string): string {
  const out = [];
  for (let i = 0; i < str.length; i++) {
    const char = str.charAt(i);
    if (char.toUpperCase() === char && char.toLowerCase() !== char) {
      out.push('-');
      out.push(char.toLowerCase());
    } else {
      out.push(char);
    }
  }
  return out.join('');
}

function replaceLegacyKeys (args: { [key: string]: any }) {
  // browserName => browser
  if ('browserName' in args) {
    if (!('browser' in args)) {
      args.browser = args.browserName;
    }
    delete args.browserName;
  }
  // headful => headed
  if ('headful' in args) {
    if (!('headed' in args)) {
      args.headed = args.headful;
    }
    delete args.headful;
  }
  return args;
}

function setEnvironmentVariables (envVars: {[key: string]: string | number}) {
  if (!envVars) {
    return;
  }
  for (const [key, value] of Object.entries(envVars)) {
    process.env[key] = value as string;
  }
}


export async function runPlaywrightJob (args: CliParams) {
  const runCfgPath = getAbsolutePath(args.configFile);
  const runCfg = await loadPlaywrightJobConfig(runCfgPath);

  runCfg.path = runCfgPath;
  runCfg.resultsDir = path.join(path.dirname(runCfgPath), '__assets__');
  runCfg.junitFile = path.join(path.dirname(runCfgPath), '__assets__', 'junit.xml');
  runCfg.sauceReportFile = path.join(path.dirname(runCfgPath), '__assets__', 'sauce-report.json');

  const suite = getSuite(runCfg, args.suiteName);
  console.log(suite);

  const projectDir = path.dirname(getAbsolutePath(runCfg.path));

  // FIXME: Benefits ?
  const excludeParams = ['screenshot-on-failure', 'video', 'slow-mo', 'headless', 'headed'];
  if (suite.param.browserName === 'chrome') {
    excludeParams.push('browser');
  }

  // Define env vars
  process.env.BROWSER_NAME = suite.param.browserName;
  process.env.HEADLESS = suite.param.headless as unknown as string;
  process.env.SAUCE_SUITE_NAME = suite.name;

  process.env.SAUCE_ARTIFACTS_DIRECTORY = runCfg.resultsDir;

  if (runCfg.playwright.configFile) {
    const playwrightCfgFile = path.join(projectDir, runCfg.playwright.configFile);
    if (existsSync(playwrightCfgFile)) {
      process.env.PLAYWRIGHT_CFG_FILE = playwrightCfgFile;
    } else {
      throw new Error(`Could not find playwright config file: '${playwrightCfgFile}'`);
    }
  }

  if (suite.param.project) {
    process.env.project = suite.param.project;
  }


  // Copy our runner's playwright config to a custom location in order to
  // preserve the customer's config which we may want to load in the future
  const configFile = path.join(projectDir, 'sauce.config.mjs');
  copyFileSync(path.join(__dirname, 'sauce.config.mjs'), configFile);

  const defaultArgs = {
    output: runCfg.resultsDir,
    config: configFile,
  };

  const playwrightBin = path.join(__dirname, '..', 'node_modules', '@playwright', 'test', 'cli.js');
  const procArgs = [
    playwrightBin, 'test'
  ];

  // Default value for timeout (30min)
  if (!suite.param.globalTimeout) {
    suite.param.timeout = 1800000;
  }

  const pwArgs = _.defaultsDeep(defaultArgs, replaceLegacyKeys(suite.param));

  // There is a conflict if the playwright project has a `browser` defined,
  // since the job is launched with the browser set by saucectl, which is now set as the job's metadata.
  const isRunProject = Object.keys(pwArgs).find((k) => k === 'project');
  if (isRunProject) {
    excludeParams.push('browser');
  }

  for (const [key, value] of Object.entries(pwArgs)) {
    const fixedKey = toHyphenated(key);
    if (excludeParams.includes(key.toLowerCase()) || value as unknown === false) {
      continue;
    }
    procArgs.push(`--${fixedKey}`);
    if (value as unknown !== true) {
      procArgs.push(value as string);
    }
  }

  // Thread testMatch as arrays by default.
  // Older versions saucectl are only providing a single value.
  if (!Array.isArray(suite.testMatch)) {
    suite.testMatch = [suite.testMatch];
  }
  procArgs.push(...suite.testMatch);

  // FIXME: Solve this
  // args = _.defaultsDeep(suite, args);
  // if (args.testIgnore && args.testIgnore.length > 0) {
  //   process.env.TEST_IGNORE = args.testIgnore;
  // }

  // runCfg.args = args;
  const env = {
    ...process.env,
    ...suite.env,
    // FIXME: Fix reporter
    PLAYWRIGHT_JUNIT_OUTPUT_NAME: runCfg.junitFile,
    SAUCE_REPORT_OUTPUT_NAME: runCfg.sauceReportFile,
    FORCE_COLOR: "0",
  };

  setEnvironmentVariables(env);

  const playwrightProc = spawn(args.nodeBin, procArgs, {stdio: 'inherit', cwd: projectDir, env: env as NodeJS.ProcessEnv});
  const playwrightPromise = new Promise((resolve) => {
    playwrightProc.on('close', (code /*, ...args*/) => {
      const hasPassed = code === 0;
      resolve(hasPassed);
    });
  });

  const hasPassed = await playwrightPromise;
  return hasPassed;
}

  // FIXME Add NPM Support
  /*
  // Install NPM dependencies
  let metrics = [];

  // Define node/npm path for execution
  const npmBin = path.join(path.dirname(nodeBin), 'node_modules', 'npm', 'bin', 'npm-cli.js');
  const nodeCtx = { nodePath: nodeBin, npmPath: npmBin };

  // runCfg.path must be set for prepareNpmEnv to find node_modules. :(
  let npmMetrics = await prepareNpmEnv(runCfg, nodeCtx);
  metrics.push(npmMetrics);

  // Run suite preExecs
  if (!await preExec.run(suite, runCfg.preExecTimeout)) {
    return false;
  }
  */




  // let startTime, endTime, hasPassed = false;
  // try {
  //   startTime = new Date().toISOString();
  //   hasPassed = await playwrightPromise;
  //   endTime = new Date().toISOString();
  // } catch (e) {
  //   console.error(`Could not complete job. Reason: ${e}`);
  // }
  // return {
  //   startTime,
  //   endTime,
  //   hasPassed,
  //   metrics,
  // };
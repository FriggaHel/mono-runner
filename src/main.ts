import { readFile } from 'fs/promises';
import { ArgumentParser } from 'argparse';
import { CliParams, KindContainer } from './types';
import { runCypressJob } from './cypress';
import { runPlaywrightJob } from './playwright';


async function getConfigKind (runnerConfigPath: string): Promise<KindContainer> {
  try {
    const content = await readFile(runnerConfigPath);
    const data = JSON.parse(content.toString());
    return data;
  } catch (e) {
    console.error(`unable to load ${runnerConfigPath}`);
    return {
      APIVersion: 'unknown',
      Kind: 'unknown',
    }
  }
}

async function main (args: CliParams) {
  console.log(`mono-runner`);
  const kind = await getConfigKind(args.configFile);

  switch (kind.Kind) {
    case 'cypress':
      console.log('executing cypress');
      runCypressJob(args);
      break;
    case 'playwright':
      console.log('executing playwright');
      runPlaywrightJob(args);
      break;
    default:
      console.error(`"${kind.Kind}" framework is unknown.`);
  }

}

function parseArgs (): CliParams | undefined {
  const parser = new ArgumentParser({
    description: 'mono-runner'
  });

  parser.add_argument('-r', '--runCfgPath', { help: 'Path to the configuration file' });
  parser.add_argument('-s', '--suiteName', { help: 'Suite to execute' });

  const args = parser.parse_args();
  if (!args.runCfgPath) {
    console.log('--runCfgPath needs to be specified');
    return;
  }
  if (!args.suiteName) {
    console.log('--suiteName needs to be specified');
    return;
  }

  return {
    configFile: args.runCfgPath,
    suiteName: args.suiteName,
    nodeBin: process.argv[0],
  }
}

(async function () {
  const args = parseArgs();
  if (!args) {
    process.exit(1);
  }
  await main(args);
})();
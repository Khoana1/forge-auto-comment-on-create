/**
 * Forge lint for CI — validates manifest + src without forge login or analytics prompt.
 * Uses the same @forge/lint engine as `forge lint`, but skips Forge CLI auth/consent flow.
 */
const path = require('path');
const forgeCliRoot = path.dirname(require.resolve('@forge/cli/package.json'));
const { lint, problemCount } = require(path.join(forgeCliRoot, 'node_modules/@forge/lint'));
const {
  ConfigFile,
  FileSystemReader,
  listGitIgnoreFiles,
} = require(path.join(forgeCliRoot, 'node_modules/@forge/cli-shared'));

const DEFAULT_DIRECTORY = './src';

const statsigService = {
  checkGate: async () => null,
  getDynamicConfig: async () => null,
  getDeprecatedRuntimes: async () => [],
};

const logger = {
  info: () => {},
  warn: (msg) => console.warn(msg),
  error: (msg) => console.error(msg),
  debug: () => {},
};

async function collectFilesToLint(fileSystemReader) {
  const configFile = new ConfigFile(fileSystemReader);
  const UIKitResources = await configFile.getResources(['nativeUI']);
  const UIKitDirectories = UIKitResources.map((resource) => path.dirname(resource.path));
  const exclude = [...(await listGitIgnoreFiles(fileSystemReader)), '.git', 'node_modules'];

  const [filesToLint, ...UIKitFilesByDirectory] = await Promise.all([
    fileSystemReader.recursiveReadDir(DEFAULT_DIRECTORY, exclude),
    ...UIKitDirectories.map((directory) => fileSystemReader.recursiveReadDir(directory, exclude)),
  ]);

  const UIKitFilesToLint = UIKitFilesByDirectory.reduce(
    (allFiles, directoryFiles) => allFiles.concat(directoryFiles),
    [],
  );

  return filesToLint
    .concat(UIKitFilesToLint)
    .filter((value, index, arr) => arr.indexOf(value) === index);
}

async function main() {
  const fileSystemReader = new FileSystemReader();
  const configFile = new ConfigFile(fileSystemReader);
  const manifest = await configFile.readConfig();
  const filesToLint = await collectFilesToLint(fileSystemReader);
  const lintResults = await lint(filesToLint, manifest, 'development', logger, statsigService);
  const counts = problemCount(lintResults);

  for (const result of lintResults) {
    for (const issue of [...result.errors, ...result.warnings]) {
      const level = result.errors.includes(issue) ? 'error' : 'warning';
      console.log(`${level}: ${issue.reference} — ${issue.message}`);
    }
  }

  if (counts.errors > 0) {
    console.error(`\nForge lint failed with ${counts.errors} error(s).`);
    process.exit(1);
  }

  console.log('No issues found.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

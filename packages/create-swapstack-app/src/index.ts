#!/usr/bin/env node

import type { ParsedArgs } from './args.js';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { downloadTemplate } from 'giget';
import prompts from 'prompts';

import { parseArgs } from './args.js';
import { checkTargetDir } from './fs-utils.js';
import {
  renameAppFiles,
  slugify,
  validateAndroidPackage,
  validateAppName,
  validateIosBundleId,
  validateUrlScheme,
} from './rename.js';

function defaultNameFromDir(dir: string): string {
  const base = path.basename(path.resolve(process.cwd(), dir));
  if (!base || base === '.' || base === '/') {
    return 'Swapstack';
  }
  return base
    .split(/[-_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function resolveTargetDir(args: ParsedArgs): Promise<string> {
  if (args.targetDir) {
    return args.targetDir;
  }
  if (args.yes) {
    return 'my-swapstack-app';
  }

  const response = await prompts(
    {
      type: 'text',
      name: 'dir',
      message: 'Where would you like to create your app?',
      initial: 'my-app',
    },
    {
      onCancel: () => {
        console.log('\nOperation cancelled.');
        process.exit(1);
      },
    },
  );

  if (!response.dir || !response.dir.trim()) {
    console.error('Error: Project directory is required.');
    process.exit(1);
  }
  return response.dir.trim();
}

async function resolveAppName(args: ParsedArgs, targetDir: string): Promise<string> {
  if (args.name) {
    return args.name;
  }
  const defaultName = defaultNameFromDir(targetDir);
  if (args.yes) {
    return defaultName;
  }

  const res = await prompts(
    {
      type: 'text',
      name: 'name',
      message: 'App display name:',
      initial: defaultName,
      validate: (val: string) =>
        validateAppName(val)
          ? true
          : 'App name must contain at least one letter or number.',
    },
    {
      onCancel: () => {
        console.log('\nOperation cancelled.');
        process.exit(1);
      },
    },
  );

  return res.name ? res.name.trim() : defaultName;
}

async function resolveBundleIds(
  args: ParsedArgs,
): Promise<{ iosBundleId: string; androidPackage: string }> {
  let iosBundleId = args.iosBundleId;
  if (!iosBundleId) {
    const res = await prompts(
      {
        type: 'text',
        name: 'bundleId',
        message: 'iOS Bundle ID (e.g. com.example.app):',
        validate: (val: string) =>
          validateIosBundleId(val.trim())
            ? true
            : 'iOS bundle ID must contain only letters, digits, hyphens, and dots (e.g. com.example.app).',
      },
      {
        onCancel: () => {
          console.log('\nOperation cancelled.');
          process.exit(1);
        },
      },
    );
    iosBundleId = res.bundleId ? res.bundleId.trim() : '';
  }

  let androidPackage = args.androidPackage;
  if (!androidPackage) {
    const defaultPkg = iosBundleId && validateAndroidPackage(iosBundleId) ? iosBundleId : undefined;
    const res = await prompts(
      {
        type: 'text',
        name: 'pkg',
        message: 'Android Package Name (e.g. com.example.app):',
        initial: defaultPkg,
        validate: (val: string) =>
          validateAndroidPackage(val.trim())
            ? true
            : 'Android package cannot have digit-leading segments, hyphens, or Java/Kotlin reserved words.',
      },
      {
        onCancel: () => {
          console.log('\nOperation cancelled.');
          process.exit(1);
        },
      },
    );
    androidPackage = res.pkg ? res.pkg.trim() : (defaultPkg ?? '');
  }

  return {
    iosBundleId: iosBundleId ?? '',
    androidPackage: androidPackage ?? '',
  };
}

function printHelp(): void {
  console.log(`
Usage:
  npx create-swapstack-app <project-directory> [options]

Options:
  --name <name>               Application display name
  --bundle-id <id>            Bundle ID for both iOS and Android (e.g. com.example.app)
  --ios-bundle-id <id>        Apple bundle identifier
  --android-package <id>      Android application ID
  --no-install                Skip running pnpm install
  --no-git                    Skip initializing a git repository
  --yes, -y                   Accept all defaults without prompting
  -h, --help                  Display this help message
  -v, --version               Display CLI version
`);
}

function initGitAndInstallDeps(
  targetPath: string,
  targetDir: string,
  args: ParsedArgs,
): void {
  if (args.git) {
    try {
      execSync('git init', { cwd: targetPath, stdio: 'ignore' });
      console.log('Initialized git repository.');
    }
    catch {
      console.warn('Warning: Failed to initialize git repository.');
    }
  }

  if (args.install) {
    console.log('\nInstalling dependencies with pnpm...\n');
    try {
      execSync('pnpm install', { cwd: targetPath, stdio: 'inherit' });
    }
    catch (error) {
      console.error('\nError: Failed to install dependencies with pnpm.');
      if (error instanceof Error && error.message) {
        console.error(error.message);
      }
      console.log('\nNext steps:');
      console.log(`  cd ${targetDir}`);
      console.log('  pnpm install');
      console.log('  pnpm run setup   # if needed to reconfigure environment variables');
      console.log('  pnpm start       # to start the Expo development server\n');
      process.exit(1);
    }
  }
}

async function run(): Promise<void> {
  let args: ParsedArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  }
  catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  if (args.help) {
    printHelp();
    return;
  }

  if (args.version) {
    try {
      const { createRequire } = await import('node:module');
      const require = createRequire(import.meta.url);
      const pkg = require('../package.json') as { version: string };
      console.log(`create-swapstack-app v${pkg.version}`);
    }
    catch {
      console.log('create-swapstack-app v0.1.0');
    }
    return;
  }

  if (args.yes && !args.iosBundleId && !args.androidPackage) {
    console.error('Error: --bundle-id (or --ios-bundle-id and --android-package) is required when using --yes.');
    process.exit(1);
  }

  const targetDir = await resolveTargetDir(args);
  const targetPath = path.resolve(process.cwd(), targetDir);
  const dirCheck = checkTargetDir(targetPath);
  if (!dirCheck.ok) {
    console.error(`Error: ${dirCheck.error}`);
    process.exit(1);
  }

  const appName = await resolveAppName(args, targetDir);
  if (!validateAppName(appName)) {
    console.error('Error: App name must contain at least one letter or number.');
    process.exit(1);
  }

  const slug = slugify(appName);
  if (!validateUrlScheme(slug)) {
    console.error('Error: App name generates an invalid URL scheme. URL scheme must start with a letter.');
    process.exit(1);
  }

  const { iosBundleId, androidPackage } = await resolveBundleIds(args);
  if (!validateIosBundleId(iosBundleId)) {
    console.error('Error: iOS bundle ID must contain only letters, digits, hyphens, and dots (e.g. com.example.app).');
    process.exit(1);
  }
  if (!validateAndroidPackage(androidPackage)) {
    console.error('Error: Android package name cannot have digit-leading segments, hyphens, or Java/Kotlin reserved words.');
    process.exit(1);
  }

  console.log(`\nCreating a new Swapstack app in ${targetPath}...\n`);
  console.log('Downloading template from github:swapstack/swapstack (main)...');

  try {
    await downloadTemplate('github:swapstack/swapstack#main', {
      dir: targetPath,
      force: false,
    });
  }
  catch (error) {
    console.error('Failed to download template:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  console.log('Configuring application identity...');
  await renameAppFiles(targetPath, {
    name: appName,
    iosBundleId,
    androidPackage,
  });

  initGitAndInstallDeps(targetPath, targetDir, args);

  console.log(`\n🎉 Success! Created ${appName} at ${targetPath}\n`);
  console.log('Next steps:');
  console.log(`  cd ${targetDir}`);
  if (!args.install) {
    console.log('  pnpm install');
  }
  console.log('  pnpm run setup   # if needed to reconfigure environment variables');
  console.log('  pnpm start       # to start the Expo development server\n');
}

run().catch((error) => {
  console.error('\nUnexpected error:', error instanceof Error ? error.message : error);
  process.exit(1);
});

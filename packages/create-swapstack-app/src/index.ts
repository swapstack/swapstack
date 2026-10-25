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
  validateAppName,
  validateBundleId,
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
  appName: string,
): Promise<{ iosBundleId: string; androidPackage: string }> {
  const slug = slugify(appName);
  const sanitizedSlug = slug.replace(/[^a-z0-9]/g, '') || 'app';
  const defaultBundleId = `com.swapstack.${sanitizedSlug}`;

  let iosBundleId = args.iosBundleId;
  if (!iosBundleId) {
    if (args.yes) {
      iosBundleId = defaultBundleId;
    }
    else {
      const res = await prompts(
        {
          type: 'text',
          name: 'bundleId',
          message: 'iOS Bundle ID (reverse-domain identifier):',
          initial: defaultBundleId,
          validate: (val: string) =>
            validateBundleId(val)
              ? true
              : 'Bundle ID must be in reverse-domain format (e.g. com.example.app).',
        },
        {
          onCancel: () => {
            console.log('\nOperation cancelled.');
            process.exit(1);
          },
        },
      );
      iosBundleId = res.bundleId ? res.bundleId.trim() : defaultBundleId;
    }
  }

  let androidPackage = args.androidPackage;
  if (!androidPackage) {
    if (args.yes) {
      androidPackage = iosBundleId;
    }
    else {
      const res = await prompts(
        {
          type: 'text',
          name: 'pkg',
          message: 'Android Package Name:',
          initial: iosBundleId,
          validate: (val: string) =>
            validateBundleId(val)
              ? true
              : 'Package name must be in reverse-domain format (e.g. com.example.app).',
        },
        {
          onCancel: () => {
            console.log('\nOperation cancelled.');
            process.exit(1);
          },
        },
      );
      androidPackage = res.pkg ? res.pkg.trim() : iosBundleId;
    }
  }

  return {
    iosBundleId: iosBundleId ?? defaultBundleId,
    androidPackage: androidPackage ?? defaultBundleId,
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

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

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

  const { iosBundleId, androidPackage } = await resolveBundleIds(args, appName);
  if (!validateBundleId(iosBundleId) || !validateBundleId(androidPackage)) {
    console.error('Error: Bundle ID and package name must be in reverse-domain format (e.g. com.example.app).');
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

  if (args.git) {
    try {
      execSync('git init', { cwd: targetPath, stdio: 'ignore' });
      console.log('Initialized git repository.');
    }
    catch {
      // Ignore git init errors if git is unavailable
    }
  }

  if (args.install) {
    console.log('\nInstalling dependencies with pnpm...\n');
    try {
      execSync('pnpm install', { cwd: targetPath, stdio: 'inherit' });
    }
    catch {
      console.warn('\nWarning: Dependency installation failed. You can run "pnpm install" manually.\n');
    }
  }

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

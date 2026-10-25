import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  renameAppFiles,
  slugify,
  validateAppName,
  validateBundleId,
} from '../src/rename.js';

describe('rename step', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'swapstack-rename-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('slugifies names correctly', () => {
    assert.equal(slugify('My Super App!'), 'my-super-app');
    assert.equal(slugify('Café & Restaurant'), 'cafe-restaurant');
    assert.equal(slugify('---hello---world---'), 'hello-world');
  });

  it('validates app names', () => {
    assert.equal(validateAppName('My App'), true);
    assert.equal(validateAppName(''), false);
    assert.equal(validateAppName('   '), false);
    assert.equal(validateAppName('!@#$%'), false);
  });

  it('validates bundle IDs', () => {
    assert.equal(validateBundleId('com.swapstack.app'), true);
    assert.equal(validateBundleId('io.github.user.app'), true);
    assert.equal(validateBundleId('invalid'), false);
    assert.equal(validateBundleId('123.com'), false);
    assert.equal(validateBundleId(''), false);
  });

  it('renames app files and creates .env from .env.example', async () => {
    const envTsContent = `import { z } from 'zod';
const DEFAULT_APP_IDENTITY = {
  APP_NAME: 'Swapstack',
  APP_SLUG: 'swapstack',
  APP_SCHEME: 'swapstack',
  IOS_BUNDLE_ID: 'com.swapstack.app',
  ANDROID_PACKAGE: 'com.swapstack.app',
} as const;
export const env = {};
`;
    const envExampleContent = `# Display name
APP_NAME=Swapstack
APP_SLUG=swapstack
APP_SCHEME=swapstack
IOS_BUNDLE_ID=com.swapstack.app
ANDROID_PACKAGE=com.swapstack.app
EXPO_PUBLIC_AUTH_PROVIDER=mock
`;
    const packageJsonContent = JSON.stringify(
      {
        name: 'swapstack',
        version: '0.1.0',
        private: true,
      },
      null,
      2,
    );
    const readmeContent = `# Swapstack

Swapstack is a developer boilerplate.
`;

    writeFileSync(path.join(tempDir, 'env.ts'), envTsContent);
    writeFileSync(path.join(tempDir, '.env.example'), envExampleContent);
    writeFileSync(path.join(tempDir, 'package.json'), packageJsonContent);
    writeFileSync(path.join(tempDir, 'README.md'), readmeContent);

    await renameAppFiles(tempDir, {
      name: 'Rocket Launch',
      iosBundleId: 'com.aerospace.rocket',
      androidPackage: 'com.aerospace.rocket',
    });

    // Verify env.ts
    const updatedEnvTs = readFileSync(path.join(tempDir, 'env.ts'), 'utf8');
    assert.match(updatedEnvTs, /APP_NAME:\s*'Rocket Launch'/);
    assert.match(updatedEnvTs, /APP_SLUG:\s*'rocket-launch'/);
    assert.match(updatedEnvTs, /IOS_BUNDLE_ID:\s*'com.aerospace.rocket'/);
    assert.match(updatedEnvTs, /ANDROID_PACKAGE:\s*'com.aerospace.rocket'/);

    // Verify .env.example
    const updatedEnvExample = readFileSync(
      path.join(tempDir, '.env.example'),
      'utf8',
    );
    assert.match(updatedEnvExample, /APP_NAME=Rocket Launch/);
    assert.match(updatedEnvExample, /APP_SLUG=rocket-launch/);
    assert.match(updatedEnvExample, /IOS_BUNDLE_ID=com.aerospace.rocket/);
    assert.match(updatedEnvExample, /EXPO_PUBLIC_AUTH_PROVIDER=mock/);

    // Verify .env created from .env.example
    const createdEnv = readFileSync(path.join(tempDir, '.env'), 'utf8');
    assert.equal(createdEnv, updatedEnvExample);

    // Verify package.json
    const updatedPkg = JSON.parse(
      readFileSync(path.join(tempDir, 'package.json'), 'utf8'),
    ) as { name: string };
    assert.equal(updatedPkg.name, 'rocket-launch');

    // Verify README.md
    const updatedReadme = readFileSync(path.join(tempDir, 'README.md'), 'utf8');
    assert.match(updatedReadme, /^# Rocket Launch/);
  });
});

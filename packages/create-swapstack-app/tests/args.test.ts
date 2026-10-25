import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseArgs } from '../src/args.js';

describe('argument parsing', () => {
  it('parses defaults when no arguments are provided', () => {
    const parsed = parseArgs([]);
    assert.equal(parsed.targetDir, undefined);
    assert.equal(parsed.name, undefined);
    assert.equal(parsed.iosBundleId, undefined);
    assert.equal(parsed.androidPackage, undefined);
    assert.equal(parsed.install, true);
    assert.equal(parsed.git, true);
    assert.equal(parsed.yes, false);
    assert.equal(parsed.help, false);
    assert.equal(parsed.version, false);
  });

  it('parses positional target directory', () => {
    const parsed = parseArgs(['my-mobile-app']);
    assert.equal(parsed.targetDir, 'my-mobile-app');
  });

  it('parses flags with space syntax', () => {
    const parsed = parseArgs([
      'cool-app',
      '--name',
      'Cool App',
      '--bundle-id',
      'com.company.coolapp',
      '--no-install',
      '--no-git',
      '--yes',
    ]);

    assert.equal(parsed.targetDir, 'cool-app');
    assert.equal(parsed.name, 'Cool App');
    assert.equal(parsed.iosBundleId, 'com.company.coolapp');
    assert.equal(parsed.androidPackage, 'com.company.coolapp');
    assert.equal(parsed.install, false);
    assert.equal(parsed.git, false);
    assert.equal(parsed.yes, true);
  });

  it('parses flags with equals syntax', () => {
    const parsed = parseArgs([
      'test-app',
      '--name=Super App',
      '--ios-bundle-id=com.ios.app',
      '--android-package=com.android.app',
    ]);

    assert.equal(parsed.targetDir, 'test-app');
    assert.equal(parsed.name, 'Super App');
    assert.equal(parsed.iosBundleId, 'com.ios.app');
    assert.equal(parsed.androidPackage, 'com.android.app');
  });

  it('parses short flags', () => {
    const parsedHelp = parseArgs(['-h']);
    assert.equal(parsedHelp.help, true);

    const parsedVersion = parseArgs(['-v']);
    assert.equal(parsedVersion.version, true);

    const parsedYes = parseArgs(['-y', 'quick-app']);
    assert.equal(parsedYes.yes, true);
    assert.equal(parsedYes.targetDir, 'quick-app');
  });
});

import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { checkTargetDir } from '../src/fs-utils.js';

describe('folder checks', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'swapstack-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('allows non-existent target directories', () => {
    const target = path.join(tempDir, 'does-not-exist');
    const result = checkTargetDir(target);
    assert.equal(result.ok, true);
    assert.equal(result.error, undefined);
  });

  it('allows empty directories', () => {
    const emptyDir = path.join(tempDir, 'empty-dir');
    mkdirSync(emptyDir, { recursive: true });
    const result = checkTargetDir(emptyDir);
    assert.equal(result.ok, true);
  });

  it('refuses to write into non-empty directories', () => {
    const nonEmpty = path.join(tempDir, 'has-files');
    mkdirSync(nonEmpty, { recursive: true });
    writeFileSync(path.join(nonEmpty, 'some-file.txt'), 'hello');

    const result = checkTargetDir(nonEmpty);
    assert.equal(result.ok, false);
    assert.match(result.error || '', /is not empty/i);
  });

  it('refuses when target path exists as a file', () => {
    const filePath = path.join(tempDir, 'existing-file.txt');
    writeFileSync(filePath, 'i am a file');

    const result = checkTargetDir(filePath);
    assert.equal(result.ok, false);
    assert.match(result.error || '', /not a directory/i);
  });
});

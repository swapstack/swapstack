import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function setup() {
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  await new Promise<void>((resolve, reject) => {
    const child = spawn(pnpm, ['rename-app'], { cwd: root, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      }
      else {
        reject(new Error('App rename failed.'));
      }
    });
  });

  if (!existsSync(path.join(root, '.env'))) {
    await copyFile(path.join(root, '.env.example'), path.join(root, '.env'));
    console.log('Created .env from .env.example.');
  }

  console.log('\nNext command: pnpm start');
}

setup().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const cliDir = path.join(root, 'packages', 'create-swapstack-app');

const rootPkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const cliPkg = JSON.parse(readFileSync(path.join(cliDir, 'package.json'), 'utf8'));

if (rootPkg.version !== cliPkg.version) {
  throw new Error(
    `Version mismatch: root package.json (${rootPkg.version}) does not match packages/create-swapstack-app/package.json (${cliPkg.version}). Keep them synchronized.`,
  );
}

console.log(`Verified package versions match: ${rootPkg.version}`);

console.log('Building create-swapstack-app...');
execSync('pnpm run build', { cwd: cliDir, stdio: 'inherit' });

console.log('Testing create-swapstack-app...');
execSync('pnpm test', { cwd: cliDir, stdio: 'inherit' });

console.log('Verifying CLI binary help flags...');
const helpOutput = execSync('node dist/index.js --help', { cwd: cliDir, encoding: 'utf8' });
const requiredFlags = ['--template', '--theme', '--style', '--ui', '--auth', '--data', '--billing'];
for (const flag of requiredFlags) {
  if (!helpOutput.includes(flag)) {
    throw new Error(`CLI build missing required flag in help output: ${flag}`);
  }
}
console.log('All required CLI flags verified in build output.');

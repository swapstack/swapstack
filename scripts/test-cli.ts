import { execSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const cliDir = path.join(root, 'packages', 'create-swapstack-app');

console.log('Building create-swapstack-app...');
execSync('pnpm run build', { cwd: cliDir, stdio: 'inherit' });

console.log('Testing create-swapstack-app...');
execSync('pnpm test', { cwd: cliDir, stdio: 'inherit' });

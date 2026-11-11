import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  escapeDotenvValue,
  escapeTsStringLiteral,
  removePackagesFromWorkspaceYaml,
  renameAppFiles,
  slugify,
  updateEnvContent,
  validateAndroidPackage,
  validateAppName,
  validateBundleId,
  validateIosBundleId,
  validateUrlScheme,
} from '../src/rename.js';
import {
  buildCliCommandFromStudio,
  buildStudioHtml,
  validateStudioRequest,
} from '../src/ui-server.js';

describe('identifier validators', () => {
  it('validates iOS bundle IDs strictly', () => {
    assert.equal(validateIosBundleId('com.example.app'), true);
    assert.equal(validateIosBundleId('com.example.my-app'), true);
    assert.equal(validateIosBundleId('com.1example.app'), true);
    assert.equal(validateIosBundleId('com.example.app_1'), false); // underscores disallowed
    assert.equal(validateIosBundleId('invalid'), false);
    assert.equal(validateIosBundleId(''), false);
  });

  it('validates Android packages strictly', () => {
    assert.equal(validateAndroidPackage('com.example.app'), true);
    assert.equal(validateAndroidPackage('com.example.my_app'), true);
    assert.equal(validateAndroidPackage('com.1example.app'), false); // digit-leading segment
    assert.equal(validateAndroidPackage('com.example.class'), false); // Java keyword
    assert.equal(validateAndroidPackage('com.example.fun'), false); // Kotlin keyword
    assert.equal(validateAndroidPackage('com.example.val'), false); // Kotlin keyword
    assert.equal(validateAndroidPackage('com.example.foo-bar'), false); // hyphens disallowed
    assert.equal(validateAndroidPackage('invalid'), false);
  });

  it('validates URL schemes strictly', () => {
    assert.equal(validateUrlScheme('myapp'), true);
    assert.equal(validateUrlScheme('my-app'), true);
    assert.equal(validateUrlScheme('1myapp'), false); // must start with letter
    assert.equal(validateUrlScheme('-myapp'), false);
    assert.equal(validateUrlScheme(''), false);
  });
});

describe('escaping helpers', () => {
  it('escapes dotenv values when containing spaces, quotes, or special characters', () => {
    assert.equal(escapeDotenvValue('Simple'), 'Simple');
    assert.equal(escapeDotenvValue('My App'), '"My App"');
    assert.equal(escapeDotenvValue('App $100'), '"App \\$100"');
    assert.equal(escapeDotenvValue('He said "hello"'), '"He said \\"hello\\""');
  });

  it('escapes TypeScript string literals', () => {
    assert.equal(escapeTsStringLiteral('Simple'), 'Simple');
    assert.equal(escapeTsStringLiteral('It\'s cool'), 'It\\\'s cool');
    assert.equal(escapeTsStringLiteral('Line1\nLine2'), 'Line1\\nLine2');
  });

  it('updates env content in place preserving other variables and comments', () => {
    const input = `# Comment
APP_NAME=Old
APP_SLUG=old
EXPO_PUBLIC_AUTH_PROVIDER=mock
`;
    const updated = updateEnvContent(input, {
      APP_NAME: 'New $100 App',
      APP_SLUG: 'new-app',
      APP_SCHEME: 'newapp',
      IOS_BUNDLE_ID: 'com.new.app',
      ANDROID_PACKAGE: 'com.new.app',
    });

    assert.match(updated, /# Comment/);
    assert.match(updated, /APP_NAME="New \\\$100 App"/);
    assert.match(updated, /EXPO_PUBLIC_AUTH_PROVIDER=mock/);
  });
});

describe('rename helpers', () => {
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

  it('validates bundle IDs combining iOS and Android rules', () => {
    assert.equal(validateBundleId('com.swapstack.app'), true);
    assert.equal(validateBundleId('com.example.foo-bar'), false); // fails android
    assert.equal(validateBundleId('com.example.class'), false); // fails android
  });

  it('removes packages from pnpm-workspace.yaml while keeping other settings', () => {
    const input = `shellEmulator: true

trustPolicy: no-downgrade

packages:
  - .
  - 'packages/*'
`;
    const result = removePackagesFromWorkspaceYaml(input);
    assert.match(result, /shellEmulator:\s*true/);
    assert.match(result, /trustPolicy:\s*no-downgrade/);
    assert.doesNotMatch(result, /packages:/);
    assert.doesNotMatch(result, /packages\/\*/);
  });
});

describe('renameAppFiles', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'swapstack-rename-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('renames app files and handles special dollar signs in app names', async () => {
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
    const packageJsonContent = JSON.stringify({
      name: 'swapstack',
      version: '0.1.0',
      author: 'Template Author',
      repository: { url: 'https://github.com/swapstack/swapstack' },
      scripts: {
        'check-all': 'pnpm run lint && pnpm run type-check && pnpm run test && npx tsx scripts/test-cli.ts',
      },
    }, null, 2);
    const readmeContent = `# Swapstack\n\nSwapstack boilerplate.\n`;
    const workspaceContent = `shellEmulator: true\npackages:\n  - .\n`;

    writeFileSync(path.join(tempDir, 'env.ts'), envTsContent);
    writeFileSync(path.join(tempDir, '.env.example'), envExampleContent);
    writeFileSync(path.join(tempDir, 'package.json'), packageJsonContent);
    writeFileSync(path.join(tempDir, 'README.md'), readmeContent);
    writeFileSync(path.join(tempDir, 'DESIGN.md'), '# Swapstack\n\nSwapstack design tokens.');
    writeFileSync(path.join(tempDir, 'AGENTS.md'), '# AGENTS.md — AI Coding Agent Instructions for Swapstack\n');
    writeFileSync(path.join(tempDir, 'pnpm-workspace.yaml'), workspaceContent);
    writeFileSync(path.join(tempDir, 'PRODUCT.md'), 'Swapstack product context');
    mkdirSync(path.join(tempDir, '.impeccable'));
    writeFileSync(path.join(tempDir, '.impeccable', 'direction.md'), 'Swapstack direction');
    mkdirSync(path.join(tempDir, 'scripts'), { recursive: true });
    writeFileSync(path.join(tempDir, 'scripts/test-cli.ts'), 'export {};\n');
    mkdirSync(path.join(tempDir, 'site'), { recursive: true });
    writeFileSync(path.join(tempDir, 'site/index.html'), '<html></html>\n');
    mkdirSync(path.join(tempDir, '.github/workflows'), { recursive: true });
    writeFileSync(path.join(tempDir, '.github/workflows/pages.yml'), 'name: Pages\n');
    mkdirSync(path.join(tempDir, 'src/lib/auth'), { recursive: true });
    mkdirSync(path.join(tempDir, 'src/core/mocks'), { recursive: true });
    writeFileSync(path.join(tempDir, 'src/lib/auth/storage.ts'), 'export const key = \u0027swapstack.auth.session\u0027;');
    writeFileSync(path.join(tempDir, 'src/lib/auth/supabase-storage.ts'), 'export const prefix = \u0027swapstack.supabase\u0027;');
    writeFileSync(path.join(tempDir, 'src/core/mocks/auth.ts'), 'export const email = \u0027mock_google_user@swapstack.org\u0027;');

    await renameAppFiles(tempDir, {
      name: 'Save $100 App',
      iosBundleId: 'com.finance.save100',
      androidPackage: 'com.finance.save100',
    });

    // Verify env.ts preserved $100 without regex corruption
    const updatedEnvTs = readFileSync(path.join(tempDir, 'env.ts'), 'utf8');
    assert.match(updatedEnvTs, /APP_NAME:\s*'Save \$100 App'/);
    assert.match(updatedEnvTs, /IOS_BUNDLE_ID:\s*'com\.finance\.save100'/);

    // Verify .env.example kept provider variables and escaped $ in dotenv
    const updatedEnvExample = readFileSync(path.join(tempDir, '.env.example'), 'utf8');
    assert.match(updatedEnvExample, /APP_NAME="Save \\\$100 App"/);
    assert.match(updatedEnvExample, /EXPO_PUBLIC_AUTH_PROVIDER=mock/);

    // Verify .env matches .env.example
    const createdEnv = readFileSync(path.join(tempDir, '.env'), 'utf8');
    assert.equal(createdEnv, updatedEnvExample);

    // Verify README.md preserved $100 title
    const updatedReadme = readFileSync(path.join(tempDir, 'README.md'), 'utf8');
    assert.match(updatedReadme, /^# Save \$100 App/);
    assert.doesNotMatch(updatedReadme, /Swapstack|Do not reuse/);
    assert.doesNotMatch(readFileSync(path.join(tempDir, 'DESIGN.md'), 'utf8'), /Swapstack/);
    assert.match(readFileSync(path.join(tempDir, 'AGENTS.md'), 'utf8'), /Save \$100 App/);
    const updatedPackage = JSON.parse(readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
    assert.equal(updatedPackage.author, undefined);
    assert.equal(updatedPackage.repository, undefined);
    assert.equal(updatedPackage.scripts['check-all'], 'pnpm run lint && pnpm run type-check && pnpm run test');
    assert.equal(existsSync(path.join(tempDir, 'scripts/test-cli.ts')), false);
    assert.match(readFileSync(path.join(tempDir, 'src/lib/auth/storage.ts'), 'utf8'), /save-100-app\.auth\.session/);
    assert.match(readFileSync(path.join(tempDir, 'src/lib/auth/supabase-storage.ts'), 'utf8'), /save-100-app\.supabase/);
    assert.match(readFileSync(path.join(tempDir, 'src/core/mocks/auth.ts'), 'utf8'), /mock_google_user@save-100-app\.example/);
    assert.equal(existsSync(path.join(tempDir, 'PRODUCT.md')), false);
    assert.equal(existsSync(path.join(tempDir, '.impeccable')), false);
    assert.equal(existsSync(path.join(tempDir, 'site')), false);
    assert.equal(existsSync(path.join(tempDir, '.github/workflows/pages.yml')), false);
  });

  it('applies --theme and --style presets to src/global.css and UI components', async () => {
    mkdirSync(path.join(tempDir, 'src/components/ui'), { recursive: true });
    writeFileSync(
      path.join(tempDir, 'src/global.css'),
      `@theme {\n  --color-background: #ffffff;\n  --color-foreground: #0a0a0a;\n  --color-card: #ffffff;\n  --color-card-foreground: #0a0a0a;\n  --color-muted: #f5f5f5;\n  --color-muted-foreground: #737373;\n  --color-border: #e5e5e5;\n  --color-input: #e5e5e5;\n  --color-ring: #171717;\n}\n@layer theme {\n  :root {\n    @variant light {\n      --color-background: #ffffff;\n      --color-foreground: #0a0a0a;\n      --color-card: #ffffff;\n      --color-card-foreground: #0a0a0a;\n      --color-muted: #f5f5f5;\n      --color-muted-foreground: #737373;\n      --color-border: #e5e5e5;\n      --color-input: #e5e5e5;\n      --color-ring: #171717;\n      --color-destructive: #ef4444;\n      --color-destructive-foreground: #ffffff;\n    }\n  }\n}\n`,
    );
    writeFileSync(
      path.join(tempDir, 'src/components/ui/colors.js'),
      `module.exports = {\n  border: {\n    light: '#E5E5E5',\n    dark: '#2E2E2E',\n  },\n  card: {\n    light: '#FFFFFF',\n    dark: '#141414',\n  },\n  muted: {\n    light: '#F5F5F5',\n    dark: '#262626',\n  },\n};\n`,
    );
    writeFileSync(
      path.join(tempDir, 'src/components/ui/card.tsx'),
      `const c = 'rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900';\n`,
    );
    writeFileSync(
      path.join(tempDir, 'src/components/ui/button.tsx'),
      `const b = { container: 'my-2 flex flex-row items-center justify-center rounded-md px-4' };\n`,
    );
    writeFileSync(
      path.join(tempDir, 'src/components/ui/input.tsx'),
      `const i = 'mt-0 rounded-xl border-[0.5px] border-neutral-300 bg-neutral-100 px-4 py-3 font-medium text-base/5 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white';\n`,
    );

    await renameAppFiles(tempDir, {
      name: 'Pulse App',
      iosBundleId: 'com.acme.pulse',
      androidPackage: 'com.acme.pulse',
      theme: 'matcha',
      style: 'soft',
    });

    const updatedCss = readFileSync(path.join(tempDir, 'src/global.css'), 'utf8');
    assert.match(updatedCss, /--color-background: #f7faf6;/);
    assert.match(updatedCss, /--color-ring: #143d29;/);

    const updatedColors = readFileSync(path.join(tempDir, 'src/components/ui/colors.js'), 'utf8');
    assert.match(updatedColors, /light: '#CFE0CB'/);
    assert.match(updatedColors, /light: '#E6EFE3'/);

    const updatedCard = readFileSync(path.join(tempDir, 'src/components/ui/card.tsx'), 'utf8');
    assert.match(updatedCard, /rounded-3xl/);

    const updatedButton = readFileSync(path.join(tempDir, 'src/components/ui/button.tsx'), 'utf8');
    assert.match(updatedButton, /rounded-full/);

    const updatedInput = readFileSync(path.join(tempDir, 'src/components/ui/input.tsx'), 'utf8');
    assert.match(updatedInput, /rounded-full/);
  });

  it('writes selected --auth, --data, and --billing providers into .env and .env.example', async () => {
    writeFileSync(
      path.join(tempDir, '.env.example'),
      `APP_NAME=Swapstack\nAPP_SLUG=swapstack\nAPP_SCHEME=swapstack\nIOS_BUNDLE_ID=com.swapstack.app\nANDROID_PACKAGE=com.swapstack.app\nEXPO_PUBLIC_AUTH_PROVIDER=mock\nEXPO_PUBLIC_DATA_PROVIDER=mock\nEXPO_PUBLIC_BILLING_PROVIDER=mock\n`,
    );

    await renameAppFiles(tempDir, {
      name: 'Studio App',
      iosBundleId: 'com.acme.studio',
      androidPackage: 'com.acme.studio',
      authProvider: 'clerk',
      dataProvider: 'firebase',
      billingProvider: 'revenuecat',
    });

    const envOut = readFileSync(path.join(tempDir, '.env'), 'utf8');
    assert.match(envOut, /EXPO_PUBLIC_AUTH_PROVIDER=clerk/);
    assert.match(envOut, /EXPO_PUBLIC_DATA_PROVIDER=firebase/);
    assert.match(envOut, /EXPO_PUBLIC_BILLING_PROVIDER=revenuecat/);
  });

  it('validates Studio requests and generates CLI commands and HTML', () => {
    const valid = validateStudioRequest({
      targetDir: 'my-studio-app',
      name: 'My Studio App',
      bundleId: 'com.acme.studio',
      theme: 'cobalt',
      style: 'editorial',
      authProvider: 'supabase',
      dataProvider: 'supabase',
      billingProvider: 'revenuecat',
      install: true,
      git: true,
    });
    assert.equal(valid.ok, true);
    assert.ok(valid.data);

    const cmd = buildCliCommandFromStudio(valid.data);
    assert.match(cmd, /npx create-swapstack-app my-studio-app/);
    assert.match(cmd, /--theme cobalt/);
    assert.match(cmd, /--style editorial/);
    assert.match(cmd, /--auth supabase/);
    assert.match(cmd, /--data supabase/);
    assert.match(cmd, /--billing revenuecat/);

    const html = buildStudioHtml({ name: 'Custom Studio' });
    assert.match(html, /Swapstack Setup Studio/);
    assert.match(html, /Custom Studio/);
  });
});

import { existsSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type RenameOptions = {
  name: string;
  iosBundleId: string;
  androidPackage: string;
};

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function validateAppName(name?: string): name is string {
  return Boolean(name && slugify(name).length > 0);
}

export function validateBundleId(bundleId?: string): bundleId is string {
  return Boolean(bundleId && /^[a-z]\w*(\.\w+)+$/i.test(bundleId));
}

const identityKeys = [
  'APP_NAME',
  'APP_SLUG',
  'APP_SCHEME',
  'IOS_BUNDLE_ID',
  'ANDROID_PACKAGE',
] as const;

export async function renameAppFiles(
  targetDir: string,
  options: RenameOptions,
): Promise<void> {
  const { name, iosBundleId, androidPackage } = options;
  const slug = slugify(name);

  const identity = {
    APP_NAME: name,
    APP_SLUG: slug,
    APP_SCHEME: slug,
    IOS_BUNDLE_ID: iosBundleId,
    ANDROID_PACKAGE: androidPackage,
  };

  // 1. Update env.ts
  const envPath = path.join(targetDir, 'env.ts');
  if (existsSync(envPath)) {
    const envSource = await readFile(envPath, 'utf8');
    const defaults = `const DEFAULT_APP_IDENTITY = {\n${identityKeys
      .map(key => `  ${key}: '${identity[key].replaceAll(/'/g, String.raw`\'`)}',`)
      .join('\n')}\n} as const;`;

    if (/const DEFAULT_APP_IDENTITY = \{[\s\S]*?\} as const;/.test(envSource)) {
      await writeFile(
        envPath,
        envSource.replace(/const DEFAULT_APP_IDENTITY = \{[\s\S]*?\} as const;/, defaults),
        'utf8',
      );
    }
  }

  // 2. Update .env.example
  const examplePath = path.join(targetDir, '.env.example');
  let exampleContent = '';
  if (existsSync(examplePath)) {
    exampleContent = await readFile(examplePath, 'utf8');
    for (const key of identityKeys) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(exampleContent)) {
        exampleContent = exampleContent.replace(regex, `${key}=${identity[key]}`);
      }
    }
    await writeFile(examplePath, exampleContent, 'utf8');
  }

  // 3. Write .env from .env.example
  const localEnvPath = path.join(targetDir, '.env');
  if (exampleContent) {
    await writeFile(localEnvPath, exampleContent, 'utf8');
  }

  // 4. Update package.json name
  const packagePath = path.join(targetDir, 'package.json');
  if (existsSync(packagePath)) {
    const pkg = JSON.parse(await readFile(packagePath, 'utf8')) as Record<string, unknown>;
    pkg.name = slug;
    await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
  }

  // 5. Update README.md title
  const readmePath = path.join(targetDir, 'README.md');
  if (existsSync(readmePath)) {
    const readme = await readFile(readmePath, 'utf8');
    const updated = readme.replace(/^# .*$/m, `# ${name}`);
    await writeFile(readmePath, updated, 'utf8');
  }

  // 6. Clean up internal template artifacts if present in downloaded template
  const packagesDir = path.join(targetDir, 'packages');
  if (existsSync(packagesDir)) {
    await rm(packagesDir, { recursive: true, force: true });
  }

  const workspaceFile = path.join(targetDir, 'pnpm-workspace.yaml');
  if (existsSync(workspaceFile)) {
    await rm(workspaceFile, { force: true });
  }

  const gitDir = path.join(targetDir, '.git');
  if (existsSync(gitDir)) {
    await rm(gitDir, { recursive: true, force: true });
  }
}

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

export const JAVA_KOTLIN_RESERVED_WORDS: ReadonlySet<string> = new Set([
  'abstract',
  'assert',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'default',
  'do',
  'double',
  'else',
  'enum',
  'extends',
  'final',
  'finally',
  'float',
  'for',
  'goto',
  'if',
  'implements',
  'import',
  'instanceof',
  'int',
  'interface',
  'long',
  'native',
  'new',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'strictfp',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'try',
  'void',
  'volatile',
  'while',
  'true',
  'false',
  'null',
  'as',
  'fun',
  'in',
  'is',
  'object',
  'typealias',
  'val',
  'var',
  'when',
  'by',
  'constructor',
  'delegate',
  'dynamic',
  'field',
  'file',
  'init',
  'param',
  'property',
  'receiver',
  'setparam',
  'where',
  'actual',
  'expect',
  'sealed',
  'annotation',
  'data',
  'inner',
  'value',
  'override',
  'open',
  'operator',
  'inline',
  'infix',
  'external',
  'tailrec',
  'suspend',
]);

export function validateIosBundleId(bundleId?: string): bundleId is string {
  if (!bundleId) {
    return false;
  }
  const segments = bundleId.split('.');
  if (segments.length < 2) {
    return false;
  }
  return segments.every(segment => segment.length > 0 && /^[a-z0-9-]+$/i.test(segment));
}

export function validateAndroidPackage(packageName?: string): packageName is string {
  if (!packageName) {
    return false;
  }
  const segments = packageName.split('.');
  if (segments.length < 2) {
    return false;
  }
  return segments.every((segment) => {
    if (!/^[a-z_]\w*$/i.test(segment)) {
      return false;
    }
    return !JAVA_KOTLIN_RESERVED_WORDS.has(segment.toLowerCase());
  });
}

export function validateUrlScheme(scheme?: string): scheme is string {
  if (!scheme) {
    return false;
  }
  return /^[a-z][\w+.-]*$/i.test(scheme);
}

export function validateAppName(name?: string): name is string {
  return Boolean(name && slugify(name).length > 0);
}

export function validateBundleId(bundleId?: string): bundleId is string {
  return validateIosBundleId(bundleId) && validateAndroidPackage(bundleId);
}

export function escapeDotenvValue(value: string): string {
  if (/[ \t\n\r"'#\\$]/.test(value)) {
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\$/g, '\\$');
    return `"${escaped}"`;
  }
  return value;
}

export function escapeTsStringLiteral(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

const identityKeys = [
  'APP_NAME',
  'APP_SLUG',
  'APP_SCHEME',
  'IOS_BUNDLE_ID',
  'ANDROID_PACKAGE',
] as const;

export type IdentityKey = typeof identityKeys[number];

export function updateEnvContent(
  source: string,
  identity: Record<IdentityKey, string>,
): string {
  const values: Partial<Record<IdentityKey, string>> = { ...identity };
  const lines = source.split('\n').map((line) => {
    const key = identityKeys.find(candidate => line.startsWith(`${candidate}=`));
    if (!key) {
      return line;
    }
    const val = values[key];
    delete values[key];
    return `${key}=${escapeDotenvValue(val ?? '')}`;
  });

  for (const key of identityKeys) {
    if (values[key] !== undefined) {
      lines.push(`${key}=${escapeDotenvValue(values[key]!)}`);
    }
  }

  return lines.join('\n');
}

export function removePackagesFromWorkspaceYaml(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inPackages = false;

  for (const line of lines) {
    if (/^packages:\s*$/.test(line.trim())) {
      inPackages = true;
      continue;
    }
    if (inPackages) {
      if (/^\s*-\s+/.test(line) || /^\s*$/.test(line)) {
        continue;
      }
      inPackages = false;
    }
    result.push(line);
  }

  const cleaned = result.join('\n').trim();
  return cleaned ? `${cleaned}\n` : '';
}

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
      .map(key => `  ${key}: '${escapeTsStringLiteral(identity[key])}',`)
      .join('\n')}\n} as const;`;

    if (/const DEFAULT_APP_IDENTITY = \{[\s\S]*?\} as const;/.test(envSource)) {
      await writeFile(
        envPath,
        envSource.replace(/const DEFAULT_APP_IDENTITY = \{[\s\S]*?\} as const;/, () => defaults),
        'utf8',
      );
    }
  }

  // 2. Update .env.example
  const examplePath = path.join(targetDir, '.env.example');
  let exampleContent = '';
  if (existsSync(examplePath)) {
    exampleContent = await readFile(examplePath, 'utf8');
    exampleContent = updateEnvContent(exampleContent, identity);
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
    const updated = readme.replace(/^# .*$/m, () => `# ${name}`);
    await writeFile(readmePath, updated, 'utf8');
  }

  // 6. Clean up internal template artifacts if present in downloaded template
  const packagesDir = path.join(targetDir, 'packages');
  if (existsSync(packagesDir)) {
    await rm(packagesDir, { recursive: true, force: true });
  }

  const workspaceFile = path.join(targetDir, 'pnpm-workspace.yaml');
  if (existsSync(workspaceFile)) {
    const workspaceContent = await readFile(workspaceFile, 'utf8');
    const updatedWorkspace = removePackagesFromWorkspaceYaml(workspaceContent);
    await writeFile(workspaceFile, updatedWorkspace, 'utf8');
  }

  const gitDir = path.join(targetDir, '.git');
  if (existsSync(gitDir)) {
    await rm(gitDir, { recursive: true, force: true });
  }
}

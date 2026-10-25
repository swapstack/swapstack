import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline';

const root = process.cwd();
const identityKeys = [
  'APP_NAME',
  'APP_SLUG',
  'APP_SCHEME',
  'IOS_BUNDLE_ID',
  'ANDROID_PACKAGE',
] as const;

type IdentityKey = typeof identityKeys[number];
type Identity = Record<IdentityKey, string>;

const JAVA_KOTLIN_RESERVED_WORDS: ReadonlySet<string> = new Set([
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

function validateIosBundleId(bundleId?: string): bundleId is string {
  if (!bundleId) {
    return false;
  }
  const segments = bundleId.split('.');
  if (segments.length < 2) {
    return false;
  }
  return segments.every(segment => segment.length > 0 && /^[a-z0-9-]+$/i.test(segment));
}

function validateAndroidPackage(packageName?: string): packageName is string {
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

function validateUrlScheme(scheme?: string): scheme is string {
  if (!scheme) {
    return false;
  }
  return /^[a-z][\w+.-]*$/i.test(scheme);
}

function escapeDotenvValue(value: string): string {
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

function escapeTsStringLiteral(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseEnv(source: string) {
  return Object.fromEntries(
    source
      .split('\n')
      .filter(line => /^[A-Z][A-Z0-9_]*=/.test(line))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  ) as Partial<Identity>;
}

function updateEnvInPlace(source: string, identity: Identity) {
  const values: Partial<Identity> = { ...identity };
  const lines = source.split('\n').map((line) => {
    const key = identityKeys.find(candidate => line.startsWith(`${candidate}=`));
    if (!key) {
      return line;
    }
    const value = values[key];
    delete values[key];
    return `${key}=${escapeDotenvValue(value ?? '')}`;
  });

  for (const key of identityKeys) {
    if (values[key] !== undefined) {
      lines.push(`${key}=${escapeDotenvValue(values[key]!)}`);
    }
  }
  return lines.join('\n');
}

async function renameApp() {
  const examplePath = path.join(root, '.env.example');
  const exampleSource = await readFile(examplePath, 'utf8');
  const current = parseEnv(exampleSource);
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const lines = rl[Symbol.asyncIterator]();
  const ask = async (question: string, fallback?: string) => {
    process.stdout.write(question);
    const { done, value } = await lines.next();
    if (done) {
      throw new Error('Input ended before the rename was complete.');
    }
    return value.trim() || fallback;
  };

  try {
    const name = await ask(`App name (${current.APP_NAME ?? 'Swapstack'}): `, current.APP_NAME);
    const existingBundleId = current.IOS_BUNDLE_ID && !current.IOS_BUNDLE_ID.startsWith('com.swapstack.')
      ? current.IOS_BUNDLE_ID
      : undefined;
    const bundlePrompt = existingBundleId
      ? `Bundle ID (${existingBundleId}): `
      : 'Bundle ID (e.g. com.example.app): ';
    const bundleId = await ask(bundlePrompt, existingBundleId);

    if (!name || !slugify(name)) {
      throw new Error('App name must contain at least one letter or number.');
    }
    if (!bundleId) {
      throw new Error('Bundle ID is required.');
    }
    if (!validateIosBundleId(bundleId)) {
      throw new Error('iOS bundle ID must contain only letters, digits, hyphens, and dots (e.g. com.example.app).');
    }
    if (!validateAndroidPackage(bundleId)) {
      throw new Error('Android package cannot have digit-leading segments, hyphens, or Java/Kotlin reserved words.');
    }

    const slug = slugify(name);
    if (!validateUrlScheme(slug)) {
      throw new Error('URL scheme must start with a letter.');
    }

    const identity: Identity = {
      APP_NAME: name,
      APP_SLUG: slug,
      APP_SCHEME: slug,
      IOS_BUNDLE_ID: bundleId,
      ANDROID_PACKAGE: bundleId,
    };
    const envPath = path.join(root, 'env.ts');
    const envSource = await readFile(envPath, 'utf8');
    const defaults = `const DEFAULT_APP_IDENTITY = {\n${identityKeys
      .map(key => `  ${key}: '${escapeTsStringLiteral(identity[key])}',`)
      .join('\n')}\n} as const;`;

    if (!/const DEFAULT_APP_IDENTITY = \{[\s\S]*?\} as const;/.test(envSource)) {
      throw new Error('Could not find the app identity defaults in env.ts.');
    }

    const packagePath = path.join(root, 'package.json');
    const packageJson = JSON.parse(await readFile(packagePath, 'utf8')) as { name: string };
    packageJson.name = slug;

    const readmePath = path.join(root, 'README.md');
    const readme = await readFile(readmePath, 'utf8');
    const updatedReadme = readme.replace(/^# .*$/m, () => `# ${name}`);
    if (updatedReadme === readme) {
      throw new Error('Could not find the README title.');
    }

    await Promise.all([
      writeFile(
        envPath,
        envSource.replace(/const DEFAULT_APP_IDENTITY = \{[\s\S]*?\} as const;/, () => defaults),
      ),
      writeFile(examplePath, updateEnvInPlace(exampleSource, identity)),
      writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`),
      writeFile(readmePath, updatedReadme),
    ]);

    const localEnvPath = path.join(root, '.env');
    if (existsSync(localEnvPath)) {
      const localEnv = await readFile(localEnvPath, 'utf8');
      await writeFile(localEnvPath, updateEnvInPlace(localEnv, identity));
    }

    console.log(`Renamed app to ${name} (${bundleId}).`);
    console.log('Restart Expo and regenerate native projects if you have already run prebuild.');
  }
  finally {
    rl.close();
  }
}

renameApp().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

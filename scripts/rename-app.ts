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

function exampleFile(identity: Identity) {
  return `# Display name shown on a user's device.
APP_NAME=${identity.APP_NAME}
# Expo project slug.
APP_SLUG=${identity.APP_SLUG}
# Deep-link URL scheme.
APP_SCHEME=${identity.APP_SCHEME}
# Unique Apple bundle identifier.
IOS_BUNDLE_ID=${identity.IOS_BUNDLE_ID}
# Unique Android application ID.
ANDROID_PACKAGE=${identity.ANDROID_PACKAGE}
`;
}

function updateLocalEnv(source: string, identity: Identity) {
  const values: Partial<Identity> = { ...identity };
  const lines = source.split('\n').map((line) => {
    const key = identityKeys.find(candidate => line.startsWith(`${candidate}=`));
    if (!key) {
      return line;
    }
    const value = values[key];
    delete values[key];
    return `${key}=${value}`;
  });

  for (const key of identityKeys) {
    if (values[key] !== undefined) {
      lines.push(`${key}=${values[key]}`);
    }
  }
  return lines.join('\n');
}

async function renameApp() {
  const examplePath = path.join(root, '.env.example');
  const current = parseEnv(await readFile(examplePath, 'utf8'));
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
    const bundleId = await ask(`Bundle ID (${current.IOS_BUNDLE_ID ?? 'com.swapstack.app'}): `, current.IOS_BUNDLE_ID);

    if (!name || !slugify(name)) {
      throw new Error('App name must contain at least one letter or number.');
    }
    if (!bundleId || !/^[a-z]\w*(\.\w+)+$/i.test(bundleId)) {
      throw new Error('Bundle ID must be a reverse-domain identifier, such as com.example.app.');
    }

    const slug = slugify(name);
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
      .map(key => `  ${key}: '${identity[key].replaceAll(/'/g, String.raw`\'`)}',`)
      .join('\n')}\n} as const;`;

    if (!/const DEFAULT_APP_IDENTITY = \{[\s\S]*?\} as const;/.test(envSource)) {
      throw new Error('Could not find the app identity defaults in env.ts.');
    }

    const packagePath = path.join(root, 'package.json');
    const packageJson = JSON.parse(await readFile(packagePath, 'utf8')) as { name: string };
    packageJson.name = slug;

    const readmePath = path.join(root, 'README.md');
    const readme = await readFile(readmePath, 'utf8');
    const updatedReadme = readme.replace(/^# .*$/m, `# ${name}`);
    if (updatedReadme === readme) {
      throw new Error('Could not find the README title.');
    }

    await Promise.all([
      writeFile(envPath, envSource.replace(/const DEFAULT_APP_IDENTITY = \{[\s\S]*?\} as const;/, defaults)),
      writeFile(examplePath, exampleFile(identity)),
      writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`),
      writeFile(readmePath, updatedReadme),
    ]);

    const localEnvPath = path.join(root, '.env');
    if (existsSync(localEnvPath)) {
      const localEnv = await readFile(localEnvPath, 'utf8');
      await writeFile(localEnvPath, updateLocalEnv(localEnv, identity));
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

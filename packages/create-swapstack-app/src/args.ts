export type ParsedArgs = {
  targetDir?: string;
  name?: string;
  iosBundleId?: string;
  androidPackage?: string;
  install: boolean;
  git: boolean;
  yes: boolean;
  help: boolean;
  version: boolean;
};

function getOptionValue(
  args: string[],
  index: number,
  flag: string,
): { value: string; nextIndex: number } {
  const arg = args[index];
  const eqIndex = arg.indexOf('=');

  if (eqIndex !== -1) {
    const val = arg.slice(eqIndex + 1);
    if (!val) {
      throw new Error(`Missing value for flag: ${arg.slice(0, eqIndex)}`);
    }
    return { value: val, nextIndex: index };
  }

  if (index + 1 >= args.length || args[index + 1].startsWith('-')) {
    throw new Error(`Missing value for flag: ${flag}`);
  }

  return { value: args[index + 1], nextIndex: index + 1 };
}

export function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    install: true,
    git: true,
    yes: false,
    help: false,
    version: false,
  };

  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    }
    else if (arg === '--version' || arg === '-v') {
      parsed.version = true;
    }
    else if (arg === '--yes' || arg === '-y') {
      parsed.yes = true;
    }
    else if (arg === '--no-install') {
      parsed.install = false;
    }
    else if (arg === '--install') {
      parsed.install = true;
    }
    else if (arg === '--no-git') {
      parsed.git = false;
    }
    else if (arg === '--git') {
      parsed.git = true;
    }
    else if (arg === '--name' || arg.startsWith('--name=')) {
      const res = getOptionValue(args, i, arg);
      parsed.name = res.value;
      i = res.nextIndex;
    }
    else if (
      arg === '--bundle-id'
      || arg === '--bundleId'
      || arg.startsWith('--bundle-id=')
      || arg.startsWith('--bundleId=')
    ) {
      const res = getOptionValue(args, i, arg);
      parsed.iosBundleId = res.value;
      parsed.androidPackage = res.value;
      i = res.nextIndex;
    }
    else if (
      arg === '--ios-bundle-id'
      || arg === '--iosBundleId'
      || arg.startsWith('--ios-bundle-id=')
      || arg.startsWith('--iosBundleId=')
    ) {
      const res = getOptionValue(args, i, arg);
      parsed.iosBundleId = res.value;
      i = res.nextIndex;
    }
    else if (
      arg === '--android-package'
      || arg === '--androidPackage'
      || arg.startsWith('--android-package=')
      || arg.startsWith('--androidPackage=')
    ) {
      const res = getOptionValue(args, i, arg);
      parsed.androidPackage = res.value;
      i = res.nextIndex;
    }
    else if (arg.startsWith('-')) {
      throw new Error(`Unknown flag: ${arg}`);
    }
    else {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    parsed.targetDir = positional[0];
  }

  return parsed;
}

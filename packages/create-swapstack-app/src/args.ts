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
    else if (arg === '--name' && i + 1 < args.length) {
      parsed.name = args[++i];
    }
    else if (arg.startsWith('--name=')) {
      parsed.name = arg.slice(7);
    }
    else if ((arg === '--bundle-id' || arg === '--bundleId') && i + 1 < args.length) {
      const val = args[++i];
      parsed.iosBundleId = val;
      parsed.androidPackage = val;
    }
    else if (arg.startsWith('--bundle-id=')) {
      const val = arg.slice(12);
      parsed.iosBundleId = val;
      parsed.androidPackage = val;
    }
    else if (arg.startsWith('--bundleId=')) {
      const val = arg.slice(11);
      parsed.iosBundleId = val;
      parsed.androidPackage = val;
    }
    else if ((arg === '--ios-bundle-id' || arg === '--iosBundleId') && i + 1 < args.length) {
      parsed.iosBundleId = args[++i];
    }
    else if (arg.startsWith('--ios-bundle-id=')) {
      parsed.iosBundleId = arg.slice(16);
    }
    else if (arg.startsWith('--iosBundleId=')) {
      parsed.iosBundleId = arg.slice(14);
    }
    else if ((arg === '--android-package' || arg === '--androidPackage') && i + 1 < args.length) {
      parsed.androidPackage = args[++i];
    }
    else if (arg.startsWith('--android-package=')) {
      parsed.androidPackage = arg.slice(18);
    }
    else if (arg.startsWith('--androidPackage=')) {
      parsed.androidPackage = arg.slice(17);
    }
    else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  if (positional.length > 0) {
    parsed.targetDir = positional[0];
  }

  return parsed;
}

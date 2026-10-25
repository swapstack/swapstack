# create-swapstack-app

Quickly scaffold a new [Swapstack](https://github.com/swapstack/swapstack) mobile application from your terminal.

## Quick Start

```sh
npx create-swapstack-app my-app
```

This command will:
1. Download the latest Swapstack boilerplate from the `main` branch.
2. Prompt for your app's display name and bundle identifiers (or accept CLI flags).
3. Configure `env.ts`, `.env.example`, `.env`, and `package.json` with your chosen app identity.
4. Clean up template-internal metadata and initialize a fresh git repository.
5. Install dependencies via `pnpm` (optional).

## Usage & Options

```sh
npx create-swapstack-app <project-directory> [options]
```

### Options

| Flag | Description |
| --- | --- |
| `--name <name>` | Application display name (e.g. `"My App"`) |
| `--bundle-id <id>` | Reverse-domain bundle ID for both iOS & Android (e.g. `com.example.myapp`) |
| `--ios-bundle-id <id>` | Specific Apple bundle identifier |
| `--android-package <id>` | Specific Android application ID |
| `--no-install` | Skip running `pnpm install` |
| `--no-git` | Skip running `git init` |
| `--yes`, `-y` | Accept all defaults without interactive prompts |
| `-h`, `--help` | Display help information |
| `-v`, `--version` | Display package version |

### Non-Interactive Example

```sh
npx create-swapstack-app my-app --name "My App" --bundle-id com.example.myapp --yes
```

## Next Steps

Once the app is generated:

```sh
cd my-app
pnpm start
```

## License

[MIT](LICENSE) © Abdullah Ahsan

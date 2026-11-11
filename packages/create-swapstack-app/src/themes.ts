import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const THEME_PRESETS = [
  'matcha',
  'terracotta',
  'cobalt',
  'sakura',
  'espresso',
  'light',
  'dark',
] as const;

export type ThemePreset = typeof THEME_PRESETS[number];

export const STYLE_PRESETS = [
  'minimal',
  'soft',
  'editorial',
  'brutalist',
  'terminal',
] as const;

export type StylePreset = typeof STYLE_PRESETS[number];

export type ThemeTokens = {
  label: string;
  background: string;
  foreground: string;
  card: string;
  muted: string;
  mutedForeground: string;
  border: string;
  primary: string;
};

export const THEME_TOKEN_MAP: Record<ThemePreset, ThemeTokens> = {
  matcha: {
    label: 'Matcha & Sage',
    background: '#f7faf6',
    foreground: '#0f2419',
    card: '#ffffff',
    muted: '#e6efe3',
    mutedForeground: '#3f5e4d',
    border: '#cfe0cb',
    primary: '#143d29',
  },
  terracotta: {
    label: 'Warm Paper & Terracotta',
    background: '#fbf8f3',
    foreground: '#241710',
    card: '#fffdf9',
    muted: '#efe7da',
    mutedForeground: '#695244',
    border: '#dfd3c0',
    primary: '#b84a27',
  },
  cobalt: {
    label: 'Nordic Sky & Cobalt',
    background: '#f6f9fc',
    foreground: '#0c192c',
    card: '#ffffff',
    muted: '#e5eef8',
    mutedForeground: '#3b526e',
    border: '#cbdcf0',
    primary: '#1d4ed8',
  },
  sakura: {
    label: 'Sakura & Rose Ink',
    background: '#fdf8f9',
    foreground: '#291019',
    card: '#ffffff',
    muted: '#f4e4e9',
    mutedForeground: '#6e4453',
    border: '#e8cdd6',
    primary: '#9d174d',
  },
  espresso: {
    label: 'Solar & Espresso',
    background: '#fdfbf6',
    foreground: '#21170e',
    card: '#ffffff',
    muted: '#efe8d8',
    mutedForeground: '#63513f',
    border: '#dfd4bc',
    primary: '#362214',
  },
  light: {
    label: 'Crisp Neutral Light',
    background: '#ffffff',
    foreground: '#0a0a0a',
    card: '#ffffff',
    muted: '#f5f5f5',
    mutedForeground: '#737373',
    border: '#e5e5e5',
    primary: '#171717',
  },
  dark: {
    label: 'Obsidian Dark',
    background: '#0a0a0a',
    foreground: '#fafafa',
    card: '#141414',
    muted: '#262626',
    mutedForeground: '#a3a3a3',
    border: '#2e2e2e',
    primary: '#fafafa',
  },
};

export type StyleTokens = {
  label: string;
  cardClass: string;
  buttonContainerClass: string;
  inputClass: string;
};

export const STYLE_TOKEN_MAP: Record<StylePreset, StyleTokens> = {
  minimal: {
    label: 'Swiss Minimal',
    cardClass: 'rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900',
    buttonContainerClass: 'my-2 flex flex-row items-center justify-center rounded-md px-4',
    inputClass:
      'mt-0 rounded-xl border-[0.5px] border-neutral-300 bg-neutral-100 px-4 py-3 font-medium text-base/5 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white',
  },
  soft: {
    label: 'Soft Pill & Tactile',
    cardClass: 'rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
    buttonContainerClass: 'my-2 flex flex-row items-center justify-center rounded-full px-6',
    inputClass:
      'mt-0 rounded-full border-[0.5px] border-neutral-300 bg-neutral-100 px-5 py-3 font-medium text-base/5 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white',
  },
  editorial: {
    label: 'Editorial Serif',
    cardClass: 'rounded-none border-t-2 border-neutral-900 border-b border-neutral-200 bg-transparent py-4 px-1 dark:border-t-neutral-50 dark:border-b-neutral-800',
    buttonContainerClass: 'my-2 flex flex-row items-center justify-center rounded-sm px-5 tracking-wide',
    inputClass:
      'mt-0 rounded-sm border border-neutral-300 bg-neutral-100 px-4 py-3 font-medium text-base/5 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white',
  },
  brutalist: {
    label: 'Neo-Brutalist',
    cardClass: 'rounded-md border-2 border-neutral-900 bg-white p-4 dark:border-neutral-50 dark:bg-neutral-900',
    buttonContainerClass: 'my-2 flex flex-row items-center justify-center rounded-md border-2 border-neutral-900 px-5 dark:border-neutral-50',
    inputClass:
      'mt-0 rounded-md border-2 border-neutral-900 bg-white px-4 py-3 font-semibold text-base/5 dark:border-neutral-50 dark:bg-neutral-900 dark:text-white',
  },
  terminal: {
    label: 'Technical Mono',
    cardClass: 'rounded-none border border-dashed border-neutral-500 bg-white p-3.5 dark:border-neutral-500 dark:bg-neutral-900',
    buttonContainerClass: 'my-2 flex flex-row items-center justify-center rounded-none px-4 tracking-wider',
    inputClass:
      'mt-0 rounded-none border border-neutral-500 bg-neutral-100 px-3.5 py-3 font-medium text-base/5 dark:border-neutral-500 dark:bg-neutral-800 dark:text-white',
  },
};

export function validateThemePreset(value?: string): value is ThemePreset {
  return Boolean(value && (THEME_PRESETS as readonly string[]).includes(value));
}

export function validateStylePreset(value?: string): value is StylePreset {
  return Boolean(value && (STYLE_PRESETS as readonly string[]).includes(value));
}

export function updateGlobalCssTokens(source: string, theme: ThemePreset): string {
  const t = THEME_TOKEN_MAP[theme];
  const lightBlock = `    @variant light {
      --color-primary: ${t.primary};
      --color-primary-foreground: #ffffff;
      --color-background: ${t.background};
      --color-foreground: ${t.foreground};
      --color-card: ${t.card};
      --color-card-foreground: ${t.foreground};
      --color-muted: ${t.muted};
      --color-muted-foreground: ${t.mutedForeground};
      --color-border: ${t.border};
      --color-input: ${t.border};
      --color-ring: ${t.primary};
      --color-destructive: #ef4444;
      --color-destructive-foreground: #ffffff;
    }`;

  let updated = source.replace(
    / {4}@variant light \{[\s\S]*?\n {4}\}/,
    () => lightBlock,
  );

  // Also update the @theme default semantic variables so light-mode fallback matches
  updated = updated
    .replace(/--color-primary:\s*#[0-9a-fA-F]{6};/, `--color-primary: ${t.primary};`)
    .replace(/--color-background:\s*#[0-9a-fA-F]{6};/, `--color-background: ${t.background};`)
    .replace(/--color-foreground:\s*#[0-9a-fA-F]{6};/, `--color-foreground: ${t.foreground};`)
    .replace(/--color-card:\s*#[0-9a-fA-F]{6};/, `--color-card: ${t.card};`)
    .replace(/--color-card-foreground:\s*#[0-9a-fA-F]{6};/, `--color-card-foreground: ${t.foreground};`)
    .replace(/--color-muted:\s*#[0-9a-fA-F]{6};/, `--color-muted: ${t.muted};`)
    .replace(/--color-muted-foreground:\s*#[0-9a-fA-F]{6};/, `--color-muted-foreground: ${t.mutedForeground};`)
    .replace(/--color-border:\s*#[0-9a-fA-F]{6};/, `--color-border: ${t.border};`)
    .replace(/--color-input:\s*#[0-9a-fA-F]{6};/, `--color-input: ${t.border};`)
    .replace(/--color-ring:\s*#[0-9a-fA-F]{6};/, `--color-ring: ${t.primary};`);

  return updated;
}

export function updateColorsJsTokens(source: string, theme: ThemePreset): string {
  const t = THEME_TOKEN_MAP[theme];
  return source
    .replace(
      /border:\s*\{\s*light:\s*'#[0-9a-fA-F]{6}'/,
      `border: {\n    light: '${t.border.toUpperCase()}'`,
    )
    .replace(
      /card:\s*\{\s*light:\s*'#[0-9a-fA-F]{6}'/,
      `card: {\n    light: '${t.card.toUpperCase()}'`,
    )
    .replace(
      /muted:\s*\{\s*light:\s*'#[0-9a-fA-F]{6}'/,
      `muted: {\n    light: '${t.muted.toUpperCase()}'`,
    );
}

export async function applyThemeAndStyle(
  targetDir: string,
  options: { theme?: ThemePreset; style?: StylePreset },
): Promise<void> {
  const { theme, style } = options;

  if (theme) {
    const globalCssPath = path.join(targetDir, 'src/global.css');
    if (existsSync(globalCssPath)) {
      const cssSource = await readFile(globalCssPath, 'utf8');
      await writeFile(globalCssPath, updateGlobalCssTokens(cssSource, theme), 'utf8');
    }

    const colorsJsPath = path.join(targetDir, 'src/components/ui/colors.js');
    if (existsSync(colorsJsPath)) {
      const colorsSource = await readFile(colorsJsPath, 'utf8');
      await writeFile(colorsJsPath, updateColorsJsTokens(colorsSource, theme), 'utf8');
    }

    const buttonPath = path.join(targetDir, 'src/components/ui/button.tsx');
    if (existsSync(buttonPath)) {
      const buttonSource = await readFile(buttonPath, 'utf8');
      const updatedButton = buttonSource.replace(
        /container:\s*'bg-black dark:bg-white'/,
        `container: 'bg-primary dark:bg-white'`,
      );
      if (updatedButton !== buttonSource) {
        await writeFile(buttonPath, updatedButton, 'utf8');
      }
    }
  }

  if (style && style !== 'minimal') {
    const s = STYLE_TOKEN_MAP[style];

    const cardPath = path.join(targetDir, 'src/components/ui/card.tsx');
    if (existsSync(cardPath)) {
      const cardSource = await readFile(cardPath, 'utf8');
      const updatedCard = cardSource.replace(
        /'rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900'/,
        `'${s.cardClass}'`,
      );
      await writeFile(cardPath, updatedCard, 'utf8');
    }

    const buttonPath = path.join(targetDir, 'src/components/ui/button.tsx');
    if (existsSync(buttonPath)) {
      const buttonSource = await readFile(buttonPath, 'utf8');
      const updatedButton = buttonSource.replace(
        /container:\s*'my-2 flex flex-row items-center justify-center rounded-md px-4'/,
        `container: '${s.buttonContainerClass}'`,
      );
      await writeFile(buttonPath, updatedButton, 'utf8');
    }

    const inputPath = path.join(targetDir, 'src/components/ui/input.tsx');
    if (existsSync(inputPath)) {
      const inputSource = await readFile(inputPath, 'utf8');
      const updatedInput = inputSource.replace(
        /'mt-0 rounded-xl border-\[0\.5px\] border-neutral-300 bg-neutral-100 px-4 py-3 font-medium text-base\/5 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white'/,
        `'${s.inputClass}'`,
      );
      await writeFile(inputPath, updatedInput, 'utf8');
    }
  }
}

import { existsSync, readdirSync, statSync } from 'node:fs';

export function checkTargetDir(targetPath: string): { ok: boolean; error?: string } {
  if (!existsSync(targetPath)) {
    return { ok: true };
  }

  const stat = statSync(targetPath);
  if (!stat.isDirectory()) {
    return {
      ok: false,
      error: `Destination "${targetPath}" exists and is not a directory.`,
    };
  }

  const entries = readdirSync(targetPath).filter((entry) => {
    // Ignore OS-specific negligible files
    return entry !== '.DS_Store' && entry !== 'Thumbs.db';
  });

  if (entries.length > 0) {
    return {
      ok: false,
      error: `Destination "${targetPath}" is not empty. Please choose an empty folder or a new directory name.`,
    };
  }

  return { ok: true };
}

import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type {
  AuthProviderOption,
  BillingProviderOption,
  DataProviderOption,
  ParsedArgs,
} from './args.js';
import type { StylePreset, ThemePreset } from './themes.js';
import { exec } from 'node:child_process';
import { createServer } from 'node:http';
import process from 'node:process';
import {
  validateAuthProvider,
  validateBillingProvider,
  validateDataProvider,
} from './args.js';
import {
  validateAndroidPackage,
  validateAppName,
  validateIosBundleId,
} from './rename.js';
import { validateStylePreset, validateThemePreset } from './themes.js';

export type StudioScaffoldRequest = {
  targetDir: string;
  name: string;
  bundleId: string;
  theme: ThemePreset;
  style: StylePreset;
  authProvider: AuthProviderOption;
  dataProvider: DataProviderOption;
  billingProvider: BillingProviderOption;
  install: boolean;
  git: boolean;
};

export type StudioScaffoldResult = {
  ok: boolean;
  targetPath?: string;
  cliCommand?: string;
  error?: string;
};

export function validateStudioRequest(payload: Partial<StudioScaffoldRequest>): {
  ok: boolean;
  data?: StudioScaffoldRequest;
  error?: string;
} {
  const targetDir = (payload.targetDir ?? '').trim();
  if (!targetDir) {
    return { ok: false, error: 'Project directory is required.' };
  }
  const name = (payload.name ?? '').trim();
  if (!validateAppName(name)) {
    return { ok: false, error: 'App display name must contain at least one letter or number.' };
  }
  const bundleId = (payload.bundleId ?? '').trim();
  if (!validateIosBundleId(bundleId) || !validateAndroidPackage(bundleId)) {
    return {
      ok: false,
      error: 'Bundle ID must be a valid reverse-DNS identifier (e.g. com.acme.myapp) without reserved words.',
    };
  }
  const theme = (payload.theme ?? 'matcha').toLowerCase();
  if (!validateThemePreset(theme)) {
    return { ok: false, error: `Invalid theme preset "${theme}".` };
  }
  const style = (payload.style ?? 'minimal').toLowerCase();
  if (!validateStylePreset(style)) {
    return { ok: false, error: `Invalid UI style preset "${style}".` };
  }
  const authProvider = (payload.authProvider ?? 'mock').toLowerCase();
  if (!validateAuthProvider(authProvider)) {
    return { ok: false, error: `Invalid auth provider "${authProvider}".` };
  }
  const dataProvider = (payload.dataProvider ?? 'mock').toLowerCase();
  if (!validateDataProvider(dataProvider)) {
    return { ok: false, error: `Invalid data provider "${dataProvider}".` };
  }
  const billingProvider = (payload.billingProvider ?? 'mock').toLowerCase();
  if (!validateBillingProvider(billingProvider)) {
    return { ok: false, error: `Invalid billing provider "${billingProvider}".` };
  }

  return {
    ok: true,
    data: {
      targetDir,
      name,
      bundleId,
      theme,
      style,
      authProvider,
      dataProvider,
      billingProvider,
      install: Boolean(payload.install ?? true),
      git: Boolean(payload.git ?? true),
    },
  };
}

export function buildCliCommandFromStudio(req: StudioScaffoldRequest): string {
  const parts = [
    'npx create-swapstack-app',
    req.targetDir,
    `--name ${JSON.stringify(req.name)}`,
    `--bundle-id ${req.bundleId}`,
    `--theme ${req.theme}`,
    `--style ${req.style}`,
  ];
  if (req.authProvider !== 'mock') {
    parts.push(`--auth ${req.authProvider}`);
  }
  if (req.dataProvider !== 'mock') {
    parts.push(`--data ${req.dataProvider}`);
  }
  if (req.billingProvider !== 'mock') {
    parts.push(`--billing ${req.billingProvider}`);
  }
  if (!req.install) {
    parts.push('--no-install');
  }
  if (!req.git) {
    parts.push('--no-git');
  }
  parts.push('--yes');
  return parts.join(' ');
}

const STUDIO_CSS = `
  :root {
    --bg: #0c0d10;
    --card: #14161b;
    --border: #262932;
    --fg: #f8fafc;
    --muted: #94a3b8;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--fg);
    line-height: 1.5;
  }
  .topbar {
    border-bottom: 1px solid var(--border);
    padding: 14px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(20, 22, 27, 0.85);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .brand { font-weight: 700; font-size: 16px; display: flex; align-items: center; gap: 10px; }
  .badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(34, 197, 94, 0.14);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .layout {
    max-width: 1180px;
    margin: 0 auto;
    padding: 28px 24px 60px;
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 28px;
    align-items: start;
  }
  @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
  .panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 22px;
    margin-bottom: 18px;
  }
  .panel h2 { margin: 0 0 4px; font-size: 16px; }
  .panel p { margin: 0 0 16px; font-size: 13px; color: var(--muted); }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  @media (max-width: 640px) { .grid-3 { grid-template-columns: 1fr; } }
  label.field { display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 6px; }
  input.text-input, select.select-input {
    width: 100%; height: 40px; padding: 0 12px; border-radius: 10px;
    border: 1px solid var(--border); background: #0c0d10; color: var(--fg); font-size: 13.5px;
  }
  .pills { display: flex; flex-wrap: wrap; gap: 8px; }
  .pill-btn {
    display: inline-flex; align-items: center; gap: 8px; padding: 8px 13px;
    border-radius: 10px; border: 1px solid var(--border); background: #0c0d10;
    color: var(--fg); font-size: 12.5px; font-weight: 600; cursor: pointer;
  }
  .pill-btn[aria-pressed="true"] { border-color: var(--fg); background: rgba(255, 255, 255, 0.09); }
  .swatch { width: 12px; height: 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.25); }
  .cmd-box {
    background: #08090b; border: 1px solid var(--border); border-radius: 12px;
    padding: 12px 14px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px; color: #a7f3d0; overflow-x: auto; white-space: nowrap; margin-bottom: 14px;
  }
  .create-btn {
    width: 100%; height: 46px; border-radius: 12px; border: none;
    background: var(--fg); color: #090a0c; font-size: 14px; font-weight: 700; cursor: pointer;
  }
  .create-btn:disabled { opacity: 0.6; cursor: wait; }
  .phone-frame {
    width: 310px; margin: 0 auto; border-radius: 36px; padding: 12px;
    background: #050507; border: 2px solid #2b2f3a; box-shadow: 0 24px 48px rgba(0,0,0,0.45);
  }
  .phone-canvas {
    border-radius: 26px; padding: 20px 18px; min-height: 470px;
    display: flex; flex-direction: column; transition: all 0.2s ease;
  }
  .p-card { padding: 12px; margin-top: 10px; transition: all 0.2s ease; }
  .p-btn { width: 100%; padding: 10px 14px; margin-top: 12px; border: none; font-weight: 700; text-align: center; }
  .p-input { width: 100%; padding: 9px 12px; margin-top: 6px; font-size: 12px; }
  .status-msg { margin-top: 12px; padding: 12px 14px; border-radius: 10px; font-size: 13px; display: none; }
`;

function buildStudioBodyHtml(defaultDir: string, defaultName: string, defaultBundle: string): string {
  return `  <header class="topbar">
    <div class="brand">
      <span>Swapstack Setup Studio</span>
      <span class="badge">Local CLI UI (--ui)</span>
    </div>
    <span style="font-size:12px;color:var(--muted);">Configure visually &amp; scaffold directly to disk</span>
  </header>

  <main class="layout">
    <div>
      <section class="panel">
        <h2>1. App Identity</h2>
        <p>Configure your project directory, display name, and iOS/Android bundle identifier.</p>
        <div class="grid-3">
          <div>
            <label class="field" for="f-dir">Directory</label>
            <input class="text-input" id="f-dir" value="${defaultDir}" />
          </div>
          <div>
            <label class="field" for="f-name">App Display Name</label>
            <input class="text-input" id="f-name" value="${defaultName}" />
          </div>
          <div>
            <label class="field" for="f-bundle">Bundle ID (iOS &amp; Android)</label>
            <input class="text-input" id="f-bundle" value="${defaultBundle}" />
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>2. Color Theme Preset</h2>
        <p>Applies semantic tokens to <code>src/global.css</code> and <code>src/components/ui/colors.js</code>.</p>
        <div class="pills" id="theme-group">
          <button type="button" class="pill-btn" data-theme="matcha"><span class="swatch" style="background:#143d29"></span>Matcha</button>
          <button type="button" class="pill-btn" data-theme="terracotta"><span class="swatch" style="background:#b84a27"></span>Terracotta</button>
          <button type="button" class="pill-btn" data-theme="cobalt"><span class="swatch" style="background:#1d4ed8"></span>Cobalt</button>
          <button type="button" class="pill-btn" data-theme="sakura"><span class="swatch" style="background:#9d174d"></span>Sakura</button>
          <button type="button" class="pill-btn" data-theme="espresso"><span class="swatch" style="background:#362214"></span>Espresso</button>
          <button type="button" class="pill-btn" data-theme="light"><span class="swatch" style="background:#ffffff"></span>Neutral Light</button>
          <button type="button" class="pill-btn" data-theme="dark"><span class="swatch" style="background:#0a0a0a"></span>Obsidian Dark</button>
        </div>
      </section>

      <section class="panel">
        <h2>3. UI Design Style</h2>
        <p>Configures corner radii, borders, and typography across <code>Card</code>, <code>Button</code>, and <code>Input</code>.</p>
        <div class="pills" id="style-group">
          <button type="button" class="pill-btn" data-style="minimal">Swiss Minimal</button>
          <button type="button" class="pill-btn" data-style="soft">Soft Pill</button>
          <button type="button" class="pill-btn" data-style="editorial">Editorial Serif</button>
          <button type="button" class="pill-btn" data-style="brutalist">Neo-Brutalist</button>
          <button type="button" class="pill-btn" data-style="terminal">Technical Mono</button>
        </div>
      </section>

      <section class="panel">
        <h2>4. Service Providers (<code>.env</code>)</h2>
        <p>Screens depend on contracts in <code>src/core/</code>. Choose your initial adapters:</p>
        <div class="grid-3">
          <div>
            <label class="field" for="f-auth">Auth Provider</label>
            <select class="select-input" id="f-auth">
              <option value="mock">mock (0 keys)</option>
              <option value="supabase">supabase</option>
              <option value="firebase">firebase</option>
              <option value="clerk">clerk</option>
            </select>
          </div>
          <div>
            <label class="field" for="f-data">Data Repository</label>
            <select class="select-input" id="f-data">
              <option value="mock">mock (0 keys)</option>
              <option value="supabase">supabase</option>
              <option value="firebase">firebase</option>
            </select>
          </div>
          <div>
            <label class="field" for="f-billing">Billing Provider</label>
            <select class="select-input" id="f-billing">
              <option value="mock">mock (0 keys)</option>
              <option value="revenuecat">revenuecat</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:20px;margin-top:14px;font-size:13px;">
          <label><input type="checkbox" id="f-git" checked /> Initialize Git repository</label>
          <label><input type="checkbox" id="f-install" checked /> Run <code>pnpm install</code></label>
        </div>
      </section>

      <section class="panel">
        <h2>5. Equivalent CLI Command &amp; Scaffold</h2>
        <div class="cmd-box" id="cli-preview"></div>
        <button type="button" class="create-btn" id="create-btn">Create App on My Machine</button>
        <div class="status-msg" id="status-msg"></div>
      </section>
    </div>

    <div style="position:sticky;top:76px;">
      <div class="phone-frame">
        <div class="phone-canvas" id="phone-canvas">
          <div style="font-size:11px;opacity:0.7;font-family:monospace;" id="p-badge">(app)/index</div>
          <div style="font-size:20px;font-weight:800;margin-top:6px;" id="p-title">${defaultName}</div>
          <div style="font-size:12px;opacity:0.75;margin-top:2px;" id="p-sub">${defaultBundle}</div>
          <div class="p-card" id="p-card-1">
            <div style="font-size:12.5px;font-weight:700;">Resolved Service Stack</div>
            <div style="font-size:11.5px;opacity:0.8;margin-top:4px;font-family:monospace;" id="p-stack">auth: mock · data: mock · billing: mock</div>
          </div>
          <div class="p-card" id="p-card-2">
            <div style="font-size:12.5px;font-weight:700;">Design System Tokens</div>
            <div style="font-size:11.5px;opacity:0.8;margin-top:4px;" id="p-design">Theme: matcha · Style: minimal</div>
          </div>
          <div style="margin-top:14px;font-size:11.5px;font-weight:600;">Quick Sign-In Preview</div>
          <div class="p-input" id="p-input">founder@swapstack.dev</div>
          <div class="p-btn" id="p-btn">Continue to App</div>
        </div>
      </div>
    </div>
  </main>`;
}

function buildStudioScriptHtml(defaults: {
  defaultTheme: string;
  defaultStyle: string;
  defaultAuth: string;
  defaultData: string;
  defaultBilling: string;
}): string {
  const { defaultTheme, defaultStyle, defaultAuth, defaultData, defaultBilling } = defaults;
  return `  <script>
    const themes = {
      matcha: { bg: '#f7faf6', fg: '#0f2419', card: '#ffffff', border: '#cfe0cb', primary: '#143d29', primaryFg: '#ffffff' },
      terracotta: { bg: '#fbf8f3', fg: '#241710', card: '#fffdf9', border: '#dfd3c0', primary: '#b84a27', primaryFg: '#ffffff' },
      cobalt: { bg: '#f6f9fc', fg: '#0c192c', card: '#ffffff', border: '#cbdcf0', primary: '#1d4ed8', primaryFg: '#ffffff' },
      sakura: { bg: '#fdf8f9', fg: '#291019', card: '#ffffff', border: '#e8cdd6', primary: '#9d174d', primaryFg: '#ffffff' },
      espresso: { bg: '#fdfbf6', fg: '#21170e', card: '#ffffff', border: '#dfd4bc', primary: '#362214', primaryFg: '#ffffff' },
      light: { bg: '#ffffff', fg: '#0a0a0a', card: '#ffffff', border: '#e5e5e5', primary: '#171717', primaryFg: '#ffffff' },
      dark: { bg: '#0a0a0a', fg: '#fafafa', card: '#141414', border: '#2e2e2e', primary: '#fafafa', primaryFg: '#0a0a0a' },
    };

    const styles = {
      minimal: { radius: '12px', btnRadius: '8px', border: '1px solid', shadow: 'none', font: 'inherit' },
      soft: { radius: '22px', btnRadius: '999px', border: '1px solid', shadow: '0 4px 12px rgba(0,0,0,0.06)', font: 'inherit' },
      editorial: { radius: '2px', btnRadius: '2px', border: '1px solid', shadow: 'none', font: 'Georgia, serif' },
      brutalist: { radius: '6px', btnRadius: '6px', border: '2px solid', shadow: '3px 3px 0px', font: 'inherit' },
      terminal: { radius: '0px', btnRadius: '0px', border: '1px dashed', shadow: 'none', font: 'ui-monospace, monospace' },
    };

    let state = { theme: '${defaultTheme}', style: '${defaultStyle}' };
    document.getElementById('f-auth').value = '${defaultAuth}';
    document.getElementById('f-data').value = '${defaultData}';
    document.getElementById('f-billing').value = '${defaultBilling}';

    function render() {
      const dir = document.getElementById('f-dir').value.trim() || 'my-app';
      const name = document.getElementById('f-name').value.trim() || 'My App';
      const bundle = document.getElementById('f-bundle').value.trim() || 'com.acme.myapp';
      const auth = document.getElementById('f-auth').value;
      const data = document.getElementById('f-data').value;
      const billing = document.getElementById('f-billing').value;
      const git = document.getElementById('f-git').checked;
      const install = document.getElementById('f-install').checked;

      document.querySelectorAll('[data-theme]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-theme') === state.theme));
      });
      document.querySelectorAll('[data-style]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-style') === state.style));
      });

      const t = themes[state.theme] || themes.matcha;
      const s = styles[state.style] || styles.minimal;
      const canvas = document.getElementById('phone-canvas');
      canvas.style.background = t.bg;
      canvas.style.color = t.fg;
      canvas.style.fontFamily = s.font;

      ['p-card-1', 'p-card-2'].forEach((id) => {
        const el = document.getElementById(id);
        el.style.background = t.card;
        el.style.borderRadius = s.radius;
        el.style.border = s.border + ' ' + (state.style === 'brutalist' ? t.fg : t.border);
        el.style.boxShadow = state.style === 'brutalist' ? (s.shadow + ' ' + t.fg) : s.shadow;
      });

      const inp = document.getElementById('p-input');
      inp.style.background = t.card;
      inp.style.borderRadius = s.btnRadius;
      inp.style.border = s.border + ' ' + (state.style === 'brutalist' ? t.fg : t.border);

      const btn = document.getElementById('p-btn');
      btn.style.background = t.primary;
      btn.style.color = t.primaryFg;
      btn.style.borderRadius = s.btnRadius;

      document.getElementById('p-title').textContent = name;
      document.getElementById('p-sub').textContent = bundle;
      document.getElementById('p-stack').textContent = 'auth: ' + auth + ' · data: ' + data + ' · billing: ' + billing;
      document.getElementById('p-design').textContent = 'Theme: ' + state.theme + ' · Style: ' + state.style;

      const parts = [
        'npx create-swapstack-app',
        dir,
        '--name ' + JSON.stringify(name),
        '--bundle-id ' + bundle,
        '--theme ' + state.theme,
        '--style ' + state.style,
      ];
      if (auth !== 'mock') parts.push('--auth ' + auth);
      if (data !== 'mock') parts.push('--data ' + data);
      if (billing !== 'mock') parts.push('--billing ' + billing);
      if (!install) parts.push('--no-install');
      if (!git) parts.push('--no-git');
      parts.push('--yes');
      document.getElementById('cli-preview').textContent = '$ ' + parts.join(' ');
    }

    document.querySelectorAll('[data-theme]').forEach((b) => {
      b.addEventListener('click', () => { state.theme = b.getAttribute('data-theme'); render(); });
    });
    document.querySelectorAll('[data-style]').forEach((b) => {
      b.addEventListener('click', () => { state.style = b.getAttribute('data-style'); render(); });
    });
    ['f-dir', 'f-name', 'f-bundle', 'f-auth', 'f-data', 'f-billing', 'f-git', 'f-install'].forEach((id) => {
      document.getElementById(id).addEventListener('input', render);
      document.getElementById(id).addEventListener('change', render);
    });

    document.getElementById('create-btn').addEventListener('click', async () => {
      const btn = document.getElementById('create-btn');
      const msg = document.getElementById('status-msg');
      btn.disabled = true;
      btn.textContent = 'Scaffolding your app...';
      msg.style.display = 'block';
      msg.style.background = 'rgba(59,130,246,0.14)';
      msg.style.color = '#93c5fd';
      msg.textContent = 'Downloading template, applying theme & style tokens, and configuring providers...';

      try {
        const res = await fetch('/api/scaffold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetDir: document.getElementById('f-dir').value,
            name: document.getElementById('f-name').value,
            bundleId: document.getElementById('f-bundle').value,
            theme: state.theme,
            style: state.style,
            authProvider: document.getElementById('f-auth').value,
            dataProvider: document.getElementById('f-data').value,
            billingProvider: document.getElementById('f-billing').value,
            git: document.getElementById('f-git').checked,
            install: document.getElementById('f-install').checked,
          }),
        });
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || 'Failed to create project.');
        }
        msg.style.background = 'rgba(34,197,94,0.16)';
        msg.style.color = '#86efac';
        msg.innerHTML = '🎉 <strong>Created at:</strong> <code>' + data.targetPath + '</code><br/>Run <code>cd ' + document.getElementById('f-dir').value.trim() + ' &amp;&amp; pnpm start</code> in your terminal!';
        btn.textContent = 'App Created!';
      } catch (err) {
        msg.style.background = 'rgba(239,68,68,0.16)';
        msg.style.color = '#fca5a5';
        msg.textContent = err.message || String(err);
        btn.disabled = false;
        btn.textContent = 'Create App on My Machine';
      }
    });

    render();
  </script>`;
}

export function buildStudioHtml(initial: Partial<ParsedArgs> = {}): string {
  const defaultDir = initial.targetDir ?? 'my-app';
  const defaultName = initial.name ?? 'My App';
  const defaultBundle = initial.iosBundleId ?? 'com.acme.myapp';
  const defaultTheme = initial.theme ?? 'matcha';
  const defaultStyle = initial.style ?? 'minimal';
  const defaultAuth = initial.authProvider ?? 'mock';
  const defaultData = initial.dataProvider ?? 'mock';
  const defaultBilling = initial.billingProvider ?? 'mock';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Swapstack Setup Studio — Visual App Builder</title>
  <style>${STUDIO_CSS}</style>
</head>
<body>
${buildStudioBodyHtml(defaultDir, defaultName, defaultBundle)}
${buildStudioScriptHtml({ defaultTheme, defaultStyle, defaultAuth, defaultData, defaultBilling })}
</body>
</html>`;
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += String(chunk);
    });
    req.on('end', () => {
      try {
        resolve(body ? (JSON.parse(body) as Record<string, unknown>) : {});
      }
      catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd
    = platform === 'darwin'
      ? `open "${url}"`
      : platform === 'win32'
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {
    // Ignore browser launch error on headless systems
  });
}

export function createStudioServer(
  initialArgs: Partial<ParsedArgs>,
  onScaffold: (request: StudioScaffoldRequest) => Promise<StudioScaffoldResult>,
): Server {
  const html = buildStudioHtml(initialArgs);

  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'GET' && (req.url === '/' || req.url?.startsWith('/?'))) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'POST' && req.url === '/api/scaffold') {
      try {
        const body = await readJsonBody(req);
        const validated = validateStudioRequest(body as Partial<StudioScaffoldRequest>);
        if (!validated.ok || !validated.data) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: validated.error }));
          return;
        }
        const result = await onScaffold(validated.data);
        res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      }
      catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  });
}

export async function launchSetupUi(
  initialArgs: Partial<ParsedArgs>,
  onScaffold: (request: StudioScaffoldRequest) => Promise<StudioScaffoldResult>,
): Promise<void> {
  await new Promise<void>((resolve) => {
    const server = createStudioServer(initialArgs, async (req) => {
      const result = await onScaffold(req);
      if (result.ok) {
        setTimeout(() => {
          server.close(() => resolve());
        }, 1200);
      }
      return result;
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 4400;
      const url = `http://127.0.0.1:${port}`;
      console.log(`\n✨ Swapstack Visual Setup Studio running at: ${url}`);
      console.log('Configure your app in the opened browser window (press Ctrl+C to cancel).\n');
      openBrowser(url);
    });
  });
}

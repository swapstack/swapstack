import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type {
  AuthProviderOption,
  BillingProviderOption,
  DataProviderOption,
  ParsedArgs,
} from './args.js';
import type { BlueprintPreset } from './blueprints.js';
import type { StylePreset, ThemePreset } from './themes.js';
import { exec } from 'node:child_process';
import { createServer } from 'node:http';
import process from 'node:process';
import {
  validateAuthProvider,
  validateBillingProvider,
  validateDataProvider,
} from './args.js';
import { BLUEPRINT_PRESETS, validateBlueprintPreset } from './blueprints.js';
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
  template: BlueprintPreset;
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
  const template = (payload.template ?? 'default').toLowerCase();
  if (!validateBlueprintPreset(template)) {
    return {
      ok: false,
      error: `Invalid blueprint "${template}". Valid options: ${BLUEPRINT_PRESETS.join(', ')}.`,
    };
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
      template,
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
  if (req.template !== 'default') {
    parts.push(`--template ${req.template}`);
  }
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
    width: 320px; margin: 0 auto; border-radius: 36px; padding: 12px;
    background: #050507; border: 2px solid #2b2f3a; box-shadow: 0 24px 48px rgba(0,0,0,0.45);
  }
  .phone-canvas {
    border-radius: 26px; padding: 20px 18px; min-height: 480px;
    display: flex; flex-direction: column; transition: all 0.2s ease;
  }
  .p-view { display: flex; flex-direction: column; flex: 1; }
  .p-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .p-badge-inline { font-size: 10px; padding: 2px 7px; border-radius: 999px; background: rgba(128,128,128,0.14); border: 1px solid rgba(128,128,128,0.25); font-weight: 600; }
  .p-stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0; }
  .p-stat-box { padding: 8px 4px; text-align: center; transition: all 0.2s ease; }
  .p-stat-val { font-size: 15px; font-weight: 700; display: block; }
  .p-stat-lbl { font-size: 9.5px; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; display: block; }
  .p-chat-bubble { padding: 9px 12px; font-size: 11.5px; line-height: 1.4; margin-top: 8px; }
  .p-chat-user { align-self: flex-end; max-width: 90%; }
  .p-chat-ai { max-width: 95%; }
  .p-card { padding: 12px; margin-top: 10px; transition: all 0.2s ease; }
  .p-card-title-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700; }
  .p-card-desc { font-size: 11px; opacity: 0.8; margin-top: 4px; line-height: 1.35; }
  .p-btn { width: 100%; padding: 10px 14px; margin-top: 12px; border: none; font-weight: 700; text-align: center; cursor: pointer; }
  .p-btn-outline { width: 100%; padding: 8px 12px; margin-top: 10px; background: transparent; font-weight: 600; text-align: center; cursor: pointer; font-size: 12px; }
  .p-input { width: 100%; padding: 9px 12px; margin-top: 6px; font-size: 12px; }
  .status-msg { margin-top: 12px; padding: 12px 14px; border-radius: 10px; font-size: 13px; display: none; }
`;

function buildDefaultCanvasHtml(defaultName: string, defaultBundle: string): string {
  return `          <div style="font-size:11px;opacity:0.7;font-family:monospace;" id="p-badge-default">(app)/index</div>
          <div style="font-size:20px;font-weight:800;margin-top:6px;" id="p-title-default">${defaultName}</div>
          <div style="font-size:12px;opacity:0.75;margin-top:2px;" id="p-sub-default">${defaultBundle}</div>
          <div class="p-card" id="p-card-1">
            <div style="font-size:12.5px;font-weight:700;">Resolved Service Stack</div>
            <div style="font-size:11.5px;opacity:0.8;margin-top:4px;font-family:monospace;" id="p-stack">auth: mock · data: mock · billing: mock · blueprint: default</div>
          </div>
          <div class="p-card" id="p-card-2">
            <div style="font-size:12.5px;font-weight:700;">Design System Tokens</div>
            <div style="font-size:11.5px;opacity:0.8;margin-top:4px;" id="p-design">Theme: matcha · Style: minimal</div>
          </div>
          <div style="margin-top:14px;font-size:11.5px;font-weight:600;">Quick Sign-In Preview</div>
          <div class="p-input" id="p-input">founder@swapstack.dev</div>
          <div class="p-btn" id="p-btn">Continue to App</div>`;
}

function buildPulseCanvasHtml(): string {
  return `          <div class="p-top-row">
            <span style="font-size:11px;opacity:0.7;font-family:monospace;">(app)/index · Pulse</span>
            <span class="p-badge-inline">Guest</span>
          </div>
          <div style="font-size:19px;font-weight:800;margin-top:4px;">Pulse Workouts</div>
          <div style="font-size:11.5px;opacity:0.75;margin-top:2px;">Track daily training and build consistency.</div>
          <div class="p-stat-row">
            <div class="p-stat-box"><span class="p-stat-val" id="p-pulse-count">12</span><span class="p-stat-lbl">Workouts</span></div>
            <div class="p-stat-box"><span class="p-stat-val" id="p-pulse-streak">5d</span><span class="p-stat-lbl">Streak</span></div>
            <div class="p-stat-box"><span class="p-stat-val" id="p-pulse-mins">380m</span><span class="p-stat-lbl">Total Time</span></div>
          </div>
          <div class="p-card">
            <div class="p-card-title-row"><span>Upper Body Strength</span><span class="p-badge-inline">45m</span></div>
            <div class="p-card-desc">Completed today · Logged via WorkoutRepository</div>
          </div>
          <div class="p-card">
            <div class="p-card-title-row"><span>Zone 2 Morning Run</span><span class="p-badge-inline">30m</span></div>
            <div class="p-card-desc">Completed yesterday · 5.2 km</div>
          </div>
          <div class="p-card">
            <div class="p-card-title-row"><span>Pro Streak Analytics</span><span class="p-badge-inline">Locked</span></div>
            <div class="p-card-desc">Unlock 90-day volume charts via BillingProvider.</div>
          </div>
          <button type="button" class="p-btn" id="p-pulse-log-btn" style="margin-top:auto;">+ Log 30m Workout</button>`;
}

function buildMemoStackCanvasHtml(): string {
  return `          <div class="p-top-row">
            <span style="font-size:11px;opacity:0.7;font-family:monospace;">(app)/index · MemoStack</span>
            <span class="p-badge-inline" id="p-memo-quota">2 / 3 Free Decks</span>
          </div>
          <div style="font-size:19px;font-weight:800;margin-top:4px;">Study Decks</div>
          <div style="font-size:11.5px;opacity:0.75;margin-top:2px;">Offline-first spaced repetition flashcards.</div>
          <div class="p-card" id="p-memo-flip-card" style="cursor:pointer;margin-top:10px;">
            <div class="p-card-title-row"><span class="p-badge-inline" id="p-memo-side">Active Card · Front</span><span style="font-size:10px;opacity:0.6;">Tap to flip</span></div>
            <div style="margin-top:8px;font-size:12.5px;font-weight:600;line-height:1.4;" id="p-memo-text">Where are live vendor SDKs (Supabase, RevenueCat) allowed to be imported?</div>
          </div>
          <button type="button" class="p-btn-outline" id="p-memo-flip-btn">Flip Flashcard</button>
          <div class="p-card">
            <div class="p-card-title-row"><span>1. Architecture Contracts</span><span class="p-badge-inline">24 cards</span></div>
            <div class="p-card-desc">18 mastered · Syncs on account upgrade</div>
          </div>
          <div class="p-card">
            <div class="p-card-title-row"><span>2. Expo Router Patterns</span><span class="p-badge-inline">16 cards</span></div>
            <div class="p-card-desc">11 mastered · Session-protected routes</div>
          </div>
          <div class="p-card" style="margin-top:auto;">
            <div class="p-card-title-row"><span>Unlimited Study Decks</span><span class="p-badge-inline">Pro Gate</span></div>
            <div class="p-card-desc">Free tier includes 3 decks. Upgrade on /paywall.</div>
          </div>`;
}

function buildPromptBoxCanvasHtml(): string {
  return `          <div class="p-top-row">
            <span style="font-size:11px;opacity:0.7;font-family:monospace;">(app)/index · PromptBox</span>
            <span class="p-badge-inline" id="p-prompt-quota">4 / 5 Free Today</span>
          </div>
          <div style="font-size:19px;font-weight:800;margin-top:4px;">PromptBox AI</div>
          <div style="font-size:11.5px;opacity:0.75;margin-top:2px;">Saved threads &amp; contract-tested replies.</div>
          <div class="p-chat-bubble p-chat-user">Write a Supabase RLS policy so users can only update their own profile row.</div>
          <div class="p-chat-bubble p-chat-ai">
            <div style="font-weight:700;margin-bottom:3px;font-size:11px;">Assistant</div>
            <div>Use <code style="font-size:10.5px;">auth.uid() = id</code> in your policy:<br/><span style="font-family:monospace;font-size:10px;opacity:0.9;">create policy "Users update own profile" on profiles for update using (auth.uid() = id);</span></div>
          </div>
          <div class="p-card" style="margin-top:10px;">
            <div class="p-card-title-row"><span>Daily Message Quota</span><span class="p-badge-inline" id="p-prompt-badge">1 left</span></div>
            <div class="p-card-desc" id="p-prompt-desc">Upgrade to Pro on /paywall for unlimited daily prompts &amp; thread export.</div>
          </div>
          <button type="button" class="p-btn" id="p-prompt-send-btn" style="margin-top:auto;">Send Test Prompt</button>`;
}

function buildSplitLedgerCanvasHtml(): string {
  return `          <div class="p-top-row">
            <span style="font-size:11px;opacity:0.7;font-family:monospace;">(app)/index · SplitLedger</span>
            <span class="p-badge-inline">Guest Session</span>
          </div>
          <div style="font-size:19px;font-weight:800;margin-top:4px;">Lisbon Trip</div>
          <div style="font-size:11.5px;opacity:0.75;margin-top:2px;">Shared group expenses &amp; net balances.</div>
          <div class="p-stat-row">
            <div class="p-stat-box"><span class="p-stat-val" id="p-split-alex" style="color:#22c55e;">+$42</span><span class="p-stat-lbl">Alex (You)</span></div>
            <div class="p-stat-box"><span class="p-stat-val">-$24</span><span class="p-stat-lbl">Sam</span></div>
            <div class="p-stat-box"><span class="p-stat-val">-$18</span><span class="p-stat-lbl">Jordan</span></div>
          </div>
          <div class="p-card">
            <div class="p-card-title-row"><span>Time Out Market Dinner</span><span id="p-split-dinner" style="font-weight:700;">$84.00</span></div>
            <div class="p-card-desc">Paid by Alex · Split equally (3 ways)</div>
          </div>
          <div class="p-card">
            <div style="font-size:12px;font-weight:700;">Guest Account Reminder</div>
            <div class="p-card-desc">Link email &amp; password on /profile to keep this ledger across devices.</div>
          </div>
          <div class="p-card">
            <div class="p-card-title-row"><span>CSV Settlement Export</span><span class="p-badge-inline">Locked</span></div>
            <div class="p-card-desc">Requires active pro entitlement from BillingProvider.</div>
          </div>
          <button type="button" class="p-btn" id="p-split-add-btn" style="margin-top:auto;">+ Add $30 Expense</button>`;
}

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
        <div style="margin-top:14px;">
          <label class="field" for="f-template">Starter Blueprint</label>
          <select class="select-input" id="f-template">
            <option value="default">default (auth + profile + paywall)</option>
            <option value="pulse">pulse (habit &amp; workout tracker)</option>
            <option value="memostack">memostack (spaced-repetition flashcards)</option>
            <option value="promptbox">promptbox (AI prompt threads)</option>
            <option value="splitledger">splitledger (group expense splitter)</option>
          </select>
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
          <div class="p-view" id="p-view-default">
${buildDefaultCanvasHtml(defaultName, defaultBundle)}
          </div>
          <div class="p-view" id="p-view-pulse" style="display:none;">
${buildPulseCanvasHtml()}
          </div>
          <div class="p-view" id="p-view-memostack" style="display:none;">
${buildMemoStackCanvasHtml()}
          </div>
          <div class="p-view" id="p-view-promptbox" style="display:none;">
${buildPromptBoxCanvasHtml()}
          </div>
          <div class="p-view" id="p-view-splitledger" style="display:none;">
${buildSplitLedgerCanvasHtml()}
          </div>
        </div>
      </div>
    </div>
  </main>`;
}

function buildStudioThemeConfigJs(): string {
  return `    const themes = {
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
    };`;
}

function buildStudioInteractiveBlueprintJs(): string {
  return `    let pulseCount = 12;
    let pulseMins = 380;
    const pulseLogBtn = document.getElementById('p-pulse-log-btn');
    if (pulseLogBtn) {
      pulseLogBtn.addEventListener('click', () => {
        pulseCount += 1;
        pulseMins += 30;
        document.getElementById('p-pulse-count').textContent = String(pulseCount);
        document.getElementById('p-pulse-mins').textContent = pulseMins + 'm';
        document.getElementById('p-pulse-streak').textContent = '6d';
      });
    }

    let memoFlipped = false;
    function flipMemo() {
      memoFlipped = !memoFlipped;
      document.getElementById('p-memo-side').textContent = memoFlipped ? 'Active Card · Answer' : 'Active Card · Front';
      document.getElementById('p-memo-text').textContent = memoFlipped
        ? 'Only inside adapter modules under src/lib/providers/<vendor>/ — never in src/app/ screens.'
        : 'Where are live vendor SDKs (Supabase, RevenueCat) allowed to be imported?';
    }
    const memoFlipBtn = document.getElementById('p-memo-flip-btn');
    const memoCard = document.getElementById('p-memo-flip-card');
    if (memoFlipBtn) memoFlipBtn.addEventListener('click', flipMemo);
    if (memoCard) memoCard.addEventListener('click', flipMemo);

    const promptSendBtn = document.getElementById('p-prompt-send-btn');
    if (promptSendBtn) {
      promptSendBtn.addEventListener('click', () => {
        document.getElementById('p-prompt-quota').textContent = '5 / 5 Used';
        document.getElementById('p-prompt-badge').textContent = 'Limit Reached';
        document.getElementById('p-prompt-desc').textContent = 'Daily free limit (5/5) reached! Upgrade on /paywall for unlimited daily prompts.';
      });
    }

    let splitAlex = 42;
    let splitDinner = 84;
    const splitAddBtn = document.getElementById('p-split-add-btn');
    if (splitAddBtn) {
      splitAddBtn.addEventListener('click', () => {
        splitAlex += 20;
        splitDinner += 30;
        document.getElementById('p-split-alex').textContent = '+$' + splitAlex;
        document.getElementById('p-split-dinner').textContent = '$' + splitDinner + '.00';
      });
    }`;
}

function buildStudioScriptHtml(defaults: {
  defaultTheme: string;
  defaultStyle: string;
  defaultAuth: string;
  defaultData: string;
  defaultBilling: string;
  defaultTemplate: string;
}): string {
  const { defaultTheme, defaultStyle, defaultAuth, defaultData, defaultBilling, defaultTemplate } = defaults;
  return `  <script>
${buildStudioThemeConfigJs()}

    let state = { theme: '${defaultTheme}', style: '${defaultStyle}' };
    document.getElementById('f-auth').value = '${defaultAuth}';
    document.getElementById('f-data').value = '${defaultData}';
    document.getElementById('f-billing').value = '${defaultBilling}';
    document.getElementById('f-template').value = '${defaultTemplate}';

    function render() {
      const dir = document.getElementById('f-dir').value.trim() || 'my-app';
      const name = document.getElementById('f-name').value.trim() || 'My App';
      const bundle = document.getElementById('f-bundle').value.trim() || 'com.acme.myapp';
      const auth = document.getElementById('f-auth').value;
      const data = document.getElementById('f-data').value;
      const billing = document.getElementById('f-billing').value;
      const template = document.getElementById('f-template').value;
      const git = document.getElementById('f-git').checked;
      const install = document.getElementById('f-install').checked;

      document.querySelectorAll('[data-theme]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-theme') === state.theme));
      });
      document.querySelectorAll('[data-style]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-style') === state.style));
      });

      const views = ['default', 'pulse', 'memostack', 'promptbox', 'splitledger'];
      views.forEach((v) => {
        const el = document.getElementById('p-view-' + v);
        if (el) el.style.display = v === template ? 'flex' : 'none';
      });

      const t = themes[state.theme] || themes.matcha;
      const s = styles[state.style] || styles.minimal;
      const canvas = document.getElementById('phone-canvas');
      canvas.style.background = t.bg;
      canvas.style.color = t.fg;
      canvas.style.fontFamily = s.font;

      const isBrutalist = state.style === 'brutalist';
      const borderColor = isBrutalist ? t.fg : t.border;
      const shadow = isBrutalist ? (s.shadow + ' ' + t.fg) : s.shadow;

      document.querySelectorAll('#phone-canvas .p-card').forEach((el) => {
        el.style.background = t.card;
        el.style.borderRadius = s.radius;
        el.style.border = s.border + ' ' + borderColor;
        el.style.boxShadow = shadow;
      });

      document.querySelectorAll('#phone-canvas .p-stat-box').forEach((el) => {
        el.style.background = t.card;
        el.style.borderRadius = s.radius;
        el.style.border = s.border + ' ' + borderColor;
      });

      document.querySelectorAll('#phone-canvas .p-input').forEach((inp) => {
        inp.style.background = t.card;
        inp.style.borderRadius = s.btnRadius;
        inp.style.border = s.border + ' ' + borderColor;
      });

      document.querySelectorAll('#phone-canvas .p-btn').forEach((btn) => {
        btn.style.background = t.primary;
        btn.style.color = t.primaryFg;
        btn.style.borderRadius = s.btnRadius;
      });

      document.querySelectorAll('#phone-canvas .p-btn-outline').forEach((btn) => {
        btn.style.borderRadius = s.btnRadius;
        btn.style.border = s.border + ' ' + borderColor;
        btn.style.color = t.fg;
      });

      document.querySelectorAll('#phone-canvas .p-chat-user').forEach((el) => {
        el.style.background = t.primary;
        el.style.color = t.primaryFg;
        el.style.borderRadius = s.radius;
      });

      document.querySelectorAll('#phone-canvas .p-chat-ai').forEach((el) => {
        el.style.background = t.card;
        el.style.borderRadius = s.radius;
        el.style.border = s.border + ' ' + borderColor;
      });

      document.getElementById('p-title-default').textContent = name;
      document.getElementById('p-sub-default').textContent = bundle;
      document.getElementById('p-stack').textContent = 'auth: ' + auth + ' · data: ' + data + ' · billing: ' + billing + ' · blueprint: ' + template;
      document.getElementById('p-design').textContent = 'Theme: ' + state.theme + ' · Style: ' + state.style;

      const parts = [
        'npx create-swapstack-app',
        dir,
        '--name ' + JSON.stringify(name),
        '--bundle-id ' + bundle,
        '--theme ' + state.theme,
        '--style ' + state.style,
      ];
      if (template !== 'default') parts.push('--template ' + template);
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
    ['f-dir', 'f-name', 'f-bundle', 'f-auth', 'f-data', 'f-billing', 'f-template', 'f-git', 'f-install'].forEach((id) => {
      document.getElementById(id).addEventListener('input', render);
      document.getElementById(id).addEventListener('change', render);
    });

${buildStudioInteractiveBlueprintJs()}

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
            template: document.getElementById('f-template').value,
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
  const defaultTemplate = initial.template ?? 'default';

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
${buildStudioScriptHtml({ defaultTheme, defaultStyle, defaultAuth, defaultData, defaultBilling, defaultTemplate })}
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

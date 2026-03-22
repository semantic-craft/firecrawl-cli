/**
 * Interact session persistence utility
 * Stores the last scrape ID so interact commands can reuse it automatically
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface StoredInteractSession {
  scrapeId: string;
  url: string;
  createdAt: string;
}

function getConfigDir(): string {
  const homeDir = os.homedir();
  const platform = os.platform();

  switch (platform) {
    case 'darwin':
      return path.join(
        homeDir,
        'Library',
        'Application Support',
        'firecrawl-cli'
      );
    case 'win32':
      return path.join(homeDir, 'AppData', 'Roaming', 'firecrawl-cli');
    default:
      return path.join(homeDir, '.config', 'firecrawl-cli');
  }
}

function getSessionPath(): string {
  return path.join(getConfigDir(), 'interact-session.json');
}

function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true, mode: 0o700 });
  }
}

export function saveInteractSession(session: StoredInteractSession): void {
  ensureConfigDir();
  fs.writeFileSync(getSessionPath(), JSON.stringify(session, null, 2), 'utf-8');
}

export function loadInteractSession(): StoredInteractSession | null {
  try {
    const sessionPath = getSessionPath();
    if (!fs.existsSync(sessionPath)) {
      return null;
    }
    return JSON.parse(
      fs.readFileSync(sessionPath, 'utf-8')
    ) as StoredInteractSession;
  } catch {
    return null;
  }
}

export function clearInteractSession(): void {
  try {
    const sessionPath = getSessionPath();
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Resolve scrape ID from explicit override or stored session
 */
export function getScrapeId(overrideId?: string): string {
  if (overrideId) return overrideId;

  const stored = loadInteractSession();
  if (stored) return stored.scrapeId;

  throw new Error(
    'No active scrape session. Scrape a URL first:\n' +
      '  firecrawl scrape https://example.com\n' +
      'Or specify a scrape ID explicitly:\n' +
      '  firecrawl interact <scrape-id> "prompt"'
  );
}

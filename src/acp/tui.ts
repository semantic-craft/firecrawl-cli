/**
 * Firecrawl agent display — clean inline terminal output.
 *
 * Design principles (inspired by Codex CLI):
 * - Show firecrawl operations once, update status in place
 * - Deduplicate repeated calls to the same URL
 * - Group background work into single status lines
 * - Visual separation between agent text and tool execution
 * - Status summary at turn boundaries
 */

import type { ToolCallInfo } from './client';

// ─── Style helpers (TTY-aware) ──────────────────────────────────────────────

const isTTY = process.stderr.isTTY;
const dim = (s: string) => (isTTY ? `\x1b[2m${s}\x1b[0m` : s);
const green = (s: string) => (isTTY ? `\x1b[32m${s}\x1b[0m` : s);
const red = (s: string) => (isTTY ? `\x1b[31m${s}\x1b[0m` : s);
const bold = (s: string) => (isTTY ? `\x1b[1m${s}\x1b[0m` : s);

// ─── Tool call categorization ───────────────────────────────────────────────

type CallKind =
  | 'search'
  | 'scrape'
  | 'map'
  | 'crawl'
  | 'extract'
  | 'write'
  | 'background';

interface CallDescription {
  label: string;
  kind: CallKind;
  dedupeKey: string; // for deduplication (e.g., URL)
}

function extractUrl(cmd: string, prefix: string): string | null {
  const quoted = cmd.match(
    new RegExp(`${prefix}\\s+["'](https?://[^"']+)["']`)
  );
  if (quoted) return quoted[1];
  const parts = cmd.replace(new RegExp(`^${prefix}\\s*`), '').split(/\s+/);
  for (const part of parts) {
    const clean = part.replace(/^["']|["']$/g, '');
    if (clean.startsWith('http')) return clean;
  }
  return null;
}

function categorizeCall(
  call: ToolCallInfo,
  sessionDir: string
): CallDescription | null {
  const input = call.rawInput as Record<string, unknown> | undefined;
  const title = call.title.toLowerCase();

  if (input?.command && typeof input.command === 'string') {
    const cmd = input.command.trim();

    if (cmd.startsWith('firecrawl search')) {
      const match = cmd.match(/firecrawl search\s+["']([^"']+)["']/);
      const query = match ? match[1] : 'web';
      return {
        label: `Searching "${query}"`,
        kind: 'search',
        dedupeKey: `search:${query}`,
      };
    }
    if (cmd.startsWith('firecrawl scrape')) {
      const url = extractUrl(cmd, 'firecrawl scrape');
      if (!url) return null;
      return {
        label: `Scraping ${url}`,
        kind: 'scrape',
        dedupeKey: `scrape:${url}`,
      };
    }
    if (cmd.startsWith('firecrawl map')) {
      const url = extractUrl(cmd, 'firecrawl map');
      if (!url) return null;
      return { label: `Mapping ${url}`, kind: 'map', dedupeKey: `map:${url}` };
    }
    if (cmd.startsWith('firecrawl crawl')) {
      const url = extractUrl(cmd, 'firecrawl crawl');
      if (!url) return null;
      return {
        label: `Crawling ${url}`,
        kind: 'crawl',
        dedupeKey: `crawl:${url}`,
      };
    }
    if (cmd.startsWith('firecrawl agent')) {
      return {
        label: 'Running extraction agent',
        kind: 'extract',
        dedupeKey: 'extract',
      };
    }
    if (cmd.includes(sessionDir)) {
      return {
        label: 'Writing output',
        kind: 'write',
        dedupeKey: 'write-session',
      };
    }
    // All other commands are background
    return null;
  }

  // File writes to session dir
  if (input?.path && typeof input.path === 'string') {
    if (input.path.startsWith(sessionDir) && title.includes('write')) {
      const basename = input.path.split('/').pop() || input.path;
      return {
        label: `Writing ${basename}`,
        kind: 'write',
        dedupeKey: `write:${basename}`,
      };
    }
    return null;
  }

  return null;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export interface TUIHandle {
  onText: (text: string) => void;
  onToolCall: (call: ToolCallInfo) => void;
  onToolCallUpdate: (call: ToolCallInfo) => void;
  addCredits: (n: number) => void;
  printStatus: () => void;
  pause: () => void;
  resume: () => void;
  cleanup: () => void;
}

export function startTUI(opts: {
  sessionId: string;
  agentName: string;
  format: string;
  sessionDir: string;
}): TUIHandle {
  // Track calls by ID → description
  const calls = new Map<string, CallDescription>();
  // Track which dedupe keys we've already printed (to avoid duplicate lines)
  const printed = new Set<string>();
  // Track completed dedupe keys
  const completed = new Set<string>();

  let credits = 0;
  const startedAt = Date.now();
  let lastOutputWasText = false;
  let backgroundShown = false;

  function elapsed(): string {
    const secs = Math.round((Date.now() - startedAt) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  function statusLine(): string {
    const fmt = opts.format.toUpperCase();
    return dim(
      `── ${opts.sessionId} · ${opts.agentName} · ${credits} credits · ${elapsed()} · ${fmt}`
    );
  }

  function ensureNewSection() {
    if (lastOutputWasText) {
      lastOutputWasText = false;
    }
  }

  return {
    onText(text: string) {
      // If we were showing tool calls and now getting text, add spacing
      if (!lastOutputWasText && printed.size > 0) {
        process.stdout.write('\n');
      }
      process.stdout.write(text);
      lastOutputWasText = true;
      backgroundShown = false;
    },

    onToolCall(call: ToolCallInfo) {
      const desc = categorizeCall(call, opts.sessionDir);
      if (!desc) {
        // Background work — show a single "Working..." if we haven't yet
        if (!backgroundShown && lastOutputWasText) {
          // Don't print anything for background — the agent text provides context
        }
        return;
      }

      calls.set(call.id, desc);

      // Deduplicate: don't print if we already showed this exact operation
      if (printed.has(desc.dedupeKey)) return;
      printed.add(desc.dedupeKey);

      ensureNewSection();
      process.stderr.write(`  ${dim('·')} ${desc.label}\n`);
    },

    onToolCallUpdate(call: ToolCallInfo) {
      const desc = calls.get(call.id);
      if (!desc) return;

      if (call.status === 'completed' || call.status === 'errored') {
        calls.delete(call.id);

        // Only print completion if we haven't already for this dedupe key
        if (completed.has(desc.dedupeKey)) return;
        completed.add(desc.dedupeKey);

        const icon = call.status === 'completed' ? green('✓') : red('✗');
        process.stderr.write(`  ${icon} ${desc.label}\n`);
      }
    },

    addCredits(n: number) {
      credits += n;
    },

    printStatus() {
      process.stderr.write(`\n${statusLine()}\n\n`);
    },

    pause() {
      process.stderr.write(`\n${statusLine()}\n`);
      lastOutputWasText = false;
    },

    resume() {
      // Reset dedup for next turn — same URLs may be re-scraped intentionally
      printed.clear();
      completed.clear();
      backgroundShown = false;
      lastOutputWasText = false;
    },

    cleanup() {
      process.stderr.write(`\n${statusLine()}\n`);
    },
  };
}

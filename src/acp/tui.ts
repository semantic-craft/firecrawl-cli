/**
 * Firecrawl agent display — inline terminal output, no ANSI tricks.
 *
 * Shows firecrawl operations prominently, background operations dimmed,
 * and status summaries at natural breakpoints.
 * Works in any terminal, pipeable, agent-friendly.
 */

import type { ToolCallInfo } from './client';

// ─── Style helpers (only if TTY) ────────────────────────────────────────────

const isTTY = process.stderr.isTTY;
const dim = (s: string) => (isTTY ? `\x1b[2m${s}\x1b[0m` : s);
const green = (s: string) => (isTTY ? `\x1b[32m${s}\x1b[0m` : s);
const red = (s: string) => (isTTY ? `\x1b[31m${s}\x1b[0m` : s);
const cyan = (s: string) => (isTTY ? `\x1b[36m${s}\x1b[0m` : s);

// ─── Tool call categorization ───────────────────────────────────────────────

interface CallDescription {
  label: string;
  prominent: boolean; // firecrawl ops = prominent, background work = dimmed
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

function describeCall(
  call: ToolCallInfo,
  sessionDir: string
): CallDescription | null {
  const input = call.rawInput as Record<string, unknown> | undefined;
  const title = call.title.toLowerCase();

  // ── Terminal / Bash commands ───────────────────────────────────────────
  if (input?.command && typeof input.command === 'string') {
    const cmd = input.command.trim();

    // Firecrawl commands — prominent
    if (cmd.startsWith('firecrawl search')) {
      const match = cmd.match(/firecrawl search\s+["']([^"']+)["']/);
      return {
        label: match ? `Searching "${match[1]}"` : 'Searching',
        prominent: true,
      };
    }
    if (cmd.startsWith('firecrawl scrape')) {
      const url = extractUrl(cmd, 'firecrawl scrape');
      return url ? { label: `Scraping ${url}`, prominent: true } : null;
    }
    if (cmd.startsWith('firecrawl map')) {
      const url = extractUrl(cmd, 'firecrawl map');
      return url ? { label: `Mapping ${url}`, prominent: true } : null;
    }
    if (cmd.startsWith('firecrawl crawl')) {
      const url = extractUrl(cmd, 'firecrawl crawl');
      return url ? { label: `Crawling ${url}`, prominent: true } : null;
    }
    if (cmd.startsWith('firecrawl agent')) {
      return { label: 'Running extraction agent', prominent: true };
    }
    if (cmd.startsWith('firecrawl')) {
      return { label: 'Running firecrawl', prominent: true };
    }

    // Python / processing scripts — background
    if (cmd.includes('python')) {
      return { label: 'Processing data', prominent: false };
    }

    // Writing to session dir — prominent
    if (cmd.includes(sessionDir)) {
      return { label: 'Writing output', prominent: true };
    }

    // Everything else is background
    return { label: 'Processing', prominent: false };
  }

  // ── File operations ───────────────────────────────────────────────────
  if (input?.path && typeof input.path === 'string') {
    if (input.path.startsWith(sessionDir) && title.includes('write')) {
      const basename = input.path.split('/').pop() || input.path;
      return { label: `Writing ${basename}`, prominent: true };
    }
    if (title.includes('read')) {
      return { label: 'Reading sources', prominent: false };
    }
    return null;
  }

  // ── Agent/Task spawning ───────────────────────────────────────────────
  if (title.includes('task') || title.includes('agent')) {
    return { label: 'Spawning agents', prominent: false };
  }

  // ── Tool search / setup ───────────────────────────────────────────────
  if (title.includes('toolsearch') || title.includes('tool')) {
    return { label: 'Setting up tools', prominent: false };
  }

  // ── Search / grep ─────────────────────────────────────────────────────
  if (title.includes('grep') || title.includes('search')) {
    return { label: 'Analyzing data', prominent: false };
  }

  // ── Catch-all for anything else ───────────────────────────────────────
  return { label: 'Working', prominent: false };
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
  const pending = new Map<string, { label: string; prominent: boolean }>();
  let credits = 0;
  const startedAt = Date.now();

  // Collapse repeated dim labels (avoid 10x "Processing" lines)
  let lastDimLabel = '';

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

  return {
    onText(text: string) {
      // Reset dim dedup when agent writes text (new section)
      lastDimLabel = '';
      process.stdout.write(text);
    },

    onToolCall(call: ToolCallInfo) {
      const desc = describeCall(call, opts.sessionDir);
      if (!desc) return;
      pending.set(call.id, desc);

      if (desc.prominent) {
        // Firecrawl operations — always show
        lastDimLabel = '';
        process.stderr.write(`  ${dim('·')} ${desc.label}\n`);
      } else {
        // Background work — show once per label to avoid spam
        if (desc.label !== lastDimLabel) {
          lastDimLabel = desc.label;
          process.stderr.write(`  ${dim('· ' + desc.label)}\n`);
        }
      }
    },

    onToolCallUpdate(call: ToolCallInfo) {
      const desc = pending.get(call.id);
      if (!desc) return;
      if (call.status === 'completed' || call.status === 'errored') {
        pending.delete(call.id);
        // Only print done for prominent calls
        if (desc.prominent) {
          const icon = call.status === 'completed' ? green('✓') : red('✗');
          process.stderr.write(`  ${icon} ${desc.label}\n`);
        }
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
      lastDimLabel = '';
    },

    resume() {
      lastDimLabel = '';
    },

    cleanup() {
      process.stderr.write(`\n${statusLine()}\n`);
    },
  };
}

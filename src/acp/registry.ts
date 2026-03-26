/**
 * ACP agent registry — detect installed ACP-compatible agents.
 */

import { execSync } from 'child_process';

export interface ACPAgent {
  name: string;
  bin: string;
  displayName: string;
  available: boolean;
}

const KNOWN_AGENTS: Omit<ACPAgent, 'available'>[] = [
  { name: 'claude', bin: 'claude', displayName: 'Claude Code' },
  { name: 'codex', bin: 'codex', displayName: 'Codex' },
  { name: 'gemini', bin: 'gemini', displayName: 'Gemini CLI' },
  { name: 'opencode', bin: 'opencode', displayName: 'OpenCode' },
  { name: 'goose', bin: 'goose', displayName: 'Goose' },
  { name: 'kimi', bin: 'kimi', displayName: 'Kimi CLI' },
  { name: 'augment', bin: 'augment', displayName: 'Augment Code' },
  { name: 'cursor', bin: 'cursor', displayName: 'Cursor' },
  { name: 'copilot', bin: 'github-copilot', displayName: 'GitHub Copilot' },
];

function isBinAvailable(bin: string): boolean {
  try {
    execSync(`which ${bin}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function detectAgents(): ACPAgent[] {
  return KNOWN_AGENTS.map((a) => ({
    ...a,
    available: isBinAvailable(a.bin),
  }));
}

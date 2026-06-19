import { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { installMcp } from './setup';

export interface LaunchOptions {
  config?: boolean;
  install?: boolean;
  setup?: boolean;
  global?: boolean;
  yes?: boolean;
  skipMcp?: boolean;
}

interface LaunchTarget {
  aliases: string[];
  displayName: string;
  mcpAgent: string;
  command: string;
  args?: string[];
  fallbackCommand?: () => { command: string; args: string[] } | null;
}

const TARGETS: LaunchTarget[] = [
  {
    aliases: ['claude', 'claude-code'],
    displayName: 'Claude Code',
    mcpAgent: 'claude-code',
    command: 'claude',
    fallbackCommand: () => {
      const localClaude = path.join(os.homedir(), '.claude', 'local', 'claude');
      return existsSync(localClaude)
        ? { command: localClaude, args: [] }
        : null;
    },
  },
  {
    aliases: ['code', 'vscode', 'vs-code'],
    displayName: 'VS Code',
    mcpAgent: 'vscode',
    command: 'code',
    args: ['.'],
    fallbackCommand: () => {
      if (process.platform !== 'darwin') return null;
      return {
        command: 'open',
        args: ['-a', 'Visual Studio Code', process.cwd()],
      };
    },
  },
  {
    aliases: ['codex'],
    displayName: 'Codex',
    mcpAgent: 'codex',
    command: 'codex',
  },
  {
    aliases: ['opencode', 'open-code'],
    displayName: 'OpenCode',
    mcpAgent: 'opencode',
    command: 'opencode',
  },
];

function findTarget(name: string): LaunchTarget | undefined {
  const normalized = name.trim().toLowerCase();
  return TARGETS.find((target) => target.aliases.includes(normalized));
}

function commandExists(command: string): boolean {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' });
  return (
    !result.error || (result.error as NodeJS.ErrnoException).code !== 'ENOENT'
  );
}

function resolveLaunchCommand(
  target: LaunchTarget,
  extraArgs: string[]
): { command: string; args: string[] } {
  if (commandExists(target.command)) {
    return {
      command: target.command,
      args: [...(target.args || []), ...extraArgs],
    };
  }

  const fallback = target.fallbackCommand?.();
  if (fallback) {
    return {
      command: fallback.command,
      args: [...fallback.args, ...extraArgs],
    };
  }

  throw new Error(
    `${target.displayName} is not installed or its command was not found on PATH.`
  );
}

export async function handleLaunchCommand(
  targetName: string,
  options: LaunchOptions = {},
  extraArgs: string[] = []
): Promise<void> {
  const target = findTarget(targetName);
  if (!target) {
    const supported = TARGETS.flatMap((candidate) => candidate.aliases)
      .filter((alias, index, aliases) => aliases.indexOf(alias) === index)
      .join(', ');
    throw new Error(
      `Unknown launch target "${targetName}". Supported: ${supported}`
    );
  }

  if (!options.skipMcp) {
    await installMcp({
      agent: target.mcpAgent,
      global: options.global !== false,
      yes: options.yes ?? true,
    });
  }

  if (options.config || options.install || options.setup) {
    console.log(`${target.displayName} is configured with Firecrawl MCP.`);
    return;
  }

  const launch = resolveLaunchCommand(target, extraArgs);
  const result = spawnSync(launch.command, launch.args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }
  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

/**
 * Setup command implementation
 * Installs firecrawl skill files and MCP server into AI coding agents
 */

import { execSync } from 'child_process';
import { detectAgents, type AgentId } from '../utils/agents';
import { getApiKey } from '../utils/config';
import {
  buildSkillsInstallArgs,
  cleanNpmEnv,
  SKILL_REPOS,
  WORKFLOW_SKILL_REPOS,
} from './skills-install';
import { hasNpx, installSkillsNative } from './skills-native';

export type SetupSubcommand = 'skills' | 'workflows' | 'mcp';

export interface SetupOptions {
  global?: boolean;
  agent?: string;
}

export interface McpInstallOptions extends SetupOptions {
  apiKey?: string;
  includeNpxYes?: boolean;
  yes?: boolean;
  agents?: string[];
}

const ADD_MCP_AGENT_IDS: Partial<Record<AgentId, string>> = {
  cursor: 'cursor',
  'claude-code': 'claude-code',
  'claude-desktop': 'claude-desktop',
  vscode: 'vscode',
  windsurf: 'windsurf',
  codex: 'codex',
};

/**
 * Main setup command handler
 */
export async function handleSetupCommand(
  subcommand: SetupSubcommand,
  options: SetupOptions = {}
): Promise<void> {
  switch (subcommand) {
    case 'skills':
      await installSkills(options, SKILL_REPOS);
      break;
    case 'workflows':
      await installSkills(options, WORKFLOW_SKILL_REPOS);
      break;
    case 'mcp':
      await handleInstallMcp(options);
      break;
    default:
      console.error(`Unknown setup subcommand: ${subcommand}`);
      console.log('\nAvailable subcommands:');
      console.log(
        '  skills     Install core/build Firecrawl skills into AI coding agents'
      );
      console.log(
        '  workflows  Install Firecrawl workflow skills into AI coding agents'
      );
      console.log(
        '  mcp        Install firecrawl MCP server into editors (Cursor, Claude Code, VS Code, etc.)'
      );
      process.exit(1);
  }
}

async function installSkills(
  options: SetupOptions,
  repos: readonly string[]
): Promise<void> {
  for (const repo of repos) {
    if (hasNpx()) {
      const args = buildSkillsInstallArgs({
        repo,
        agent: options.agent,
        global: true,
        includeNpxYes: true,
      });

      const cmd = args.join(' ');
      console.log(`Running: ${cmd}\n`);

      try {
        execSync(cmd, { stdio: 'inherit', env: cleanNpmEnv() });
        continue;
      } catch {
        process.exit(1);
      }
    }

    // Fallback: native install (no npx/Node required)
    try {
      await installSkillsNative(repo);
    } catch (error) {
      console.error(
        `Failed to install skills from ${repo}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      process.exit(1);
    }
  }
}

export function buildMcpInstallArgs(options: McpInstallOptions = {}): string[] {
  const args = ['npx'];

  if (options.includeNpxYes) {
    args.push('-y');
  }

  args.push('add-mcp', '"npx -y firecrawl-mcp"', '--name', 'firecrawl');

  if (options.global ?? true) {
    args.push('--global');
  }

  if (options.agent) {
    args.push('--agent', options.agent);
  } else if (options.agents) {
    for (const agent of options.agents) {
      args.push('--agent', agent);
    }
  }

  if (options.yes) {
    args.push('--yes');
  }

  return args;
}

export async function installMcp(options: McpInstallOptions): Promise<void> {
  const apiKey = options.apiKey ?? getApiKey();
  if (!apiKey) {
    throw new Error(
      'No API key found. Please run `firecrawl login` first, or set FIRECRAWL_API_KEY.'
    );
  }

  const detectedAgents =
    options.agent || options.agents
      ? options.agents
      : (await detectAgents())
          .filter((agent) => agent.installed)
          .map((agent) => ADD_MCP_AGENT_IDS[agent.id])
          .filter((agent): agent is string => Boolean(agent));

  if (!options.agent && (!detectedAgents || detectedAgents.length === 0)) {
    throw new Error(
      'No supported AI coding agents detected. Install an agent first, or run `firecrawl setup mcp --agent <agent>`.'
    );
  }

  const args = buildMcpInstallArgs({
    ...options,
    agents: detectedAgents,
  });
  const cmd = args.join(' ');
  console.log(`Running: ${cmd}\n`);

  execSync(cmd, {
    stdio: 'inherit',
    env: { ...cleanNpmEnv(), FIRECRAWL_API_KEY: apiKey },
  });
}

async function handleInstallMcp(options: SetupOptions): Promise<void> {
  try {
    await installMcp(options);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unknown MCP error');
    process.exit(1);
  }
}

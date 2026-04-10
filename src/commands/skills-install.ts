/**
 * Repos to pull skills from during install.
 *
 * - firecrawl/cli: core CLI skills bundled with this repo
 * - firecrawl/skills: additional "build" skills for working with Firecrawl
 *
 * Both are installed during `firecrawl init` and `firecrawl setup skills`.
 */
export const SKILL_REPOS = ['firecrawl/cli', 'firecrawl/skills'] as const;

export interface SkillsInstallCommandOptions {
  agent?: string;
  all?: boolean;
  yes?: boolean;
  global?: boolean;
  includeNpxYes?: boolean;
  /** Repo to install from (defaults to firecrawl/cli) */
  repo?: string;
}

export function buildSkillsInstallArgs(
  options: SkillsInstallCommandOptions = {}
): string[] {
  const args = ['npx'];

  if (options.includeNpxYes) {
    args.push('-y');
  }

  args.push('skills', 'add', options.repo ?? 'firecrawl/cli', '--full-depth');

  if (options.global ?? true) {
    args.push('--global');
  }

  const installToAllAgents = options.agent ? false : (options.all ?? true);
  if (installToAllAgents) {
    args.push('--all');
  }

  if (options.yes) {
    args.push('--yes');
  }

  if (options.agent) {
    args.push('--agent', options.agent);
  }

  return args;
}

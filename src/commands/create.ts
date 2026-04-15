/**
 * `firecrawl create` command — scaffolds Firecrawl starter projects.
 *
 * Hidden from --help until `firecrawl-agent-cli` is published to npm.
 * Once visible, the command tree will grow to include additional kinds
 * (scrape, browser, ai, app). For now, `agent` is the only kind.
 *
 * Implementation is a thin delegator: `firecrawl create agent ...` execs
 * `npx -y firecrawl-agent-cli create ...` and passes all flags through.
 * This avoids vendoring the scaffold code in the root CLI; the agent repo
 * remains the single source of truth for templates and the manifest.
 */

import { Command } from 'commander';
import { spawn } from 'child_process';

/** npm package name of the Firecrawl Agent CLI (bin: `firecrawl-agent`). */
const AGENT_CLI_PACKAGE = 'firecrawl-agent-cli';

/**
 * Execute `npx -y <AGENT_CLI_PACKAGE> create ...` with inherited stdio so
 * the agent CLI's interactive prompts render in the user's terminal.
 * Resolves with the child exit code; callers forward it to `process.exit`.
 */
function runAgentCli(args: string[]): Promise<number> {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  return new Promise((resolve) => {
    const child = spawn(npx, ['-y', AGENT_CLI_PACKAGE, 'create', ...args], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', (err) => {
      console.error(
        `\nFailed to launch ${AGENT_CLI_PACKAGE} via npx:`,
        err.message
      );
      console.error(
        `\n  Install it directly and retry: npm install -g ${AGENT_CLI_PACKAGE}\n`
      );
      resolve(1);
    });
  });
}

function collect(val: string, acc: string[]): string[] {
  acc.push(val);
  return acc;
}

/**
 * Build the `agent` subcommand. Flag surface mirrors `firecrawl-agent create`
 * exactly — anything the downstream CLI accepts is passed through verbatim.
 */
function createAgentSubcommand(): Command {
  return new Command('agent')
    .description(
      'Scaffold a Firecrawl Agent project (defaults to the Next.js template)'
    )
    .argument('[project-name]', 'Project directory name')
    .option(
      '-t, --template <id>',
      'Template variant (next, express, library)',
      'next'
    )
    .option(
      '--provider <id>',
      'Orchestrator model provider (anthropic, openai, google, gateway, custom-openai)'
    )
    .option('--model <id>', 'Orchestrator model ID')
    .option(
      '--sub-agent-provider <id>',
      'Sub-agent model provider (defaults to orchestrator)'
    )
    .option(
      '--sub-agent-model <id>',
      'Sub-agent model ID (defaults to orchestrator)'
    )
    .option(
      '--from <source>',
      'External repo (user/repo) or local path with agent-manifest.json'
    )
    .option('--api-key <key>', 'Firecrawl API key')
    .option(
      '--key <provider=key>',
      'Provider API key (repeatable, e.g. --key anthropic=sk-...)',
      collect,
      []
    )
    .option('--skip-install', 'Skip npm install')
    .allowUnknownOption() // Forward future flags without requiring a CLI update
    .action(
      async (
        projectName: string | undefined,
        options: Record<string, unknown>,
        cmd: Command
      ) => {
        const args: string[] = [];
        if (projectName) args.push(projectName);

        // Pass through known options. Commander camelCases hyphenated flags,
        // so we map back to the CLI-facing kebab-case form.
        const flagMap: Array<[string, string]> = [
          ['template', '-t'],
          ['provider', '--provider'],
          ['model', '--model'],
          ['subAgentProvider', '--sub-agent-provider'],
          ['subAgentModel', '--sub-agent-model'],
          ['from', '--from'],
          ['apiKey', '--api-key'],
        ];
        for (const [optKey, flag] of flagMap) {
          const val = options[optKey];
          if (typeof val === 'string' && val.length > 0) args.push(flag, val);
        }

        // --key is repeatable
        const keys = options.key;
        if (Array.isArray(keys)) {
          for (const k of keys) {
            if (typeof k === 'string' && k.length > 0) args.push('--key', k);
          }
        }

        if (options.skipInstall) args.push('--skip-install');

        // Forward any unknown/forward-compatible options verbatim.
        const passthrough = cmd.args.slice(projectName ? 1 : 0);
        for (const extra of passthrough) args.push(extra);

        const code = await runAgentCli(args);
        if (code !== 0) process.exit(code);
      }
    );
}

/**
 * Top-level `firecrawl create` command. For now it only wires the `agent`
 * subcommand; future kinds (scrape, browser, ai, app) register here.
 */
export function createCreateCommand(): Command {
  const cmd = new Command('create').description(
    'Scaffold a Firecrawl starter project'
  );

  cmd.addCommand(createAgentSubcommand());

  return cmd;
}

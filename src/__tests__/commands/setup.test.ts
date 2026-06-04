import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execSync } from 'child_process';
import { handleSetupCommand } from '../../commands/setup';
import { initializeConfig, resetConfig } from '../../utils/config';
import { detectAgents } from '../../utils/agents';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('../../utils/agents', () => ({
  detectAgents: vi.fn(),
}));

describe('handleSetupCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetConfig();
    vi.mocked(detectAgents).mockResolvedValue([
      {
        id: 'cursor',
        name: 'Cursor',
        installed: true,
        mcpRegistered: false,
        configPaths: [],
      },
      {
        id: 'codex',
        name: 'Codex',
        installed: true,
        mcpRegistered: false,
        configPaths: [],
      },
      {
        id: 'continue',
        name: 'Continue',
        installed: true,
        mcpRegistered: false,
        configPaths: [],
      },
    ]);
  });

  afterEach(() => {
    resetConfig();
    vi.restoreAllMocks();
  });

  it('installs core and build skills globally across all detected agents by default', async () => {
    await handleSetupCommand('skills', {});

    expect(execSync).toHaveBeenCalledWith(
      'npx -y skills add firecrawl/cli --full-depth --global --all',
      expect.objectContaining({ stdio: 'inherit' })
    );
    expect(execSync).toHaveBeenCalledWith(
      'npx -y skills add firecrawl/skills --full-depth --global --all',
      expect.objectContaining({ stdio: 'inherit' })
    );
  });

  it('installs core and build skills globally for a specific agent without using --all', async () => {
    await handleSetupCommand('skills', { agent: 'cursor' });

    expect(execSync).toHaveBeenCalledWith(
      'npx -y skills add firecrawl/cli --full-depth --global --agent cursor',
      expect.objectContaining({ stdio: 'inherit' })
    );
    expect(execSync).toHaveBeenCalledWith(
      'npx -y skills add firecrawl/skills --full-depth --global --agent cursor',
      expect.objectContaining({ stdio: 'inherit' })
    );
  });

  it('installs workflow skills as a separate setup option', async () => {
    await handleSetupCommand('workflows', {});

    expect(execSync).toHaveBeenCalledWith(
      'npx -y skills add firecrawl/firecrawl-workflows --full-depth --global --all',
      expect.objectContaining({ stdio: 'inherit' })
    );
  });

  it('installs MCP globally across supported detected agents by default', async () => {
    initializeConfig({ apiKey: 'fc-test' });

    await handleSetupCommand('mcp', {});

    expect(execSync).toHaveBeenCalledWith(
      'npx add-mcp "npx -y firecrawl-mcp" --name firecrawl --global --agent cursor --agent codex',
      expect.objectContaining({
        stdio: 'inherit',
        env: expect.objectContaining({ FIRECRAWL_API_KEY: 'fc-test' }),
      })
    );
  });

  it('installs MCP for a specific agent without using --all', async () => {
    initializeConfig({ apiKey: 'fc-test' });

    await handleSetupCommand('mcp', { agent: 'cursor' });

    expect(execSync).toHaveBeenCalledWith(
      'npx add-mcp "npx -y firecrawl-mcp" --name firecrawl --global --agent cursor',
      expect.objectContaining({
        stdio: 'inherit',
        env: expect.objectContaining({ FIRECRAWL_API_KEY: 'fc-test' }),
      })
    );
  });

  it('fails MCP install when no supported agents are detected', async () => {
    vi.mocked(detectAgents).mockResolvedValue([]);
    initializeConfig({ apiKey: 'fc-test' });
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(handleSetupCommand('mcp', {})).rejects.toThrow('exit');

    expect(execSync).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      'No supported AI coding agents detected. Install an agent first, or run `firecrawl setup mcp --agent <agent>`.'
    );
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('strips inherited npm_* env vars before nested npx calls', async () => {
    // Reproduces the bug where running this CLI under `npx -y firecrawl-cli@VERSION`
    // leaks npm_command/npm_lifecycle_event/npm_execpath into nested
    // `npx -y skills add` calls and causes the second iteration to silently
    // not run. Without stripping, only the first repo gets installed.
    const restore = {
      npm_command: process.env.npm_command,
      npm_lifecycle_event: process.env.npm_lifecycle_event,
      npm_execpath: process.env.npm_execpath,
      INIT_CWD: process.env.INIT_CWD,
    };
    process.env.npm_command = 'exec';
    process.env.npm_lifecycle_event = 'npx';
    process.env.npm_execpath = '/fake/npm-cli.js';
    process.env.INIT_CWD = '/fake/init-cwd';

    try {
      await handleSetupCommand('skills', {});

      const allCalls = (
        execSync as unknown as {
          mock: { calls: [string, { env?: NodeJS.ProcessEnv }][] };
        }
      ).mock.calls;
      const installCalls = allCalls.filter(([cmd]) =>
        cmd.includes('skills add')
      );
      expect(installCalls.length).toBe(2);
      for (const [, opts] of installCalls) {
        expect(opts.env).toBeDefined();
        expect(opts.env!.npm_command).toBeUndefined();
        expect(opts.env!.npm_lifecycle_event).toBeUndefined();
        expect(opts.env!.npm_execpath).toBeUndefined();
        expect(opts.env!.INIT_CWD).toBeUndefined();
      }
    } finally {
      for (const [k, v] of Object.entries(restore)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });
});

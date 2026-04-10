import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execSync } from 'child_process';
import { handleSetupCommand } from '../../commands/setup';

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('handleSetupCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('installs skills globally across all detected agents from both repos by default', async () => {
    await handleSetupCommand('skills', {});

    expect(execSync).toHaveBeenCalledWith(
      'npx -y skills add firecrawl/cli --full-depth --global --all',
      { stdio: 'inherit' }
    );
    expect(execSync).toHaveBeenCalledWith(
      'npx -y skills add firecrawl/skills --full-depth --global --all',
      { stdio: 'inherit' }
    );
  });

  it('installs skills globally for a specific agent from both repos without using --all', async () => {
    await handleSetupCommand('skills', { agent: 'cursor' });

    expect(execSync).toHaveBeenCalledWith(
      'npx -y skills add firecrawl/cli --full-depth --global --agent cursor',
      { stdio: 'inherit' }
    );
    expect(execSync).toHaveBeenCalledWith(
      'npx -y skills add firecrawl/skills --full-depth --global --agent cursor',
      { stdio: 'inherit' }
    );
  });
});

/**
 * Agent signup command implementation
 * Allows AI agents to create a Firecrawl account on behalf of a user,
 * granting 50 free credits with a sandboxed API key.
 * The user receives a verification email to confirm or block the key.
 */

import * as readline from 'readline';
import { saveCredentials } from '../utils/credentials';
import { updateConfig, getApiKey } from '../utils/config';
import { isAuthenticated, printBanner } from '../utils/auth';

const DEFAULT_API_URL = 'https://api.firecrawl.dev';
const TOS_URL = 'https://firecrawl.dev/terms-of-service';
const CREDIT_LIMIT = 50;

export interface SignupOptions {
  email?: string;
  agentName?: string;
  acceptTerms?: boolean;
  apiUrl?: string;
  json?: boolean;
}

interface AgentSignupResponse {
  success: boolean;
  api_key?: string;
  sponsor_status?: string;
  credit_limit?: number;
  credits_remaining?: number;
  verification_deadline_at?: string;
  tos_url?: string;
  error?: string;
  login_url?: string;
}

function promptInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function detectAgentName(): string {
  const termProgram = process.env.TERM_PROGRAM?.toLowerCase();
  if (termProgram?.includes('cursor')) return 'Cursor';
  if (termProgram?.includes('windsurf')) return 'Windsurf';
  if (termProgram?.includes('vscode')) return 'VS Code';
  if (termProgram?.includes('zed')) return 'Zed';

  if (process.env.CODEX_HOME) return 'Codex';
  if (
    process.env.AIDER_MODEL ||
    process.env.AIDER_WEAK_MODEL ||
    process.env.AIDER_EDITOR_MODEL
  )
    return 'Aider';
  if (
    process.env.OPENCODE_CONFIG ||
    process.env.OPENCODE_CONFIG_DIR ||
    process.env.OPENCODE_CONFIG_CONTENT
  )
    return 'OpenCode';
  if (
    process.env.GEMINI_CLI_SYSTEM_DEFAULTS_PATH ||
    process.env.GEMINI_CLI_SYSTEM_SETTINGS_PATH
  )
    return 'Gemini CLI';

  return 'CLI Agent';
}

/**
 * Main signup command handler
 */
export async function handleSignupCommand(
  options: SignupOptions = {}
): Promise<void> {
  const apiUrl = options.apiUrl?.replace(/\/$/, '') || DEFAULT_API_URL;
  const orange = '\x1b[38;5;208m';
  const reset = '\x1b[0m';
  const dim = '\x1b[2m';
  const bold = '\x1b[1m';
  const green = '\x1b[32m';

  if (isAuthenticated()) {
    const existingKey = getApiKey();
    console.log('You are already authenticated.');
    console.log(
      `\nAPI key: ${dim}${existingKey?.slice(0, 8)}...${existingKey?.slice(-4)}${reset}`
    );
    console.log('\nTo use a different account, run:');
    console.log('  firecrawl logout');
    console.log('  firecrawl signup');
    return;
  }

  printBanner();

  console.log(
    `${bold}Agent Signup${reset} — Create a Firecrawl account with ${orange}${CREDIT_LIMIT} free credits${reset}\n`
  );
  console.log(
    `${dim}A verification email will be sent so the account owner can confirm or revoke access.${reset}\n`
  );

  // Get email
  let email = options.email;
  if (!email) {
    email = await promptInput('Email address: ');
    if (!email || email.length === 0) {
      console.error('Error: Email address is required.');
      process.exit(1);
    }
  }

  // Basic email validation
  if (!email.includes('@') || !email.includes('.')) {
    console.error('Error: Invalid email address.');
    process.exit(1);
  }

  // Get agent name
  let agentName = options.agentName;
  if (!agentName) {
    const detected = detectAgentName();
    agentName = detected;
    console.log(`${dim}Agent: ${detected}${reset}`);
  }

  // Terms acceptance
  if (!options.acceptTerms) {
    console.log(`\n${dim}Terms of Service: ${TOS_URL}${reset}`);
    const acceptance = await promptInput(
      'Do you accept the Terms of Service? [Y/n]: '
    );
    if (acceptance.toLowerCase() === 'n' || acceptance.toLowerCase() === 'no') {
      console.log(
        '\nYou must accept the Terms of Service to create an account.'
      );
      process.exit(1);
    }
  }

  // Call the API
  console.log(`\n${dim}Creating account...${reset}`);

  try {
    const response = await fetch(`${apiUrl}/v2/agent-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        agent_name: agentName,
        accept_terms: true,
      }),
    });

    const data = (await response.json()) as AgentSignupResponse;

    if (options.json) {
      console.log(JSON.stringify(data, null, 2));
      if (data.success && data.api_key) {
        saveCredentials({ apiKey: data.api_key, apiUrl });
        updateConfig({ apiKey: data.api_key, apiUrl });
      }
      return;
    }

    if (!response.ok || !data.success) {
      if (response.status === 409) {
        console.error(`\nA pending signup already exists for this email.`);
        console.log(
          `Check your inbox for the confirmation email, or log in at: ${data.login_url || 'https://firecrawl.dev/signin'}`
        );
        console.log(`\nAlternatively, log in with an existing API key:`);
        console.log(`  firecrawl login`);
        process.exit(1);
      }
      if (response.status === 403) {
        console.error(
          `\n${data.error || 'This email has blocked agent signups.'}`
        );
        console.log(`\nLog in with an existing account instead:`);
        console.log(`  firecrawl login`);
        process.exit(1);
      }
      if (response.status === 429) {
        console.error(
          `\n${data.error || 'Rate limit exceeded. Please try again later.'}`
        );
        process.exit(1);
      }
      console.error(`\nSignup failed: ${data.error || 'Unknown error'}`);
      process.exit(1);
    }

    // Save credentials
    saveCredentials({ apiKey: data.api_key!, apiUrl });
    updateConfig({ apiKey: data.api_key!, apiUrl });

    // Format deadline
    let deadlineStr = '';
    if (data.verification_deadline_at) {
      const deadline = new Date(data.verification_deadline_at);
      deadlineStr = deadline.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    // Success output
    console.log(`\n${green}✓${reset} ${bold}Account created!${reset}\n`);
    console.log(
      `  ${orange}${data.credits_remaining ?? CREDIT_LIMIT}${reset} free credits available`
    );
    console.log(
      `  ${dim}API key: ${data.api_key?.slice(0, 8)}...${data.api_key?.slice(-4)}${reset}`
    );

    console.log(`\n${bold}Next steps:${reset}`);
    console.log(
      `  ${dim}1.${reset} A verification email was sent to ${bold}${email}${reset}`
    );
    console.log(
      `  ${dim}2.${reset} Confirm the email to unlock your full plan`
    );
    if (deadlineStr) {
      console.log(
        `  ${dim}3.${reset} Confirmation expires on ${bold}${deadlineStr}${reset}`
      );
    }

    console.log(`\n${dim}You're ready to go! Try:${reset}`);
    console.log(`  firecrawl scrape https://example.com`);
    console.log(`  firecrawl search "your query"`);
    console.log('');
  } catch (error) {
    if (
      error instanceof TypeError &&
      (error as Error).message.includes('fetch')
    ) {
      console.error(
        '\nError: Could not connect to Firecrawl API. Check your network connection.'
      );
    } else {
      console.error(
        '\nError:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
    process.exit(1);
  }
}

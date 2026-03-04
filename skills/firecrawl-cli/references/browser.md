# browser

Cloud Chromium sessions for interactive pages. Real browser, full control — clicks, scrolls, logins, and everything scrape can't handle.

## When to Use

### Go directly to browser (skip scrape)

- **Cookie consent / age gate walls** — banners that block content until dismissed
- **Infinite scroll** — social feeds, job boards, product listings that load on scroll
- **Content behind expand/collapse** — "Read more", accordions, FAQ toggles, changelogs
- **Known SPA dashboards** — tab/filter navigation that doesn't change the URL
- **Multi-step wizards** — configuration flows, checkout processes, onboarding
- **Terms / age gates** — sites that require accepting terms before showing content
- **Logged-in pages** — use `--profile` to persist auth across sessions

### Escalate from scrape (tried scrape, didn't work)

- Scrape returned a **cookie banner** instead of page content
- Scrape returned only the **first N items** (JS pagination hides the rest)
- Scrape returned **empty/skeleton content** (client-side rendered SPA)
- Scrape returned **collapsed summaries** instead of full text

**Do NOT use for:** static pages (use [`scrape`](scrape.md)), web search (use [`search`](search.md)).

## Why Browser Over Scrape

`browser` runs a real Chromium instance in Firecrawl's cloud. It's a full interactive browser — you see the page structure, click elements, fill forms, scroll, and extract content after interaction. Don't try to use scrape `--actions` (API-only feature) — use `browser` instead.

## Session Lifecycle

- **Auto-launch**: Shorthand commands (`firecrawl browser "open <url>"`) auto-launch a session if none exists
- **Profiles**: `--profile <name>` persists cookies/state across sessions — reconnect later already authenticated
- **TTL**: Sessions auto-close after inactivity. Set with `launch-session --ttl <seconds>`
- **Close**: `firecrawl browser close` ends the session

Profiles are key for logged-in workflows: log in once, save the profile, reconnect days later without re-authenticating.

## Core Commands

| Command                   | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `open <url>`              | Navigate to URL                                |
| `snapshot -i`             | Interactive elements with clickable `@ref` IDs |
| `snapshot`                | Full accessibility tree (all elements)         |
| `screenshot [path]`       | Capture PNG screenshot                         |
| `click <@ref>`            | Click element by ref                           |
| `dblclick <@ref>`         | Double-click element                           |
| `type <@ref> <text>`      | Type into element                              |
| `fill <@ref> <text>`      | Clear and fill a form field                    |
| `press <key>`             | Press key (Enter, Tab, Control+a)              |
| `keyboard type <text>`    | Type text with real keystrokes (no selector)   |
| `hover <@ref>`            | Hover over element                             |
| `check <@ref>`            | Check checkbox                                 |
| `uncheck <@ref>`          | Uncheck checkbox                               |
| `select <@ref> <value>`   | Select dropdown option                         |
| `drag <src> <dst>`        | Drag and drop                                  |
| `upload <@ref> <files>`   | Upload files                                   |
| `scroll <direction> [px]` | Scroll up/down/left/right                      |
| `wait <sel\|ms>`          | Wait for element or time                       |
| `eval <js>`               | Run JavaScript on the page                     |
| `scrape`                  | Extract page content as markdown               |

### Get Info

```
get text <@ref>        Get text content
get html <@ref>        Get HTML
get value <@ref>       Get input value
get attr <name> <@ref> Get attribute
get title              Page title
get url                Current URL
get count <@ref>       Count matching elements
```

### Session Management

| Command                      | Description                   |
| ---------------------------- | ----------------------------- |
| `launch-session --ttl <sec>` | Start session with custom TTL |
| `list [active\|destroyed]`   | List sessions                 |
| `close`                      | Close current session         |

### Navigation

`back`, `forward`, `reload`

## Options Reference

| Option                | Description                            |
| --------------------- | -------------------------------------- |
| `--profile <name>`    | Named profile (persists cookies/state) |
| `--no-save-changes`   | Load profile without saving changes    |
| `-o, --output <path>` | Output file path (default: stdout)     |
| `--json`              | Output as JSON                         |

Launch-session options: `--ttl <seconds>`, `--ttl-inactivity <seconds>`, `--session <id>`, `--stream`

## Examples

### Cookie consent wall

Scrape returns a cookie banner instead of content. Open in browser, dismiss the banner, then extract.

```bash
firecrawl browser "open https://techcrunch.com/2024/01/15/some-article"
firecrawl browser "snapshot -i"                        # find the cookie accept button
firecrawl browser "click @e4"                         # click "Accept All" / consent button
firecrawl browser "wait 1000"                         # let the page render behind the banner
firecrawl browser "scrape" -o .firecrawl/article.md   # now get the actual content
firecrawl browser close
```

### Infinite scroll product listing

Product grids that load more items as you scroll down. Scroll repeatedly to accumulate content, then extract everything.

```bash
firecrawl browser "open https://www.producthunt.com/topics/developer-tools"
firecrawl browser "scroll down 2000"
firecrawl browser "wait 2000"
firecrawl browser "scroll down 2000"
firecrawl browser "wait 2000"
firecrawl browser "scroll down 2000"
firecrawl browser "wait 2000"
firecrawl browser "scrape" -o .firecrawl/devtools-listings.md
firecrawl browser close
```

### SPA with tab navigation

Dashboard where clicking tabs loads different data without changing the URL.

```bash
firecrawl browser "open https://analytics.example.com/dashboard"
firecrawl browser "snapshot -i"                        # find tab elements
firecrawl browser "scrape" -o .firecrawl/dash-overview.md   # default tab
firecrawl browser "click @e22"                        # click "Revenue" tab
firecrawl browser "wait 2000"
firecrawl browser "scrape" -o .firecrawl/dash-revenue.md
firecrawl browser "click @e25"                        # click "Users" tab
firecrawl browser "wait 2000"
firecrawl browser "scrape" -o .firecrawl/dash-users.md
firecrawl browser close
```

### Expanding collapsed content

FAQ pages, changelogs, and docs that hide content behind "Read more" or accordion toggles.

```bash
firecrawl browser "open https://openai.com/policies/usage-policies"
firecrawl browser "snapshot -i"                        # find expand/toggle buttons
# Click all expand buttons to reveal hidden content
firecrawl browser "click @e10"
firecrawl browser "click @e14"
firecrawl browser "click @e18"
firecrawl browser "click @e22"
firecrawl browser "wait 1000"
firecrawl browser "scrape" -o .firecrawl/full-policies.md
firecrawl browser close
```

### Logged-in dashboard extraction

Log in once with a profile, then reconnect later without re-authenticating.

```bash
# First time: log in and save the session
firecrawl browser --profile github "open https://github.com/login"
firecrawl browser "snapshot -i"
firecrawl browser "fill @e3 'user@example.com'"
firecrawl browser "fill @e5 'mypassword'"
firecrawl browser "click @e7"                         # sign in
firecrawl browser "wait 3000"
firecrawl browser "scrape" -o .firecrawl/gh-dashboard.md
firecrawl browser close

# Later: reconnect with saved cookies — already authenticated
firecrawl browser --profile github "open https://github.com/notifications"
firecrawl browser "scrape" -o .firecrawl/gh-notifications.md
firecrawl browser close
```

### Pagination loop

Extract content across multiple pages by clicking Next repeatedly.

```bash
firecrawl browser "open https://news.ycombinator.com"
firecrawl browser "scrape" -o .firecrawl/hn-page1.md
firecrawl browser "snapshot -i"                        # find the "More" link
firecrawl browser "click @e31"                        # click More
firecrawl browser "wait 2000"
firecrawl browser "scrape" -o .firecrawl/hn-page2.md
firecrawl browser "snapshot -i"
firecrawl browser "click @e31"                        # click More again
firecrawl browser "wait 2000"
firecrawl browser "scrape" -o .firecrawl/hn-page3.md
firecrawl browser close
```

## Advanced Capabilities

### Network request inspection

See what APIs the page calls. Sometimes you can grab the raw JSON endpoint directly instead of scraping rendered HTML.

```bash
firecrawl browser "open https://jobs.lever.co/company"
firecrawl browser "network requests --filter api"     # see API calls the page makes
# Found: GET https://api.lever.co/v0/postings/company?mode=json
# Now scrape the API directly — no browser needed for subsequent fetches
firecrawl scrape "https://api.lever.co/v0/postings/company?mode=json" -o .firecrawl/jobs.json
```

### Screenshots at specific states

Capture visual evidence of a page in a particular state.

```bash
firecrawl browser "open https://example.com/pricing"
firecrawl browser "screenshot .firecrawl/pricing-monthly.png"
firecrawl browser "click @e15"                        # toggle to annual pricing
firecrawl browser "wait 1000"
firecrawl browser "screenshot .firecrawl/pricing-annual.png"
```

### Video recording

Record multi-step interactions as video for documentation or debugging.

```bash
firecrawl browser "open https://app.example.com"
firecrawl browser "record start .firecrawl/onboarding.webm"
# ... perform the multi-step flow ...
firecrawl browser "click @e5"
firecrawl browser "wait 1000"
firecrawl browser "fill @e8 'test data'"
firecrawl browser "click @e12"
firecrawl browser "record stop"
```

### Code execution (Playwright & Bash)

Run code directly in the browser sandbox. Three modes: `--node` (Playwright JS), `--python` (Playwright Python), `--bash` (shell in sandbox). The `page`, `browser`, and `context` objects are pre-configured — no setup needed.

```bash
# Playwright JavaScript — click all "Expand" buttons
firecrawl browser execute --node 'const buttons = document.querySelectorAll("button.expand"); for (const b of buttons) { b.click(); await new Promise(r => setTimeout(r, 500)); }'

# Playwright JavaScript — extract structured data
firecrawl browser execute --node 'JSON.stringify([...document.querySelectorAll(".product-card")].map(c => ({name: c.querySelector("h3").textContent, price: c.querySelector(".price").textContent})))'

# Playwright Python — use print() to return output
firecrawl browser execute --python 'await page.goto("https://example.com")
print(await page.title())'

# Bash — run shell commands in the remote sandbox
firecrawl browser execute --bash 'ls /tmp'
```

Default mode (no flag) sends commands to agent-browser. `--python`, `--node`, and `--bash` are mutually exclusive and bypass agent-browser.

### Device emulation

View and scrape mobile layouts.

```bash
firecrawl browser "set device 'iPhone 14'"
firecrawl browser "open https://example.com"
firecrawl browser "screenshot .firecrawl/mobile-view.png"
firecrawl browser "scrape" -o .firecrawl/mobile-content.md
```

### Dark mode

Scrape content in dark mode.

```bash
firecrawl browser "set media dark"
firecrawl browser "open https://example.com"
firecrawl browser "screenshot .firecrawl/dark-mode.png"
```

### Cookie and storage management

Fine-grained control over cookies and local storage.

```bash
firecrawl browser "cookies get"                       # list all cookies
firecrawl browser "cookies set name=session value=abc123 domain=.example.com"
firecrawl browser "storage local"                     # view localStorage
```

### Multi-tab workflows

Work across multiple pages simultaneously.

```bash
firecrawl browser "tab new"
firecrawl browser "open https://docs.example.com"
firecrawl browser "tab new"
firecrawl browser "open https://api.example.com/status"
firecrawl browser "tab list"                          # see all open tabs
firecrawl browser "tab 1"                             # switch to first tab
```

### Diff — compare page states

Take snapshots before and after to detect changes.

```bash
firecrawl browser "open https://status.example.com"
firecrawl browser "diff snapshot"                     # baseline
# ... wait or trigger changes ...
firecrawl browser "diff snapshot"                     # compare to baseline
```

## Workflow Patterns

### Scrape-first escalation

Try scrape first. Recognize the failure signals, then switch to browser.

```bash
firecrawl scrape "https://medium.com/@user/some-article" -o .firecrawl/article.md
# Read the output — if it's a cookie wall or "sign in to read" paywall:
firecrawl browser "open https://medium.com/@user/some-article"
firecrawl browser "snapshot -i"                        # find dismiss/accept button
firecrawl browser "click @e6"                         # dismiss the overlay
firecrawl browser "scrape" -o .firecrawl/article.md   # get actual content
firecrawl browser close
```

### Login once, reuse many

Profile-based auth workflow for sites you access repeatedly.

```bash
# One-time login
firecrawl browser --profile notion "open https://notion.so/login"
firecrawl browser "snapshot -i"
firecrawl browser "fill @e3 'user@example.com'"
firecrawl browser "fill @e5 'password'"
firecrawl browser "click @e7"
firecrawl browser "wait 5000"
firecrawl browser close

# Reuse across multiple pages — no login needed
firecrawl browser --profile notion "open https://notion.so/workspace/page-1"
firecrawl browser "scrape" -o .firecrawl/notion-page1.md
firecrawl browser "open https://notion.so/workspace/page-2"
firecrawl browser "scrape" -o .firecrawl/notion-page2.md
firecrawl browser close
```

### Network-sniff shortcut

Open in browser to discover the underlying API, then use scrape directly for all subsequent fetches.

```bash
firecrawl browser "open https://jobs.company.com/listings"
firecrawl browser "network requests --filter api"
# Output shows: GET https://api.company.com/v1/jobs?page=1&limit=50
firecrawl browser close

# Now scrape the API directly — fast, no browser needed
firecrawl scrape "https://api.company.com/v1/jobs?page=1&limit=50" -o .firecrawl/jobs-p1.json
firecrawl scrape "https://api.company.com/v1/jobs?page=2&limit=50" -o .firecrawl/jobs-p2.json
```

### Multi-state extraction

Extract content from different states of the same page.

```bash
firecrawl browser "open https://cloud.provider.com/pricing"
# Extract monthly pricing
firecrawl browser "scrape" -o .firecrawl/pricing-monthly.md
# Switch to annual
firecrawl browser "snapshot -i"
firecrawl browser "click @e19"                        # annual toggle
firecrawl browser "wait 1000"
firecrawl browser "scrape" -o .firecrawl/pricing-annual.md
# Switch to enterprise tab
firecrawl browser "click @e24"                        # enterprise tab
firecrawl browser "wait 1000"
firecrawl browser "scrape" -o .firecrawl/pricing-enterprise.md
firecrawl browser close
```

### Parallel sessions

Launch separate sessions for independent tasks.

```bash
firecrawl browser launch-session  # returns session ID 1
firecrawl browser launch-session  # returns session ID 2
firecrawl browser --session <id1> "open https://site-a.com"
firecrawl browser --session <id2> "open https://site-b.com"
```

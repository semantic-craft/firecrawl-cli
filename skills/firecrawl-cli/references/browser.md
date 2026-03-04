# browser

Cloud Chromium sessions in Firecrawl's remote sandboxed environment. Run `firecrawl browser --help` and `firecrawl browser "agent-browser --help"` for all options.

```bash
# Typical browser workflow
firecrawl browser "open <url>"
firecrawl browser "snapshot -i"                       # see interactive elements with @ref IDs
firecrawl browser "click @e5"                         # interact with elements
firecrawl browser "fill @e3 'search query'"           # fill form fields
firecrawl browser "scrape" -o .firecrawl/page.md      # extract content
firecrawl browser close
```

Shorthand auto-launches a session if none exists - no setup required.

**Core agent-browser commands:**

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `open <url>`         | Navigate to a URL                        |
| `snapshot -i`        | Get interactive elements with `@ref` IDs |
| `screenshot`         | Capture a PNG screenshot                 |
| `click <@ref>`       | Click an element by ref                  |
| `type <@ref> <text>` | Type into an element                     |
| `fill <@ref> <text>` | Fill a form field (clears first)         |
| `scrape`             | Extract page content as markdown         |
| `scroll <direction>` | Scroll up/down/left/right                |
| `wait <seconds>`     | Wait for a duration                      |
| `eval <js>`          | Evaluate JavaScript on the page          |

Session management: `launch-session --ttl 600`, `list`, `close`

Options: `--ttl <seconds>`, `--ttl-inactivity <seconds>`, `--session <id>`, `--profile <name>`, `--no-save-changes`, `-o`

**Profiles** survive close and can be reconnected by name. Use them when you need to login first, then come back later to do work while already authenticated:

```bash
# Session 1: Login and save state
firecrawl browser launch-session --profile my-app
firecrawl browser "open https://app.example.com/login"
firecrawl browser "snapshot -i"
firecrawl browser "fill @e3 'user@example.com'"
firecrawl browser "click @e7"
firecrawl browser "wait 2"
firecrawl browser close

# Session 2: Come back authenticated
firecrawl browser launch-session --profile my-app
firecrawl browser "open https://app.example.com/dashboard"
firecrawl browser "scrape" -o .firecrawl/dashboard.md
firecrawl browser close
```

Read-only reconnect (no writes to session state):

```bash
firecrawl browser launch-session --profile my-app --no-save-changes
```

Shorthand with profile:

```bash
firecrawl browser --profile my-app "open https://example.com"
```

If you get forbidden errors in the browser, you may need to create a new session as the old one may have expired.

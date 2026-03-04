# scrape

The workhorse command. Extract content from one or more URLs as clean markdown.

## When to Use

- **Default choice** when you have a URL — static pages, JS-rendered SPAs, PDFs
- Need cached re-fetches with `--max-age`
- Want structured JSON extraction with `--format json`
- Need geo-targeted content with `--country`
- Multiple URLs at once (automatically concurrent)

Do NOT use for: content behind interaction (pagination, forms, login) — use [`browser`](browser.md) instead.

## Superpowers

**Caching** — `--max-age <ms>` returns cached content if the page was fetched within that window. Avoids burning credits on unchanged pages.

**PDF parsing** — Pass a PDF URL and get clean markdown back. No special flags needed.

**JSON extraction** — `--format json` uses LLM to extract structured data from the page.

**Geo-targeting** — `--country US` fetches the page as seen from that country.

**Multi-URL concurrent** — Pass multiple URLs and they're scraped in parallel. Each result saves to `.firecrawl/` automatically.

**Main content only** — `--only-main-content` strips nav, footer, sidebars. Cleaner context.

## Options Reference

| Option                   | Description                                                                                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-f, --format <formats>` | Output format(s), comma-separated. Single = raw; multiple = JSON. Available: `markdown`, `html`, `rawHtml`, `links`, `images`, `screenshot`, `summary`, `changeTracking`, `json`, `attributes`, `branding` |
| `-H, --html`             | Shortcut for `--format html`                                                                                                                                                                               |
| `-S, --summary`          | Shortcut for `--format summary`                                                                                                                                                                            |
| `--only-main-content`    | Strip nav/footer, main content only                                                                                                                                                                        |
| `--wait-for <ms>`        | Wait before scraping (for JS to render)                                                                                                                                                                    |
| `--screenshot`           | Capture a screenshot                                                                                                                                                                                       |
| `--full-page-screenshot` | Full-page screenshot                                                                                                                                                                                       |
| `--include-tags <tags>`  | Only include these HTML tags (comma-separated)                                                                                                                                                             |
| `--exclude-tags <tags>`  | Exclude these HTML tags (comma-separated)                                                                                                                                                                  |
| `--max-age <ms>`         | Return cached content if fetched within this window                                                                                                                                                        |
| `--country <code>`       | ISO country code for geo-targeted scraping (e.g., `US`, `DE`)                                                                                                                                              |
| `--languages <codes>`    | Language codes (comma-separated, e.g., `en,es`)                                                                                                                                                            |
| `-o, --output <path>`    | Output file path (default: stdout)                                                                                                                                                                         |
| `--json`                 | Output as JSON                                                                                                                                                                                             |
| `--pretty`               | Pretty-print JSON                                                                                                                                                                                          |
| `--timing`               | Show request timing info                                                                                                                                                                                   |

## Examples

### Basic scrape

```bash
firecrawl scrape "https://example.com/page" -o .firecrawl/page.md
```

### Cached re-fetch (1 hour)

```bash
firecrawl scrape "https://example.com/page" --max-age 3600000 -o .firecrawl/page.md
```

### Main content only (no nav/footer)

```bash
firecrawl scrape "https://example.com/page" --only-main-content -o .firecrawl/page.md
```

### PDF extraction

```bash
firecrawl scrape "https://example.com/report.pdf" -o .firecrawl/report.md
```

### JSON structured extraction

```bash
firecrawl scrape "https://example.com/pricing" --format json -o .firecrawl/pricing.json
```

### Multiple URLs (concurrent)

```bash
firecrawl scrape "https://example.com/page1" "https://example.com/page2" "https://example.com/page3"
```

Each result saved to `.firecrawl/` automatically.

### Get markdown and links together

```bash
firecrawl scrape "https://example.com/page" --format markdown,links -o .firecrawl/page.json
```

Single format = raw content. Multiple formats = JSON output.

### Wait for JS to render

```bash
firecrawl scrape "https://example.com/spa" --wait-for 3000 -o .firecrawl/spa.md
```

### Geo-targeted scrape

```bash
firecrawl scrape "https://example.com/products" --country DE -o .firecrawl/products-de.md
```

## Common Patterns

### Scrape then grep for key info

```bash
firecrawl scrape "https://docs.example.com/api" -o .firecrawl/api-docs.md
grep -n "authentication\|rate.limit" .firecrawl/api-docs.md
head -100 .firecrawl/api-docs.md
```

### Map then scrape (find the right page first)

```bash
firecrawl map "https://docs.example.com" --search "auth"
# found: https://docs.example.com/api/authentication
firecrawl scrape "https://docs.example.com/api/authentication" -o .firecrawl/auth-docs.md
```

### Parallel scrapes

```bash
firecrawl scrape "https://example.com/a" -o .firecrawl/a.md &
firecrawl scrape "https://example.com/b" -o .firecrawl/b.md &
firecrawl scrape "https://example.com/c" -o .firecrawl/c.md &
wait
```

# search

Web search with optional full-page scraping. The entry point when you don't have a URL yet.

## When to Use

- Don't have a specific URL — need to discover pages
- Research tasks, finding sources, answering questions
- News monitoring with time filters
- Finding specific content types (GitHub repos, PDFs, research papers)

## Key Feature: `--scrape`

`--scrape` fetches full page content for each search result in one shot. **Don't re-scrape those URLs after** — the content is already there.

```bash
firecrawl search "react server components" --scrape -o .firecrawl/search-rsc-scraped.json --json
```

Without `--scrape`, you only get titles, URLs, and snippets.

## Options Reference

| Option                       | Description                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| `--limit <n>`                | Max results (default: 5, max: 100)                                                          |
| `--sources <sources>`        | Comma-separated: `web`, `images`, `news` (default: `web`)                                   |
| `--categories <categories>`  | Filter: `github`, `research`, `pdf`                                                         |
| `--tbs <value>`              | Time filter: `qdr:h` (hour), `qdr:d` (day), `qdr:w` (week), `qdr:m` (month), `qdr:y` (year) |
| `--location <location>`      | Geo-targeting (e.g., `"San Francisco,California,United States"`)                            |
| `--country <code>`           | ISO country code (default: `US`)                                                            |
| `--timeout <ms>`             | Timeout in ms (default: 60000)                                                              |
| `--ignore-invalid-urls`      | Exclude URLs invalid for other Firecrawl endpoints                                          |
| `--scrape`                   | Fetch full page content for each result                                                     |
| `--scrape-formats <formats>` | Formats when scraping (default: `markdown`)                                                 |
| `--only-main-content`        | Main content only when scraping (default: true)                                             |
| `-o, --output <path>`        | Output file path (default: stdout)                                                          |
| `--json`                     | Output as compact JSON                                                                      |

## Examples

### Basic search

```bash
firecrawl search "your query" -o .firecrawl/search-results.json --json
```

### Search and scrape (full content in one shot)

```bash
firecrawl search "firecrawl vs competitors" --scrape --limit 5 -o .firecrawl/search-comparison.json --json
```

### News from the past day

```bash
firecrawl search "AI regulation" --sources news --tbs qdr:d -o .firecrawl/news-ai.json --json
```

### News from the past week

```bash
firecrawl search "product launch" --sources news --tbs qdr:w --limit 10 -o .firecrawl/news-launch.json --json
```

### Find GitHub repos

```bash
firecrawl search "browser automation framework" --categories github -o .firecrawl/search-github.json --json
```

### Find research papers / PDFs

```bash
firecrawl search "transformer attention mechanism" --categories research,pdf -o .firecrawl/search-papers.json --json
```

### Geo-targeted search

```bash
firecrawl search "best cloud providers" --country DE --location "Germany" -o .firecrawl/search-de.json --json
```

## Working with Results

```bash
# Extract URLs from search results
jq -r '.data.web[].url' .firecrawl/search-results.json

# Get titles and URLs
jq -r '.data.web[] | "\(.title): \(.url)"' .firecrawl/search-results.json

# Read incrementally — never dump the whole file
wc -l .firecrawl/search-results.json && head -50 .firecrawl/search-results.json
grep -n "keyword" .firecrawl/search-results.json
```

## Common Patterns

### Research task: search → read → scrape new finds

```bash
firecrawl search "firecrawl vs competitors 2024" --scrape -o .firecrawl/search-comparison-scraped.json --json
grep -n "pricing\|features" .firecrawl/search-comparison-scraped.json
head -200 .firecrawl/search-comparison-scraped.json
# Notice a relevant URL in the content? Scrape only that new URL:
firecrawl scrape "https://newsite.com/comparison" -o .firecrawl/newsite-comparison.md
```

### Find a page then scrape it

```bash
firecrawl search "site:docs.example.com authentication API" --limit 3 -o .firecrawl/search-auth.json --json
# Found the URL, now scrape it
firecrawl scrape "https://docs.example.com/api/auth" -o .firecrawl/auth-docs.md
```

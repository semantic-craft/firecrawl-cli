# map

Discover URLs on a website. Use to find specific pages before scraping.

## When to Use

- Large site and you need to find a specific page (e.g., the auth docs on a big docs site)
- Want to see all pages on a site before deciding what to scrape
- Need to filter URLs by search query
- Pairing with `scrape` in a map → scrape workflow

## Key Feature: `--search`

`--search` filters discovered URLs by relevance to a query — much faster than crawling everything to find one page.

```bash
firecrawl map "https://docs.example.com" --search "authentication"
```

## Options Reference

| Option                      | Description                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| `--limit <n>`               | Max URLs to discover                                             |
| `--search <query>`          | Filter URLs by search query                                      |
| `--sitemap <mode>`          | Sitemap handling: `only`, `include`, `skip` (default: `include`) |
| `--include-subdomains`      | Include subdomains                                               |
| `--ignore-query-parameters` | Ignore query parameters                                          |
| `--timeout <seconds>`       | Timeout in seconds                                               |
| `-o, --output <path>`       | Output file path (default: stdout)                               |
| `--json`                    | Output as JSON                                                   |
| `--pretty`                  | Pretty-print JSON                                                |

## Examples

### Find a specific page on a large site

```bash
firecrawl map "https://docs.example.com" --search "authentication" -o .firecrawl/map-auth.txt
```

### Get all URLs (up to 500)

```bash
firecrawl map "https://example.com" --limit 500 --json -o .firecrawl/map-all.json
```

### Sitemap only (fastest)

```bash
firecrawl map "https://example.com" --sitemap only --json -o .firecrawl/sitemap-urls.json
```

### Include subdomains

```bash
firecrawl map "https://example.com" --include-subdomains --limit 200 -o .firecrawl/map-subdomains.txt
```

## Common Patterns

### Map then scrape (the primary workflow)

```bash
firecrawl map "https://docs.example.com" --search "auth"
# Found: https://docs.example.com/api/authentication
firecrawl scrape "https://docs.example.com/api/authentication" -o .firecrawl/auth-docs.md
```

### Map then crawl a section

```bash
firecrawl map "https://docs.example.com" --search "sdk" -o .firecrawl/map-sdk.txt
# Found several SDK pages under /sdks/
firecrawl crawl "https://docs.example.com" --include-paths /sdks --limit 20 --wait -o .firecrawl/sdk-docs.json
```

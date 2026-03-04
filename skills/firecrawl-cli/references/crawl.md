# crawl

Bulk extract from a website section. Use when you need many pages from a site.

## When to Use

- Need all pages from a section (e.g., all `/docs/`, all `/blog/`)
- Bulk content extraction with path filtering
- Need to control depth, concurrency, and delay

For single pages, use [`scrape`](scrape.md). For finding specific pages first, use [`map`](map.md).

## Long-Running Jobs

Crawls can take minutes. Use `--wait` to block until done, or let it run async and check status later.

```bash
# Block until done (recommended for most cases)
firecrawl crawl "https://docs.example.com" --include-paths /docs --limit 50 --wait -o .firecrawl/crawl.json

# Run async, check later
firecrawl crawl "https://docs.example.com" --include-paths /docs --limit 50
# Returns a job ID
firecrawl crawl <job-id>  # check status
```

## Options Reference

| Option                      | Description                                              |
| --------------------------- | -------------------------------------------------------- |
| `--wait`                    | Block until crawl completes (default: false)             |
| `--progress`                | Show progress dots while waiting                         |
| `--poll-interval <seconds>` | Polling interval when waiting (default: 5)               |
| `--timeout <seconds>`       | Timeout when waiting                                     |
| `--limit <n>`               | Max pages to crawl                                       |
| `--max-depth <n>`           | Max crawl depth                                          |
| `--include-paths <paths>`   | Comma-separated paths to include (e.g., `/docs,/api`)    |
| `--exclude-paths <paths>`   | Comma-separated paths to exclude (e.g., `/zh,/ja`)       |
| `--sitemap <mode>`          | Sitemap handling: `skip`, `include` (default: `include`) |
| `--ignore-query-parameters` | Ignore query parameters                                  |
| `--crawl-entire-domain`     | Crawl entire domain                                      |
| `--allow-external-links`    | Follow external links                                    |
| `--allow-subdomains`        | Follow subdomains                                        |
| `--delay <ms>`              | Delay between requests in ms                             |
| `--max-concurrency <n>`     | Max concurrent requests                                  |
| `-o, --output <path>`       | Output file path (default: stdout)                       |
| `--pretty`                  | Pretty-print JSON                                        |

## Examples

### Crawl a docs section

```bash
firecrawl crawl "https://docs.example.com" --include-paths /docs --limit 50 --wait -o .firecrawl/docs-crawl.json
```

### Crawl with depth limit

```bash
firecrawl crawl "https://example.com" --max-depth 3 --wait --progress -o .firecrawl/crawl.json
```

### Crawl excluding translations

```bash
firecrawl crawl "https://docs.example.com" \
  --include-paths /docs \
  --exclude-paths "/zh,/ja,/fr,/es,/pt-BR" \
  --limit 100 --wait -o .firecrawl/docs-en.json
```

### Check status of a running crawl

```bash
firecrawl crawl <job-id>
```

### Controlled crawl (rate-limited)

```bash
firecrawl crawl "https://example.com" \
  --limit 200 \
  --max-concurrency 5 \
  --delay 500 \
  --wait --progress -o .firecrawl/crawl.json
```

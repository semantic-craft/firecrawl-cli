# scrape

Scrape one or more URLs. Multiple URLs are scraped concurrently and each result is saved to `.firecrawl/`. Run `firecrawl scrape --help` for all options.

```bash
# Basic markdown extraction
firecrawl scrape "<url>" -o .firecrawl/page.md

# Main content only, no nav/footer
firecrawl scrape "<url>" --only-main-content -o .firecrawl/page.md

# Wait for JS to render, then scrape
firecrawl scrape "<url>" --wait-for 3000 -o .firecrawl/page.md

# Multiple URLs (each saved to .firecrawl/)
firecrawl scrape https://firecrawl.dev https://firecrawl.dev/blog https://docs.firecrawl.dev

# Get markdown and links together
firecrawl scrape "<url>" --format markdown,links -o .firecrawl/page.json
```

Options: `-f <markdown,html,rawHtml,links,screenshot,json>`, `-H`, `--only-main-content`, `--wait-for <ms>`, `--include-tags`, `--exclude-tags`, `--max-age <ms>`, `--country <code>`, `-o`

Single format outputs raw content. Multiple formats (e.g., `--format markdown,links`) output JSON.

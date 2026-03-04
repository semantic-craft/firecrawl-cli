# map

Discover URLs on a site. Run `firecrawl map --help` for all options.

```bash
# Find a specific page on a large site
firecrawl map "<url>" --search "authentication" -o .firecrawl/filtered.txt

# Get all URLs
firecrawl map "<url>" --limit 500 --json -o .firecrawl/urls.json
```

Options: `--limit <n>`, `--search <query>`, `--sitemap <include|skip|only>`, `--include-subdomains`, `--json`, `-o`

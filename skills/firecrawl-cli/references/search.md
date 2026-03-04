# search

Web search with optional content scraping. Run `firecrawl search --help` for all options.

```bash
# Basic search
firecrawl search "your query" -o .firecrawl/result.json --json

# Search and scrape full page content from results
firecrawl search "your query" --scrape -o .firecrawl/scraped.json --json

# News from the past day
firecrawl search "your query" --sources news --tbs qdr:d -o .firecrawl/news.json --json
```

Options: `--limit <n>`, `--sources <web,images,news>`, `--categories <github,research,pdf>`, `--tbs <qdr:h|d|w|m|y>`, `--location`, `--country <code>`, `--scrape`, `--scrape-formats`, `-o`

**Key:** `--scrape` fetches full page content for each result in one shot. Don't re-scrape those URLs after.

## Working with Results

```bash
# Extract URLs from search results
jq -r '.data.web[].url' .firecrawl/search-results.json

# Get titles and URLs
jq -r '.data.web[] | "\(.title): \(.url)"' .firecrawl/search-results.json
```

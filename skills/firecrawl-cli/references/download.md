# download

Convenience combo: map + scrape to save an entire site as local files.

## When to Use

- Save a full site or section to local `.firecrawl/` directory
- Download docs for offline reference
- Bulk save with nested directory structure matching the site

Maps the site first to discover pages, then scrapes each one into nested directories under `.firecrawl/`. Always pass `-y` to skip the confirmation prompt.

## Options Reference

### Download Options

| Option                    | Description                                               |
| ------------------------- | --------------------------------------------------------- |
| `--limit <n>`             | Max pages to download                                     |
| `--search <query>`        | Filter pages by search query                              |
| `--include-paths <paths>` | Only download URLs matching these paths (comma-separated) |
| `--exclude-paths <paths>` | Skip URLs matching these paths (comma-separated)          |
| `--allow-subdomains`      | Include subdomains                                        |
| `-y, --yes`               | Skip confirmation prompt                                  |

### Scrape Options (all work with download)

| Option                   | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `-f, --format <formats>` | Output format(s), comma-separated (default: `markdown`) |
| `-H, --html`             | Download as HTML                                        |
| `-S, --summary`          | Download as summary                                     |
| `--only-main-content`    | Main content only                                       |
| `--wait-for <ms>`        | Wait before scraping                                    |
| `--screenshot`           | Capture screenshot per page                             |
| `--full-page-screenshot` | Full-page screenshot per page                           |
| `--include-tags <tags>`  | Only include these HTML tags                            |
| `--exclude-tags <tags>`  | Exclude these HTML tags                                 |
| `--max-age <ms>`         | Cache window for content                                |
| `--country <code>`       | Geo-targeted scraping                                   |
| `--languages <codes>`    | Language codes                                          |

## Examples

### Download a docs site

```bash
firecrawl download "https://docs.example.com" --limit 50 -y
```

### With screenshots

```bash
firecrawl download "https://docs.example.com" --screenshot --limit 20 -y
```

### Filter to specific sections

```bash
firecrawl download "https://docs.example.com" --include-paths "/features,/sdks" -y
```

### Skip translations

```bash
firecrawl download "https://docs.example.com" --exclude-paths "/zh,/ja,/fr,/es,/pt-BR" -y
```

### Multiple formats (each saved as its own file per page)

```bash
firecrawl download "https://docs.example.com" --format markdown,links --screenshot --limit 20 -y
# Creates per page: index.md + links.txt + screenshot.png
```

### Full combo

```bash
firecrawl download "https://docs.example.com" \
  --include-paths "/features,/sdks" \
  --exclude-paths "/zh,/ja" \
  --only-main-content \
  --screenshot \
  -y
```

### Main content only

```bash
firecrawl download "https://docs.example.com" --only-main-content --limit 100 -y
```

---
name: firecrawl-parse
description: |
  Convert a local file (PDF, DOCX, DOC, ODT, RTF, XLSX, XLS, HTML) into clean markdown, HTML, or structured JSON. Use this skill when the user points at a file on disk and wants its content extracted — says "parse this PDF", "convert this Word doc", "read this file", "extract text from", "PDF to markdown", "DOCX to markdown", or provides a local path (not a URL). Also supports AI summary and query ("what does this PDF say about X?"). Use this instead of `scrape` for anything on the local filesystem.
allowed-tools:
  - Bash(firecrawl *)
  - Bash(npx firecrawl *)
---

# firecrawl parse

Parse a local file into clean, LLM-optimized markdown. Supported formats: **HTML, PDF, DOCX, DOC, ODT, RTF, XLSX, XLS**.

## When to use

- You have a file on disk (not a URL) and want its text
- User drops a PDF/DOCX and asks what it says, or to summarize it
- You need markdown from a Word doc, spreadsheet, or PDF to feed into other tools
- Use `scrape` instead when the source is a URL

## Quick start

```bash
# Basic — PDF/DOCX/etc. to markdown
firecrawl parse ./paper.pdf -o .firecrawl/paper.md

# Summary shortcut (AI-generated overview)
firecrawl parse ./paper.pdf -S -o .firecrawl/summary.md

# Ask a question about the doc
firecrawl parse ./paper.pdf -Q "What are the main conclusions?"

# Multiple formats → JSON bundle (markdown + links + summary + metadata)
firecrawl parse ./paper.pdf -f markdown,links,summary --pretty -o .firecrawl/paper.json

# Raw HTML output
firecrawl parse ./paper.pdf -H -o .firecrawl/paper.html
```

## Options

| Option                   | Description                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `-f, --format <formats>` | Output formats (comma-separated): markdown, html, rawHtml, links, images, summary, json, attributes |
| `-S, --summary`          | Shortcut for `--format summary` (AI summary)                                                        |
| `-H, --html`             | Shortcut for `--format html` (raw HTML)                                                             |
| `-Q, --query <prompt>`   | Ask a question about the parsed content                                                             |
| `--only-main-content`    | Strip boilerplate, main content only                                                                |
| `--include-tags <tags>`  | Only include these HTML tags                                                                        |
| `--exclude-tags <tags>`  | Exclude these HTML tags                                                                             |
| `--timeout <ms>`         | Timeout for the parse job                                                                           |
| `-o, --output <path>`    | Output file path (default: stdout)                                                                  |
| `--json`                 | Force JSON output                                                                                   |
| `--pretty`               | Pretty-print JSON                                                                                   |
| `--timing`               | Show request duration                                                                               |

## Tips

- **Scrape vs parse**: `scrape` takes a URL, `parse` takes a local file path. A remote PDF URL can still go through `scrape`.
- **Single vs multi format**: one `--format` value returns raw content; multiple return JSON with keys for each format.
- **Quote paths with spaces**: `firecrawl parse "./My Doc.pdf"`.
- **PDFs may return empty `links`/`images`** — PDF structure doesn't always carry link/image metadata like HTML does. That's expected, not a failure.
- **Large docs**: parse time scales with file size. A ~50-page PDF takes ~10s. Use `--timing` to check.
- **Query vs save-and-grep**: `-Q` is convenient for single questions. For deeper analysis, save to file first, then `grep`/read the markdown.

## See also

- [firecrawl-scrape](../firecrawl-scrape/SKILL.md) — same idea but for URLs
- [firecrawl-download](../firecrawl-download/SKILL.md) — bulk save a site as local files (which you can then parse)

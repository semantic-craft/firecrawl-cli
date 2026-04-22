---
name: firecrawl-parse
description: |
  Convert a local file (PDF, DOCX, DOC, ODT, RTF, XLSX, XLS, HTML) into clean markdown. Use this skill when the user points at a file on disk and wants its content — says "parse this PDF", "convert this Word doc", "read this file", "extract text from", "PDF to markdown", "DOCX to markdown", or provides a local path (not a URL). Also supports AI summary and Q&A. Use this instead of `scrape` for anything on the local filesystem.
allowed-tools:
  - Bash(firecrawl *)
  - Bash(npx firecrawl *)
---

# firecrawl parse

Turn any local document into clean markdown. Supported file types: **PDF, DOCX, DOC, ODT, RTF, XLSX, XLS, HTML**.

## When to use

- You have a file on disk (not a URL) and want its text as markdown
- User drops a PDF/DOCX and asks what it says, or to summarize it
- You need a Word doc, spreadsheet, or PDF as markdown to feed into other tools
- Use `scrape` instead when the source is a URL

## Quick start

```bash
# Any file → clean markdown
firecrawl parse ./paper.pdf -o .firecrawl/paper.md

# AI summary
firecrawl parse ./paper.pdf -S -o .firecrawl/summary.md

# Ask a question about the doc
firecrawl parse ./paper.pdf -Q "What are the main conclusions?"
```

That covers almost every case. The rest below is for when you need more.

## Options

| Option                 | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `-S, --summary`        | AI-generated summary (shortcut for `-f summary`) |
| `-Q, --query <prompt>` | Ask a question about the parsed content          |
| `-o, --output <path>`  | Output file path (default: stdout)               |
| `--only-main-content`  | Strip boilerplate                                |
| `--timing`             | Show request duration                            |

## Other formats

Default output is markdown. Pass `-f` to request alternates or bundles:

```bash
firecrawl parse ./paper.pdf -f html -o paper.html        # cleaned HTML
firecrawl parse ./page.html -f markdown,links,images \   # JSON bundle
  --pretty -o page.json
```

- `markdown` (default), `html`, `rawHtml`, `summary` — work on every file type
- `links`, `images` — work on HTML input; **return empty arrays for PDF/DOCX** (those formats don't carry link/image structure)
- Multiple formats → JSON output keyed by format name
- For structured/schema-based extraction, use `firecrawl agent` instead

## Tips

- **Scrape vs parse**: `scrape` takes a URL, `parse` takes a local file path.
- **Quote paths with spaces**: `firecrawl parse "./My Doc.pdf"`.
- **Credits scale with PDF pages**: ~1 credit per page. HTML is typically 1 credit flat.
- **Parse time**: ~10s for a 50-page PDF. Use `--timing` to measure.
- **Query vs save-and-grep**: `-Q` is great for a single question. For deeper analysis, save to markdown first, then `grep` or read the file.

## See also

- [firecrawl-scrape](../firecrawl-scrape/SKILL.md) — same idea but for URLs
- [firecrawl-agent](../firecrawl-agent/SKILL.md) — structured data extraction with a schema
- [firecrawl-download](../firecrawl-download/SKILL.md) — bulk save a site as local files (which you can then parse)

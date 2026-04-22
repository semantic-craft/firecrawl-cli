---
name: firecrawl-parse
description: |
  Convert a local file (PDF, DOCX, DOC, ODT, RTF, XLSX, XLS, HTML) into clean markdown saved to disk. Use this skill when the user points at a file on disk and wants its content — says "parse this PDF", "convert this Word doc", "read this file", "extract text from", "PDF to markdown", "DOCX to markdown", or provides a local path (not a URL). Also supports AI summary and Q&A. Use this instead of `scrape` for anything on the local filesystem.
allowed-tools:
  - Bash(firecrawl *)
  - Bash(npx firecrawl *)
---

# firecrawl parse

Turn any local document into clean markdown on disk. Supported file types: **PDF, DOCX, DOC, ODT, RTF, XLSX, XLS, HTML**.

## When to use

- You have a file on disk (not a URL) and want its text as markdown
- User drops a PDF/DOCX and asks what it says, or to summarize it
- You need a Word doc, spreadsheet, or PDF as markdown to feed into other tools
- Use `scrape` instead when the source is a URL

## Always save to a file

**Default pattern**: parse to a file in `.firecrawl/`, then read or `grep` it. Don't stream full parsed content into the conversation — parsed docs can be hundreds of KB and blow up context windows.

```bash
mkdir -p .firecrawl

# Always use -o. Name the output after the source file.
firecrawl parse ./paper.pdf -o .firecrawl/paper.md
```

Add `.firecrawl/` to `.gitignore`.

After parsing, work with the file incrementally:

```bash
wc -l .firecrawl/paper.md                # size check first
head -50 .firecrawl/paper.md             # preview
grep -n "conclusion" .firecrawl/paper.md # targeted lookup
```

## Quick start

```bash
# File → markdown on disk
firecrawl parse ./paper.pdf -o .firecrawl/paper.md

# AI summary to its own file
firecrawl parse ./paper.pdf -S -o .firecrawl/paper-summary.md

# Q&A — small answers are okay in stdout, but save if you might reuse
firecrawl parse ./paper.pdf -Q "What are the main conclusions?" \
  -o .firecrawl/paper-conclusions.md
```

That covers almost every case. The rest below is for when you need more.

## Options

| Option                 | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `-S, --summary`        | AI-generated summary (shortcut for `-f summary`) |
| `-Q, --query <prompt>` | Ask a question about the parsed content          |
| `-o, --output <path>`  | Output file path — **always use this**           |
| `--only-main-content`  | Strip boilerplate                                |
| `--timing`             | Show request duration                            |

## Other formats

Default output is markdown. Pass `-f` to request alternates or bundles:

```bash
# Cleaned HTML instead of markdown
firecrawl parse ./paper.pdf -f html -o .firecrawl/paper.html

# Markdown + summary together (JSON bundle)
firecrawl parse ./paper.pdf -f markdown,summary --pretty \
  -o .firecrawl/paper-bundle.json
```

Formats: `markdown` (default), `html`, `summary`. Multiple formats → JSON output keyed by format name.

For structured/schema-based extraction, use `firecrawl agent` instead.

## Tips

- **Scrape vs parse**: `scrape` takes a URL, `parse` takes a local file path.
- **Quote paths with spaces**: `firecrawl parse "./My Doc.pdf" -o .firecrawl/mydoc.md`.
- **Credits scale with PDF pages**: ~1 credit per page. HTML is typically 1 credit flat.
- **Parse time**: ~10s for a 50-page PDF. Use `--timing` to measure.
- **Naming convention**: `.firecrawl/{source-basename}.md` — keeps outputs easy to find and re-use.
- **Avoid redundant parses**: check `.firecrawl/` before re-parsing the same file.

## See also

- [firecrawl-scrape](../firecrawl-scrape/SKILL.md) — same idea but for URLs
- [firecrawl-agent](../firecrawl-agent/SKILL.md) — structured data extraction with a schema
- [firecrawl-download](../firecrawl-download/SKILL.md) — bulk save a site as local files (which you can then parse)

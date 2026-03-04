# agent

AI-powered autonomous extraction. Use for complex structured data that requires reasoning across pages.

## When to Use

- Need structured data extracted with AI reasoning (pricing tiers, product specs, feature comparisons)
- Schema-driven extraction — define exactly what you want back
- Multi-page reasoning — agent navigates and synthesizes across pages

**Cost awareness:** Agent jobs consume significantly more credits than scrape/search. They also take 2-5 minutes. Only use when simpler commands can't get the data.

## Model Selection

| Model          | Use case                               |
| -------------- | -------------------------------------- |
| `spark-1-mini` | Default. Cheaper, good for most tasks  |
| `spark-1-pro`  | Higher accuracy for complex extraction |

## Options Reference

| Option                      | Description                                  |
| --------------------------- | -------------------------------------------- |
| `--urls <urls>`             | Comma-separated URLs to focus extraction on  |
| `--model <model>`           | `spark-1-mini` (default) or `spark-1-pro`    |
| `--schema <json>`           | Inline JSON schema for structured output     |
| `--schema-file <path>`      | Path to JSON schema file                     |
| `--max-credits <n>`         | Max credits to spend (job fails if exceeded) |
| `--wait`                    | Block until complete (default: false)        |
| `--poll-interval <seconds>` | Polling interval when waiting (default: 5)   |
| `--timeout <seconds>`       | Timeout when waiting                         |
| `-o, --output <path>`       | Output file path (default: stdout)           |
| `--json`                    | Output as JSON                               |
| `--pretty`                  | Pretty-print JSON                            |

## Examples

### Extract structured data with a prompt

```bash
firecrawl agent "extract all pricing tiers with features and prices" --wait -o .firecrawl/pricing.json
```

### Schema-driven extraction

```bash
firecrawl agent "extract products" \
  --schema '{"type":"object","properties":{"name":{"type":"string"},"price":{"type":"number"},"description":{"type":"string"}}}' \
  --wait -o .firecrawl/products.json
```

### Focus on specific URLs

```bash
firecrawl agent "get the feature comparison table" \
  --urls "https://example.com/pricing,https://example.com/features" \
  --wait -o .firecrawl/features.json
```

### Use the higher-accuracy model

```bash
firecrawl agent "extract detailed product specifications" \
  --model spark-1-pro \
  --wait -o .firecrawl/specs.json
```

### Cap credit usage

```bash
firecrawl agent "extract all blog post metadata" \
  --max-credits 100 \
  --wait -o .firecrawl/blog-meta.json
```

### Schema from a file

```bash
firecrawl agent "extract company data" \
  --schema-file ./schema.json \
  --wait -o .firecrawl/companies.json
```

### Check status of a running agent job

```bash
firecrawl agent <job-id>
```

# agent

AI-powered autonomous extraction (2-5 minutes). Run `firecrawl agent --help` for all options.

```bash
# Extract structured data
firecrawl agent "extract all pricing tiers" --wait -o .firecrawl/pricing.json

# With a JSON schema for structured output
firecrawl agent "extract products" --schema '{"type":"object","properties":{"name":{"type":"string"},"price":{"type":"number"}}}' --wait -o .firecrawl/products.json

# Focus on specific pages
firecrawl agent "get feature list" --urls "<url>" --wait -o .firecrawl/features.json
```

Options: `--urls`, `--model <spark-1-mini|spark-1-pro>`, `--schema <json>`, `--schema-file`, `--max-credits <n>`, `--wait`, `--pretty`, `-o`

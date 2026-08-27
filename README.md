# fashio-mcp

MCP (Model Context Protocol) server for the [Fashio API](https://fashiolabs.com) — lets Claude, Cursor, and other MCP-speaking agents generate on-model fashion photos directly, as tool calls.

[Fashio](https://fashiolabs.com) turns a garment or product photo into publish-ready e-commerce photography and video with AI — virtual try-on, catalog packs, background removal, upscaling, reframing, and more. This package is the official MCP client for its [public v1 REST API](https://docs.fashiolabs.com).

It's a thin wrapper: every tool here calls the same public `api.fashiolabs.com` v1 REST API a curl script would. No local business logic — the API is the source of truth.

## Setup

1. Create a free API key at **fashiolabs.com → Profile → API Keys**.
2. Add Fashio to your MCP client — pick one of the two options below.

### Option A — Remote (hosted, no install)

`mcp.fashiolabs.com` runs this same server as a hosted HTTP endpoint — nothing to install, just add the URL with your key as a bearer token:

```json
{
  "mcpServers": {
    "fashio": {
      "url": "https://mcp.fashiolabs.com/mcp",
      "headers": {
        "Authorization": "Bearer fio_live_..."
      }
    }
  }
}
```

(Exact config UI/field names vary by client — Claude Desktop, Claude Code and Cursor all support adding a remote/HTTP MCP server by URL with custom headers as of 2026.)

### Option B — Local (this package, stdio)

Runs on your own machine instead of a hosted endpoint — same tools, same billing.

### Claude Desktop / Claude Code

`claude_desktop_config.json` (or `.mcp.json` for Claude Code):

```json
{
  "mcpServers": {
    "fashio": {
      "command": "npx",
      "args": ["-y", "fashio-mcp"],
      "env": {
        "FASHIO_API_KEY": "fio_live_..."
      }
    }
  }
}
```

### Running from source

```bash
git clone https://github.com/fashiolabs/fashio-mcp.git
cd fashio-mcp
npm install
npm run build
```

Then point your client's config at the built entry point instead of `npx`:

```json
{
  "mcpServers": {
    "fashio": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": { "FASHIO_API_KEY": "fio_live_..." }
    }
  }
}
```

## Tools

| Tool | Description |
|---|---|
| `list_models` | Every valid `toolId` for `create_generation`, with input shape and fallback price. |
| `list_fashion_models` | Browse the AI person model catalog (`gender`, `limit`). |
| `list_venues` | Browse the venue/background catalog (`limit`). |
| `list_poses` | Browse the pose catalog (`type`, `limit`). |
| `upload_image` | Uploads a **local** file (jpg/png/webp, max 8MB) and returns a usable URL. |
| `create_generation` | Starts a job — same request shape as `POST /v1/generations`. Returns `{id, status: "processing"}`. Pass `templateSetId` to reuse a saved style instead of picking `fashion_model`/`venue`/`pose` by hand. |
| `get_generation` | Polls a job by `id` until `status` is `completed` or `failed`. |
| `get_account` | Email, plan, diamond (credit) balance, and renewal date for the account that owns the key. |
| `create_template_set` | Saves a completed generation's `fashion_model`/`venue`/`pose`/`shotType`/`stylePreset`/`ratio` as a named preset — reuse it on a new garment via `create_generation`'s `templateSetId`. |
| `list_template_sets` | Lists presets saved with `create_template_set`. |
| `delete_template_set` | Deletes a saved preset. |
| `list_ready_template_sets` | Browses Fashio's own curated "ready photoshoot" library (model + venue + pinned poses) — a different, larger catalogue than your own saved presets above. |
| `get_ready_template_set` | Fetches one curated set, including its full list of shots. |
| `create_catalog_job` | Runs your product photo through every shot (or a chosen subset) of a curated photoshoot set — one image per shot, billed per shot. Poll with `get_generation`. |

See [docs.fashiolabs.com](https://docs.fashiolabs.com) for the full endpoint reference these tools wrap, and [docs.fashiolabs.com/llms-full.txt](https://docs.fashiolabs.com/llms-full.txt) for a plain-text version written for an LLM to read in one pass — including which `images.*` fields each `toolId` needs.

## Billing

There is no separate MCP or API plan. Every `create_generation` call deducts diamonds (Fashio's credit unit) from the account that owns the API key — exactly as a generation from the app or dashboard would. A failed generation refunds its diamonds automatically.

## Development

```bash
npm run dev    # tsc --watch
npm run build
npm start      # runs dist/index.js directly (expects FASHIO_API_KEY in env)
```

## Links

- [fashiolabs.com](https://fashiolabs.com) — product
- [docs.fashiolabs.com](https://docs.fashiolabs.com) — full API reference
- [fashiolabs.com/mcp](https://fashiolabs.com/mcp) — MCP setup guide
- [fashiolabs.com/pricing](https://fashiolabs.com/pricing) — plans & credit packs

## License

MIT — see [LICENSE](./LICENSE).

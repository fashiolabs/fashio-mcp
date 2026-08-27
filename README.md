# fashio-mcp

MCP (Model Context Protocol) server for the [Fashio API](https://docs.fashiolabs.com) — lets Claude, Cursor, and other MCP-speaking agents generate on-model fashion photos directly, as tool calls.

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

### Running from source (before npm publish)

```bash
git clone <this repo>
cd mcp-server
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
| `create_generation` | Starts a job — same request shape as `POST /v1/generations`. Returns `{id, status: "processing"}`. |
| `get_generation` | Polls a job by `id` until `status` is `completed` or `failed`. |

See [docs.fashiolabs.com](https://docs.fashiolabs.com) for the full endpoint reference these tools wrap, and [docs.fashiolabs.com/llms-full.txt](https://docs.fashiolabs.com/llms-full.txt) for a plain-text version written for an LLM to read in one pass — including which `images.*` fields each `toolId` needs.

## Billing

There is no separate MCP or API plan. Every `create_generation` call deducts diamonds (Fashio's credit unit) from the account that owns the API key — exactly as a generation from the app or dashboard would. A failed generation refunds its diamonds automatically.

## Development

```bash
npm run dev    # tsc --watch
npm run build
npm start      # runs dist/index.js directly (expects FASHIO_API_KEY in env)
```

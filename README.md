# mcp-hagstofa-is

Statistics Iceland (Hagstofa Íslands) PxWeb MCP. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 673+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `subjects` | Navigate the database/subject tree. Root lists databases; sub-paths list folders (type "l") and tables (type "t", id ends in ".px"). |
| `table_meta` | Table definition (dimensions, valid values). Path must include the ".px" table suffix. |
| `query_table` | Pull data from a table (path includes the ".px" suffix). body is a PxWeb query object. PxWeb limits request size — filter dimensions to keep the cell count small. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "hagstofa-is": {
      "url": "https://gateway.pipeworx.io/hagstofa-is/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 673+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Hagstofa Is data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

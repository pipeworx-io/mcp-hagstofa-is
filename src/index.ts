interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Statistics Iceland (Hagstofa Íslands) PxWeb MCP. Keyless.
 *
 * PxWeb API base: https://px.hagstofa.is/pxen/api/v1/en (English).
 * Use /pxis/api/v1/is for Icelandic-language labels.
 *
 * Navigation:
 *   - Root GET returns databases: [{dbid, text}].
 *   - Sub-paths GET return items: [{id, type, text}] where type "l" = folder, "t" = table.
 *   - Table ids carry a ".px" suffix (e.g. "MAN00000.px"); include it in the path.
 *   - Table metadata: GET .../{path}/{table.px} -> {title, variables:[{code, text, values, valueTexts}]}.
 *   - Query: POST .../{path}/{table.px} with a PxWeb query body.
 *
 * Note: PxWeb enforces a per-request cell limit; filter dimensions in your query
 * (selection.filter "item" + explicit values) to avoid oversized-request errors.
 */


const BASE = 'https://px.hagstofa.is/pxen/api/v1/en';
const UA = 'pipeworx-mcp-hagstofa-is/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'subjects',
    description: 'Navigate the database/subject tree. Root lists databases; sub-paths list folders (type "l") and tables (type "t", id ends in ".px").',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Sub-path under the English PxWeb root (default empty = root). e.g. "Ibuar/mannfjoldi/1_yfirlit/yfirlit_mannfjolda"' } },
    },
  },
  {
    name: 'table_meta',
    description: 'Table definition (dimensions, valid values). Path must include the ".px" table suffix.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'e.g. "Ibuar/mannfjoldi/1_yfirlit/yfirlit_mannfjolda/MAN00000.px"' } },
      required: ['path'],
    },
  },
  {
    name: 'query_table',
    description: 'Pull data from a table (path includes the ".px" suffix). body is a PxWeb query object. PxWeb limits request size — filter dimensions to keep the cell count small.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        body: { type: 'object', description: '{query: [{code, selection: {filter, values}}], response: {format: "json-stat2"}}' },
      },
      required: ['path', 'body'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'subjects': {
      const path = (args.path as string | undefined)?.replace(/^\/+|\/+$/g, '') ?? '';
      return hagstofaGet(path ? `/${path}` : '');
    }
    case 'table_meta':
      return hagstofaGet(`/${reqStr(args, 'path', '"Ibuar/mannfjoldi/1_yfirlit/yfirlit_mannfjolda/MAN00000.px"').replace(/^\/+|\/+$/g, '')}`);
    case 'query_table': {
      const path = reqStr(args, 'path', '"Ibuar/mannfjoldi/1_yfirlit/yfirlit_mannfjolda/MAN00000.px"').replace(/^\/+|\/+$/g, '');
      const body = args.body;
      if (!body || typeof body !== 'object') throw new Error('body must be a PxWeb query object.');
      const res = await fetch(`${BASE}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': UA },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Hagstofa: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
      return res.json();
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function hagstofaGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Hagstofa: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;

import { Type } from "@sinclair/typebox";
import type { ComposioClient } from "../client.js";
import type { ComposioConfig } from "../types.js";

/**
 * Tool parameters for composio_search_tools
 */
export const ComposioSearchToolSchema = Type.Object({
  query: Type.String({
    description: "Task description to find matching tools (e.g., 'send an email', 'create github issue')",
  }),
  toolkits: Type.Optional(
    Type.Array(Type.String(), {
      description: "Limit search to specific toolkits (e.g., ['github', 'gmail'])",
    })
  ),
  limit: Type.Optional(
    Type.Number({
      description: "Maximum number of results to return (default: 10, max: 50)",
    })
  ),
  user_id: Type.Optional(
    Type.String({
      description: "User ID for session scoping (uses default if not provided)",
    })
  ),
});

/**
 * Create the composio_search_tools tool
 */
export function createComposioSearchTool(client: ComposioClient, _config: ComposioConfig) {
  return {
    name: "composio_search_tools",
    label: "Composio Search Tools",
    description:
      "Search for tools across 1000+ integrations (Gmail, Slack, GitHub, Notion, etc.) " +
      "by describing what you want to accomplish. Returns matching tools with their schemas.",
    parameters: ComposioSearchToolSchema,

    async execute(_toolCallId: string, params: Record<string, unknown>) {
      const query = String(params.query || "").trim();
      if (!query) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "query is required" }, null, 2) }],
          details: { error: "query is required" },
        };
      }

      const toolkits = Array.isArray(params.toolkits)
        ? params.toolkits.filter((t): t is string => typeof t === "string")
        : undefined;

      const limit = Math.min(
        typeof params.limit === "number" && params.limit > 0 ? params.limit : 10,
        50
      );

      const userId = typeof params.user_id === "string" ? params.user_id : undefined;

      try {
        const results = await client.searchTools(query, { toolkits, limit, userId });

        const response = {
          query,
          count: results.length,
          tools: results.map((tool) => ({
            slug: tool.slug,
            name: tool.name,
            description: tool.description,
            toolkit: tool.toolkit,
            parameters: tool.parameters,
          })),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          details: response,
        };
      } catch (err) {
        const errorResponse = {
          error: err instanceof Error ? err.message : String(err),
        };
        return {
          content: [{ type: "text", text: JSON.stringify(errorResponse, null, 2) }],
          details: errorResponse,
        };
      }
    },
  };
}

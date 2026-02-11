import { Type } from "@sinclair/typebox";
import type { ComposioClient } from "../client.js";
import type { ComposioConfig } from "../types.js";

/**
 * Tool parameters for composio_execute_tool
 */
export const ComposioExecuteToolSchema = Type.Object({
  tool_slug: Type.String({
    description: "Tool slug from composio_search_tools results (e.g., 'GMAIL_SEND_EMAIL')",
  }),
  arguments: Type.Unknown({
    description: "Tool arguments matching the tool's parameter schema",
  }),
  user_id: Type.Optional(
    Type.String({
      description: "User ID for session scoping (uses default if not provided)",
    })
  ),
});

/**
 * Create the composio_execute_tool tool
 */
export function createComposioExecuteTool(client: ComposioClient, _config: ComposioConfig) {
  return {
    name: "composio_execute_tool",
    label: "Composio Execute Tool",
    description:
      "Execute a single Composio tool. Use composio_search_tools first to find the tool slug " +
      "and parameter schema. The tool must be connected (use composio_manage_connections to check).",
    parameters: ComposioExecuteToolSchema,

    async execute(_toolCallId: string, params: Record<string, unknown>) {
      const toolSlug = String(params.tool_slug || "").trim();
      if (!toolSlug) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "tool_slug is required" }, null, 2) }],
          details: { error: "tool_slug is required" },
        };
      }

      const args =
        params.arguments && typeof params.arguments === "object" && !Array.isArray(params.arguments)
          ? (params.arguments as Record<string, unknown>)
          : {};

      const userId = typeof params.user_id === "string" ? params.user_id : undefined;

      try {
        const result = await client.executeTool(toolSlug, args, userId);

        const response = {
          tool_slug: toolSlug,
          success: result.success,
          ...(result.success ? { data: result.data } : { error: result.error }),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          details: response,
        };
      } catch (err) {
        const errorResponse = {
          tool_slug: toolSlug,
          success: false,
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

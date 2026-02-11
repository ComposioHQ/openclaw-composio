import { Type } from "@sinclair/typebox";
import type { ComposioClient } from "../client.js";
import type { ComposioConfig } from "../types.js";

/**
 * Tool parameters for composio_workbench
 */
export const ComposioWorkbenchSchema = Type.Object({
  code: Type.String({
    description:
      "Python code to execute in the remote Jupyter sandbox. " +
      "Helper functions available: run_composio_tool(slug, args), invoke_llm(query), " +
      "upload_local_file(*paths), proxy_execute(method, endpoint, toolkit, ...), " +
      "web_search(query), smart_file_extract(path). State persists across executions.",
  }),
  thought: Type.Optional(
    Type.String({
      description: "Concise objective describing what the code should achieve",
    })
  ),
  current_step: Type.Optional(
    Type.String({
      description: "Short enum for current workflow step (e.g., FETCHING_EMAILS, GENERATING_REPLIES)",
    })
  ),
  current_step_metric: Type.Optional(
    Type.String({
      description: "Progress metrics for current step (e.g., '10/100 emails', '3/10 pages')",
    })
  ),
  user_id: Type.Optional(
    Type.String({
      description: "User ID for session scoping (uses default if not provided)",
    })
  ),
});

/**
 * Create the composio_workbench tool
 */
export function createComposioWorkbenchTool(client: ComposioClient, _config: ComposioConfig) {
  return {
    name: "composio_workbench",
    label: "Composio Remote Workbench",
    description:
      "Execute Python code in a remote Jupyter sandbox for processing large tool responses, " +
      "scripting bulk operations, or running data analysis. Use when data is stored in remote files " +
      "or when orchestrating multiple Composio tool calls. Has access to pandas, numpy, PIL, PyTorch, etc.",
    parameters: ComposioWorkbenchSchema,

    async execute(_toolCallId: string, params: Record<string, unknown>) {
      const code = String(params.code || "").trim();
      if (!code) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "code is required" }, null, 2) }],
          details: { error: "code is required" },
        };
      }

      const thought = typeof params.thought === "string" ? params.thought : undefined;
      const currentStep = typeof params.current_step === "string" ? params.current_step : undefined;
      const currentStepMetric = typeof params.current_step_metric === "string" ? params.current_step_metric : undefined;
      const userId = typeof params.user_id === "string" ? params.user_id : undefined;

      try {
        const result = await client.executeWorkbench(code, {
          thought,
          currentStep,
          currentStepMetric,
          userId,
        });

        const response = {
          success: result.success,
          ...(result.success ? { output: result.output } : { error: result.error }),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
          details: response,
        };
      } catch (err) {
        const errorResponse = {
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

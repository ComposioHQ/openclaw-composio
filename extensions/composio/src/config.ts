import { z } from "zod";
import type { ComposioConfig } from "./types.js";

/**
 * Zod schema for Composio plugin configuration
 */
export const ComposioConfigSchema = z.object({
  enabled: z.boolean().default(true),
  apiKey: z.string().optional(),
  defaultUserId: z.string().optional(),
  allowedToolkits: z.array(z.string()).optional(),
  blockedToolkits: z.array(z.string()).optional(),
});

/**
 * Parse and validate plugin config with environment fallbacks
 */
export function parseComposioConfig(value: unknown): ComposioConfig {
  const raw =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  // Allow API key from config.apiKey, top-level apiKey, or environment
  const configObj = raw.config as Record<string, unknown> | undefined;
  const apiKey =
    (typeof configObj?.apiKey === "string" && configObj.apiKey.trim()) ||
    (typeof raw.apiKey === "string" && raw.apiKey.trim()) ||
    process.env.COMPOSIO_API_KEY ||
    "";

  return ComposioConfigSchema.parse({
    ...raw,
    apiKey,
  });
}

/**
 * UI hints for configuration fields
 */
export const composioConfigUiHints = {
  enabled: {
    label: "Enable Composio",
    help: "Enable or disable the Composio Tool Router integration",
  },
  apiKey: {
    label: "API Key",
    help: "Composio API key from platform.composio.dev/settings",
    sensitive: true,
  },
  defaultUserId: {
    label: "Default User ID",
    help: "Default user ID for session scoping (optional)",
  },
  allowedToolkits: {
    label: "Allowed Toolkits",
    help: "Restrict to specific toolkits (e.g., github, gmail)",
    advanced: true,
  },
  blockedToolkits: {
    label: "Blocked Toolkits",
    help: "Block specific toolkits from being used",
    advanced: true,
  },
};

/**
 * Plugin config schema object for clawdbot
 */
export const composioPluginConfigSchema = {
  parse: parseComposioConfig,
  uiHints: composioConfigUiHints,
};

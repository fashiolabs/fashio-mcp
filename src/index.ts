#!/usr/bin/env node
/**
 * fashio-mcp — MCP server for the Fashio API (docs.fashiolabs.com).
 *
 * Thin wrapper: every tool here calls the same public v1 REST API a curl
 * script would (see fashioClient.ts). No local business logic — the API is
 * the source of truth, this just gives an MCP-speaking agent tool names and
 * schemas instead of raw HTTP.
 *
 * Auth: reads FASHIO_API_KEY from the environment (set it in the MCP client's
 * server config — see README.md).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  listModels,
  listFashionModels,
  listVenues,
  listPoses,
  uploadImage,
  createGeneration,
  getGeneration,
  getAccount,
  createTemplateSet,
  listTemplateSets,
  deleteTemplateSet,
  listReadyTemplateSets,
  getReadyTemplateSet,
  createCatalogJob,
} from "./fashioClient.js";

const server = new McpServer({
  name: "fashio-mcp",
  version: "0.1.0",
});

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(e: unknown) {
  return {
    content: [{ type: "text" as const, text: e instanceof Error ? e.message : String(e) }],
    isError: true,
  };
}

server.registerTool(
  "list_models",
  {
    title: "List Fashio generation tools",
    description:
      "Lists every valid toolId for create_generation, with its input shape and fallback diamond price.",
    inputSchema: {},
  },
  async () => {
    try {
      return textResult(await listModels());
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "list_fashion_models",
  {
    title: "List selectable AI person models",
    description: "Browse the catalog of AI person models to use as images.fashion_model in create_generation.",
    inputSchema: {
      gender: z.enum(["male", "female"]).optional().describe("Filter by gender."),
      limit: z.number().min(1).max(100).optional().describe("Max results (default 20)."),
    },
  },
  async (args) => {
    try {
      return textResult(await listFashionModels(args));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "list_venues",
  {
    title: "List selectable venues/backgrounds",
    description: "Browse the catalog of venues/backgrounds to use as images.venue in create_generation.",
    inputSchema: {
      limit: z.number().min(1).max(100).optional().describe("Max results (default 20)."),
    },
  },
  async (args) => {
    try {
      return textResult(await listVenues(args));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "list_poses",
  {
    title: "List selectable poses",
    description: "Browse the catalog of poses to use as `pose` in create_generation.",
    inputSchema: {
      type: z
        .string()
        .optional()
        .describe("Pose subset, e.g. 'ring'/'necklace'/'earring'/'bracelet' for jewelry poses. Omit for the default set."),
      limit: z.number().min(1).max(100).optional().describe("Max results (default 20)."),
    },
  },
  async (args) => {
    try {
      return textResult(await listPoses(args));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "upload_image",
  {
    title: "Upload a local image to Fashio",
    description:
      "Uploads a LOCAL image file (jpg/jpeg/png/webp, max 8MB) from this machine's filesystem and returns a URL usable in create_generation's images.* fields.",
    inputSchema: {
      filePath: z.string().describe("Absolute path to a local .jpg/.jpeg/.png/.webp file."),
    },
  },
  async (args) => {
    try {
      return textResult(await uploadImage(args));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "create_generation",
  {
    title: "Start a Fashio generation job",
    description:
      "Starts an AI fashion generation job. Deducts diamonds from the account that owns the API key. Call list_models first for valid toolId values and what each needs in `images`. Returns immediately with status 'processing' — poll get_generation for the result. Pass templateSetId to reuse a saved style (see list_template_sets) instead of picking fashion_model/venue/pose by hand.",
    inputSchema: {
      toolId: z.string().optional().describe("See list_models. Required unless templateSetId is given."),
      templateSetId: z
        .string()
        .optional()
        .describe(
          "A saved style from create_template_set/list_template_sets. Fills in fashion_model/venue/pose/shotType/stylePreset/ratio; only the new garment's images are still required.",
        ),
      images: z
        .record(z.string(), z.union([z.string(), z.array(z.string())]))
        .optional()
        .describe(
          "Keys depend on toolId (e.g. garment_photo, fashion_model, venue, user_photo, jewelry_image). " +
            "Values are URLs from upload_image / list_fashion_models / list_venues, or your own hosting. " +
            "fashion_model and venue also accept a catalog id directly.",
        ),
      pose: z.string().optional().describe("A pose id from list_poses."),
      shotType: z.string().optional().describe("pro_studio only."),
      stylePreset: z.string().optional().describe("pro_studio only."),
      customPrompt: z.string().optional().describe("Free-text instruction. Required for photo_edit."),
      motionPrompt: z.string().optional().describe("ai_videos only — describes the motion."),
      ratio: z.string().optional().describe("1:1 | 9:16 | 16:9 | 4:3 | 3:4 | 4:5 | auto"),
      duration: z.number().optional().describe("ai_videos only, seconds (default 5)."),
      targetRatio: z.string().optional().describe("photo_reframe only — the output aspect ratio."),
      jewelryType: z.enum(["ring", "necklace", "earring", "bracelet"]).optional().describe("jewelry_on_model only."),
      backgroundColor: z.string().optional().describe("jewelry_on_model only, optional solid studio background."),
    },
  },
  async (args) => {
    try {
      return textResult(await createGeneration(args));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "get_generation",
  {
    title: "Poll a Fashio generation job",
    description: "Checks the status of a job started with create_generation. Poll until status is 'completed' or 'failed'.",
    inputSchema: {
      id: z.string().describe("The id returned by create_generation."),
    },
  },
  async ({ id }) => {
    try {
      return textResult(await getGeneration(id));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "get_account",
  {
    title: "Get account info",
    description:
      "Returns the email, plan, diamond (credit) balance, and renewal date for the account that owns this API key.",
    inputSchema: {},
  },
  async () => {
    try {
      return textResult(await getAccount());
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "create_template_set",
  {
    title: "Save a generation's styling as a reusable template",
    description:
      "Saves the fashion_model/venue/pose/shotType/stylePreset/ratio from a completed generation (sourceMediaId) as a named preset. Reuse it later via create_generation's templateSetId to put a NEW garment on the exact same model/venue/pose.",
    inputSchema: {
      label: z.string().describe("A name for this preset, e.g. 'Studio white, model A, 3/4 pose'."),
      sourceMediaId: z
        .string()
        .optional()
        .describe("A completed generation's id (from create_generation/get_generation) to capture styling from."),
      toolId: z
        .string()
        .optional()
        .describe(
          "Required if sourceMediaId is omitted. One of: virtual_model, outfit_photo, pro_studio, jewelry_on_model, clothing_ecom_pack, jewelry_ecom_pack.",
        ),
      images: z
        .object({ fashion_model: z.string().optional(), venue: z.string().optional() })
        .optional()
        .describe("Required if sourceMediaId is omitted."),
      pose: z.string().optional(),
      shotType: z.string().optional(),
      stylePreset: z.string().optional(),
      ratio: z.string().optional(),
    },
  },
  async (args) => {
    try {
      return textResult(await createTemplateSet(args));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "list_template_sets",
  {
    title: "List saved template sets",
    description: "Lists every style preset saved on this account (see create_template_set).",
    inputSchema: {},
  },
  async () => {
    try {
      return textResult(await listTemplateSets());
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "delete_template_set",
  {
    title: "Delete a saved template set",
    description: "Permanently deletes a saved style preset.",
    inputSchema: { id: z.string() },
  },
  async ({ id }) => {
    try {
      return textResult(await deleteTemplateSet(id));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "list_ready_template_sets",
  {
    title: "Browse Fashio's ready-made photoshoot library",
    description:
      "Browse Fashio's own curated 'ready photoshoot' catalogue (one model + one venue + N pinned poses each) — NOT the caller's own saved presets, see list_template_sets for those. Use with create_catalog_job.",
    inputSchema: {
      query: z.string().optional().describe("Free-text search."),
      category: z.string().optional(),
      featuredOnly: z.boolean().optional(),
      sort: z.enum(["popular", "newest", "curated"]).optional(),
      gender: z.string().optional(),
      setting: z.string().optional(),
      lighting: z.string().optional(),
      mood: z.string().optional(),
      palette: z.string().optional(),
      type: z.string().optional(),
      limit: z.number().min(1).max(60).optional(),
      startAfter: z.number().optional().describe("Cursor from the previous page's response."),
    },
  },
  async (args) => {
    try {
      return textResult(await listReadyTemplateSets(args));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "get_ready_template_set",
  {
    title: "Get one ready-made photoshoot set",
    description:
      "Fetches one entry from Fashio's curated photoshoot library, including its list of shots (each with an id you can pass to create_catalog_job's shotIds).",
    inputSchema: { id: z.string() },
  },
  async ({ id }) => {
    try {
      return textResult(await getReadyTemplateSet(id));
    } catch (e) {
      return errorResult(e);
    }
  },
);

server.registerTool(
  "create_catalog_job",
  {
    title: "Generate a full catalogue from a ready-made photoshoot set",
    description:
      "Runs your product photo(s) through every shot (or a chosen subset) of one of Fashio's curated photoshoot sets (see list_ready_template_sets), producing one image per shot. Billed per shot. Poll with get_generation — resultUrls holds every shot's output once completed.",
    inputSchema: {
      readyTemplateSetId: z.string().describe("id from list_ready_template_sets."),
      shotIds: z.array(z.string()).optional().describe("Subset of the set's shots. Omit to generate every shot."),
      images: z
        .object({
          garment_photo: z.string().optional(),
          garment_photos: z.array(z.string()).optional(),
        })
        .describe("Your product photo(s) — from upload_image or your own hosting."),
      ratio: z.string().optional(),
      modelId: z.string().optional().describe("Optional image-to-image model override."),
    },
  },
  async (args) => {
    try {
      return textResult(await createCatalogJob(args));
    } catch (e) {
      return errorResult(e);
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("fashio-mcp: connected (stdio)");
}

main().catch((e) => {
  console.error("fashio-mcp: fatal error", e);
  process.exit(1);
});

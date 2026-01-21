import { z } from "zod";
import { VALID_SERVICES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants.js";

// Common schemas
export const serviceSchema = z
  .enum(VALID_SERVICES)
  .optional()
  .describe(
    "Git hosting service provider. Defaults to 'github'. Options: github, gitlab, bitbucket"
  );

export const ownerSchema = z
  .string()
  .min(1)
  .describe("Repository owner/organization name (e.g., 'facebook', 'microsoft')");

export const repoSchema = z
  .string()
  .min(1)
  .describe("Repository name (e.g., 'react', 'vscode')");

export const branchSchema = z
  .string()
  .optional()
  .describe("Branch name. If not specified, uses the repository's default branch");

export const shaSchema = z
  .string()
  .optional()
  .describe("Git commit SHA. If not specified, uses the latest commit on the branch");

export const pageSchema = z
  .number()
  .int()
  .positive()
  .optional()
  .describe("Page number for pagination (1-indexed)");

export const pageSizeSchema = z
  .number()
  .int()
  .min(1)
  .max(MAX_PAGE_SIZE)
  .optional()
  .default(DEFAULT_PAGE_SIZE)
  .describe(`Number of results per page (1-${MAX_PAGE_SIZE}, default: ${DEFAULT_PAGE_SIZE})`);

// Tool-specific schemas

// Coverage Totals
export const getCoverageTotalsSchema = z.object({
  owner: ownerSchema,
  repo: repoSchema,
  service: serviceSchema,
  branch: branchSchema,
  sha: shaSchema,
});

// File Coverage
export const getFileCoverageSchema = z.object({
  owner: ownerSchema,
  repo: repoSchema,
  path: z
    .string()
    .min(1)
    .describe("File path relative to repository root (e.g., 'src/utils/helper.ts')"),
  service: serviceSchema,
  branch: branchSchema,
  sha: shaSchema,
});

// Coverage Tree
export const getCoverageTreeSchema = z.object({
  owner: ownerSchema,
  repo: repoSchema,
  service: serviceSchema,
  branch: branchSchema,
  sha: shaSchema,
  path: z
    .string()
    .optional()
    .describe("Directory path to start from (e.g., 'src/components')"),
  depth: z
    .number()
    .int()
    .min(1)
    .max(10)
    .optional()
    .describe("How deep to traverse the tree (1-10)"),
});

// Compare Coverage
export const compareCoverageSchema = z.object({
  owner: ownerSchema,
  repo: repoSchema,
  service: serviceSchema,
  base: z
    .string()
    .optional()
    .describe("Base commit SHA or branch name for comparison"),
  head: z
    .string()
    .optional()
    .describe("Head commit SHA or branch name for comparison"),
  pullid: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Pull request ID to compare. If provided, base and head are ignored"),
});

// List Repositories
export const listRepositoriesSchema = z.object({
  owner: ownerSchema,
  service: serviceSchema,
  page: pageSchema,
  page_size: pageSizeSchema,
  active: z
    .boolean()
    .optional()
    .describe("Filter by active status. If true, only returns repos with recent coverage uploads"),
  names: z
    .array(z.string())
    .optional()
    .describe("Filter by specific repository names"),
});

// Get Repository
export const getRepositorySchema = z.object({
  owner: ownerSchema,
  repo: repoSchema,
  service: serviceSchema,
});

// List Commits
export const listCommitsSchema = z.object({
  owner: ownerSchema,
  repo: repoSchema,
  service: serviceSchema,
  branch: branchSchema,
  page: pageSchema,
  page_size: pageSizeSchema,
});

// List Pull Requests
export const listPullsSchema = z.object({
  owner: ownerSchema,
  repo: repoSchema,
  service: serviceSchema,
  page: pageSchema,
  page_size: pageSizeSchema,
  state: z
    .enum(["open", "closed", "merged"])
    .optional()
    .describe("Filter by PR state"),
});

// Export schema types for use in tools
export type GetCoverageTotalsInput = z.infer<typeof getCoverageTotalsSchema>;
export type GetFileCoverageInput = z.infer<typeof getFileCoverageSchema>;
export type GetCoverageTreeInput = z.infer<typeof getCoverageTreeSchema>;
export type CompareCoverageInput = z.infer<typeof compareCoverageSchema>;
export type ListRepositoriesInput = z.infer<typeof listRepositoriesSchema>;
export type GetRepositoryInput = z.infer<typeof getRepositorySchema>;
export type ListCommitsInput = z.infer<typeof listCommitsSchema>;
export type ListPullsInput = z.infer<typeof listPullsSchema>;

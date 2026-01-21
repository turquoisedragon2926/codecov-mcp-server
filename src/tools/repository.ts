import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCodecovClient } from "../services/codecov-client.js";
import {
  listRepositoriesSchema,
  getRepositorySchema,
  listCommitsSchema,
  listPullsSchema,
} from "../schemas/index.js";
import type { Service } from "../constants.js";

export function registerRepositoryTools(server: McpServer): void {
  // List Repositories
  server.tool(
    "codecov_list_repositories",
    "List repositories for an owner/organization that have coverage data in Codecov. Useful for discovering which repos have coverage configured.",
    listRepositoriesSchema.shape,
    async (args) => {
      try {
        const client = getCodecovClient();
        const result = await client.listRepositories(args.owner, {
          service: args.service as Service | undefined,
          page: args.page,
          pageSize: args.page_size,
          active: args.active,
          names: args.names,
        });

        const repos = result.results.map((repo) => ({
          name: repo.name,
          active: repo.active,
          language: repo.language,
          default_branch: repo.branch,
          coverage: repo.totals?.coverage !== undefined ? repo.totals.coverage.toFixed(2) + "%" : "N/A",
          last_updated: repo.updatestamp,
        }));

        const summary = {
          total_count: result.count,
          page_info: {
            has_next: !!result.next,
            has_previous: !!result.previous,
            total_pages: result.total_pages,
          },
          repositories: repos,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // Get Repository
  server.tool(
    "codecov_get_repository",
    "Get detailed information about a specific repository including its coverage configuration and current totals.",
    getRepositorySchema.shape,
    async (args) => {
      try {
        const client = getCodecovClient();
        const result = await client.getRepository(
          args.owner,
          args.repo,
          args.service as Service | undefined
        );

        const summary = {
          name: result.name,
          active: result.active,
          activated: result.activated,
          private: result.private,
          language: result.language,
          default_branch: result.branch,
          owner: {
            username: result.author.username,
            service: result.author.service,
          },
          coverage: result.totals
            ? {
                percentage: result.totals.coverage?.toFixed(2) + "%",
                lines: result.totals.lines,
                hits: result.totals.hits,
                misses: result.totals.misses,
                files: result.totals.files,
              }
            : "No coverage data available",
          last_updated: result.updatestamp,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // List Commits
  server.tool(
    "codecov_list_commits",
    "List commits that have coverage data uploaded. Shows commit SHA, message, author, and coverage totals for each commit.",
    listCommitsSchema.shape,
    async (args) => {
      try {
        const client = getCodecovClient();
        const result = await client.listCommits(args.owner, args.repo, {
          service: args.service as Service | undefined,
          page: args.page,
          pageSize: args.page_size,
          branch: args.branch,
        });

        const commits = result.results.map((commit) => ({
          sha: commit.commitid,
          short_sha: commit.commitid.substring(0, 7),
          message: commit.message?.split("\n")[0] ?? null, // First line only
          branch: commit.branch,
          author: commit.author?.username ?? commit.author?.name ?? "Unknown",
          timestamp: commit.timestamp,
          ci_passed: commit.ci_passed,
          state: commit.state,
          coverage: commit.totals?.coverage !== undefined ? commit.totals.coverage.toFixed(2) + "%" : "N/A",
        }));

        const summary = {
          total_count: result.count,
          page_info: {
            has_next: !!result.next,
            has_previous: !!result.previous,
            total_pages: result.total_pages,
          },
          commits,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // List Pull Requests
  server.tool(
    "codecov_list_pulls",
    "List pull requests with their coverage information. Shows PR title, state, base/head commits, and coverage comparison.",
    listPullsSchema.shape,
    async (args) => {
      try {
        const client = getCodecovClient();
        const result = await client.listPullRequests(args.owner, args.repo, {
          service: args.service as Service | undefined,
          page: args.page,
          pageSize: args.page_size,
          state: args.state,
        });

        const pulls = result.results.map((pr) => ({
          id: pr.pullid,
          title: pr.title,
          state: pr.state,
          author: pr.author?.username ?? pr.author?.name ?? "Unknown",
          base: pr.base
            ? {
                branch: pr.base.branch,
                commit: pr.base.commitid?.substring(0, 7),
              }
            : null,
          head: pr.head
            ? {
                branch: pr.head.branch,
                commit: pr.head.commitid?.substring(0, 7),
              }
            : null,
          last_updated: pr.updatestamp,
        }));

        const summary = {
          total_count: result.count,
          page_info: {
            has_next: !!result.next,
            has_previous: !!result.previous,
            total_pages: result.total_pages,
          },
          pull_requests: pulls,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}

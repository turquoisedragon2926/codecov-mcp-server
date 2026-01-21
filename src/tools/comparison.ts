import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCodecovClient } from "../services/codecov-client.js";
import { compareCoverageSchema } from "../schemas/index.js";
import type { Service } from "../constants.js";

export function registerComparisonTools(server: McpServer): void {
  // Compare Coverage
  server.tool(
    "codecov_compare_coverage",
    "Compare coverage between two commits, branches, or for a pull request. Shows coverage diff, changed files, and patch coverage. Essential for reviewing coverage impact of changes.",
    compareCoverageSchema.shape,
    async (args) => {
      try {
        const client = getCodecovClient();
        const result = await client.compareCoverage(args.owner, args.repo, {
          service: args.service as Service | undefined,
          base: args.base,
          head: args.head,
          pullid: args.pullid,
        });

        // Calculate coverage change
        const baseCoverage = result.totals.base?.coverage ?? null;
        const headCoverage = result.totals.head.coverage;
        const coverageChange =
          baseCoverage !== null ? headCoverage - baseCoverage : null;

        // Format file changes
        const changedFiles = result.files
          .filter((f) => f.has_diff || f.change_summary)
          .map((file) => {
            const baseCov = file.totals.base?.coverage;
            const headCov = file.totals.head?.coverage;
            const change = baseCov !== undefined && headCov !== undefined
              ? headCov - baseCov
              : null;

            return {
              name: file.name,
              base_coverage: baseCov !== undefined ? baseCov.toFixed(2) + "%" : "N/A",
              head_coverage: headCov !== undefined ? headCov.toFixed(2) + "%" : "N/A",
              change: change !== null ? (change >= 0 ? "+" : "") + change.toFixed(2) + "%" : "N/A",
              patch: file.totals.patch
                ? {
                    coverage: file.totals.patch.coverage?.toFixed(2) + "%",
                    hits: file.totals.patch.hits,
                    misses: file.totals.patch.misses,
                  }
                : null,
              lines_added: file.stats?.added ?? 0,
              lines_removed: file.stats?.removed ?? 0,
            };
          });

        // Sort by coverage change (most negative first)
        changedFiles.sort((a, b) => {
          const aChange = parseFloat(a.change) || 0;
          const bChange = parseFloat(b.change) || 0;
          return aChange - bChange;
        });

        const summary = {
          comparison: {
            base_commit: result.base_commit?.substring(0, 7) ?? "N/A",
            head_commit: result.head_commit.substring(0, 7),
          },
          coverage_totals: {
            base: baseCoverage !== null ? baseCoverage.toFixed(2) + "%" : "N/A",
            head: headCoverage.toFixed(2) + "%",
            change:
              coverageChange !== null
                ? (coverageChange >= 0 ? "+" : "") + coverageChange.toFixed(2) + "%"
                : "N/A",
          },
          patch_coverage: result.totals.patch
            ? {
                percentage: result.totals.patch.coverage?.toFixed(2) + "%",
                hits: result.totals.patch.hits,
                misses: result.totals.patch.misses,
                partials: result.totals.patch.partials,
              }
            : "No patch coverage data",
          files_changed: changedFiles.length,
          untracked_files: result.untracked.length,
          has_unmerged_base_commits: result.has_unmerged_base_commits,
          changed_files: changedFiles.slice(0, 20), // Limit to 20 files
        };

        // Add warning if there are untracked files
        let text = JSON.stringify(summary, null, 2);
        if (result.untracked.length > 0) {
          text +=
            "\n\n⚠️ Untracked files (new files without coverage):\n" +
            result.untracked.slice(0, 10).join("\n");
          if (result.untracked.length > 10) {
            text += `\n... and ${result.untracked.length - 10} more`;
          }
        }

        return {
          content: [
            {
              type: "text" as const,
              text,
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

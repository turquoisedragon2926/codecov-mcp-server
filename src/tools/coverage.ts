import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getCodecovClient } from "../services/codecov-client.js";
import {
  getCoverageTotalsSchema,
  getFileCoverageSchema,
  getCoverageTreeSchema,
} from "../schemas/index.js";
import type { Service } from "../constants.js";

export function registerCoverageTools(server: McpServer): void {
  // Get Coverage Totals
  server.tool(
    "codecov_get_coverage_totals",
    "Get overall coverage metrics for a repository. Returns coverage percentage, lines covered/missed, and other totals. Use this to check the current coverage status of a repo.",
    getCoverageTotalsSchema.shape,
    async (args) => {
      try {
        const client = getCodecovClient();
        const result = await client.getCoverageTotals(args.owner, args.repo, {
          service: args.service as Service | undefined,
          branch: args.branch,
          sha: args.sha,
        });

        const totals = result.totals;
        const summary = {
          coverage_percentage: totals.coverage?.toFixed(2) + "%",
          lines: {
            total: totals.lines,
            covered: totals.hits,
            missed: totals.misses,
            partial: totals.partials,
          },
          files_count: totals.files,
          branches: totals.branches,
          methods: totals.methods,
          complexity: {
            total: totals.complexity_total,
            ratio: totals.complexity_ratio?.toFixed(2),
          },
          commit_sha: result.commit_sha,
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

  // Get File Coverage
  server.tool(
    "codecov_get_file_coverage",
    "Get detailed line-by-line coverage for a specific file. Shows which lines are covered, missed, or partially covered. Essential for identifying untested code in a specific file.",
    getFileCoverageSchema.shape,
    async (args) => {
      try {
        const client = getCodecovClient();
        const result = await client.getFileCoverage(args.owner, args.repo, args.path, {
          service: args.service as Service | undefined,
          branch: args.branch,
          sha: args.sha,
        });

        // Analyze line coverage
        const lineCoverage = result.line_coverage || [];
        const missedLines: number[] = [];
        const coveredLines: number[] = [];
        const partialLines: number[] = [];

        for (const line of lineCoverage) {
          if (line.coverage === 0) {
            missedLines.push(line.line_number);
          } else if (line.coverage !== null && line.coverage > 0) {
            if (line.is_partial_hit) {
              partialLines.push(line.line_number);
            } else {
              coveredLines.push(line.line_number);
            }
          }
        }

        // Group consecutive lines into ranges for readability
        const groupLines = (lines: number[]): string => {
          if (lines.length === 0) return "none";

          const ranges: string[] = [];
          let start = lines[0];
          let end = lines[0];

          for (let i = 1; i <= lines.length; i++) {
            if (i < lines.length && lines[i] === end + 1) {
              end = lines[i];
            } else {
              ranges.push(start === end ? `${start}` : `${start}-${end}`);
              if (i < lines.length) {
                start = lines[i];
                end = lines[i];
              }
            }
          }

          return ranges.join(", ");
        };

        const summary = {
          file: result.name,
          commit_sha: result.commit_sha,
          coverage_percentage: result.totals?.coverage?.toFixed(2) + "%",
          totals: {
            lines: result.totals?.lines,
            hits: result.totals?.hits,
            misses: result.totals?.misses,
            partials: result.totals?.partials,
          },
          uncovered_lines: groupLines(missedLines),
          partial_lines: groupLines(partialLines),
          uncovered_line_count: missedLines.length,
          commit_file_url: result.commit_file_url,
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

  // Get Coverage Tree
  server.tool(
    "codecov_get_coverage_tree",
    "Get hierarchical coverage report showing coverage by directory and file. Useful for understanding which parts of the codebase have low coverage.",
    getCoverageTreeSchema.shape,
    async (args) => {
      try {
        const client = getCodecovClient();
        const result = await client.getCoverageTree(args.owner, args.repo, {
          service: args.service as Service | undefined,
          branch: args.branch,
          sha: args.sha,
          path: args.path,
          depth: args.depth,
        });

        // Format the tree for better readability
        const formatNode = (
          node: {
            name: string;
            full_path: string;
            coverage: number;
            lines: number;
            hits: number;
            misses: number;
            children?: typeof result;
          },
          depth: number = 0
        ): string => {
          const indent = "  ".repeat(depth);
          const coverage = node.coverage?.toFixed(1) ?? "N/A";
          const isDir = node.children && node.children.length > 0;
          const icon = isDir ? "📁" : "📄";

          let line = `${indent}${icon} ${node.name} - ${coverage}% (${node.hits}/${node.lines} lines)`;

          if (isDir && node.children) {
            for (const child of node.children) {
              line += "\n" + formatNode(child, depth + 1);
            }
          }

          return line;
        };

        let formatted = "Coverage Tree:\n\n";
        for (const node of result) {
          formatted += formatNode(node) + "\n";
        }

        return {
          content: [
            {
              type: "text" as const,
              text: formatted,
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

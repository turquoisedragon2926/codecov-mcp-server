---
name: codecov
description: Check code coverage using Codecov MCP server. Use when user asks to check coverage, find untested code, compare branch coverage, review PR coverage impact, or identify files needing tests. Triggers on phrases like "check coverage", "what's the coverage", "which lines need tests", "coverage for this file", "compare coverage", "PR coverage".
---

# Codecov Coverage Checks

Query Codecov data to check coverage before pushing, find untested code, and compare branches.

## Prerequisites

Ensure the codecov MCP server is configured:

```json
{
  "mcpServers": {
    "codecov": {
      "command": "npx",
      "args": ["codecov-mcp-server"],
      "env": { "CODECOV_API_TOKEN": "..." }
    }
  }
}
```

## Common Workflows

### Check Repository Coverage

```
Use codecov_get_coverage_totals with owner and repo.
Report: coverage percentage, lines covered/missed, file count.
```

### Check File Coverage

```
Use codecov_get_file_coverage with owner, repo, and path.
Report: coverage percentage, uncovered line numbers, total lines.
Suggest specific tests for uncovered lines if requested.
```

### Pre-push Coverage Check

1. Identify changed files from git status/diff
2. For each changed file, call codecov_get_file_coverage
3. Report files with <80% coverage
4. Suggest which files need tests before pushing

### Compare Branch Coverage

```
Use codecov_compare_coverage with owner, repo, and base/head branches.
Report: coverage change (+/-%), files with decreased coverage, patch coverage.
```

### PR Coverage Review

```
Use codecov_compare_coverage with owner, repo, and pullid.
Report: overall coverage change, files with coverage drops, untested new code.
```

### Find Low Coverage Areas

```
Use codecov_get_coverage_tree with owner, repo, and optional path/depth.
Report: directories/files sorted by coverage (lowest first).
```

## Tool Reference

| Tool | Use For |
|------|---------|
| `codecov_get_coverage_totals` | Overall repo coverage |
| `codecov_get_file_coverage` | Specific file line coverage |
| `codecov_get_coverage_tree` | Browse coverage by directory |
| `codecov_compare_coverage` | Compare commits/branches/PRs |
| `codecov_list_repositories` | Find repos with coverage |
| `codecov_get_repository` | Repo details and config |
| `codecov_list_commits` | Commits with coverage data |
| `codecov_list_pulls` | PRs with coverage info |

## Output Format

Keep coverage reports concise:

```
## Coverage: owner/repo

**Overall**: 78.5% (1,234/1,571 lines)

### Files needing attention
- src/api/handler.ts: 45% (lines 23-45, 67-89 uncovered)
- src/utils/parser.ts: 62% (lines 12-18 uncovered)

### Recommendation
Add tests for handler.ts error paths before pushing.
```

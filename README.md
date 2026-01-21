# Codecov MCP Server

An MCP (Model Context Protocol) server that integrates with Codecov's API, enabling Claude Code to check code coverage before pushing changes.

## Features

- **Coverage Totals**: Get overall coverage metrics for any repository
- **File Coverage**: Get line-by-line coverage for specific files
- **Coverage Tree**: Browse hierarchical coverage reports by directory
- **Compare Coverage**: Compare coverage between commits, branches, or PRs
- **Repository Info**: List and explore repositories with coverage data
- **Commit History**: View commits with their coverage metrics
- **Pull Requests**: List PRs with coverage information

## Installation

### Via npx (Recommended)

```bash
npx codecov-mcp-server
```

### Via npm (Global)

```bash
npm install -g codecov-mcp-server
codecov-mcp-server
```

### From Source

```bash
git clone https://github.com/turquoisedragon2926/codecov-mcp-server.git
cd codecov-mcp-server
npm install
npm run build
```

## Configuration

### Get Your Codecov API Token

1. Go to [Codecov Settings](https://app.codecov.io/account/access)
2. Click "Generate Token"
3. Copy the token

### Claude Code Configuration

**Option 1: Using `claude mcp add` (Recommended)**

```bash
claude mcp add codecov -e CODECOV_API_TOKEN=your-token-here -- npx codecov-mcp-server
```

**Option 2: Manual JSON config**

Add to your Claude Code MCP settings (`~/.claude.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "codecov": {
      "command": "npx",
      "args": ["codecov-mcp-server"],
      "env": {
        "CODECOV_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

For local development:

```json
{
  "mcpServers": {
    "codecov": {
      "command": "node",
      "args": ["/path/to/codecov-mcp-server/dist/index.js"],
      "env": {
        "CODECOV_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Usage

### CLI Options

```bash
codecov-mcp-server [options]

Options:
  -t, --transport <type>  Transport type: stdio (default) or http
  -p, --port <number>     Port for HTTP transport (default: 3000)
  -h, --help              Show help message
```

### Environment Variables

- `CODECOV_API_TOKEN` (required): Your Codecov API token
- `PORT`: Port for HTTP transport (alternative to --port flag)

### Available Tools

| Tool | Description |
|------|-------------|
| `codecov_get_coverage_totals` | Get overall coverage metrics for a repository |
| `codecov_get_file_coverage` | Get line-by-line coverage for a specific file |
| `codecov_get_coverage_tree` | Get hierarchical coverage report by directory |
| `codecov_compare_coverage` | Compare coverage between commits, branches, or PRs |
| `codecov_list_repositories` | List repositories for an owner with coverage data |
| `codecov_get_repository` | Get detailed repository information |
| `codecov_list_commits` | List commits with coverage data |
| `codecov_list_pulls` | List pull requests with coverage information |

### Example Workflow with Claude Code

1. **Check current coverage:**
   > "What's the coverage for my-org/my-repo?"

2. **Check file coverage:**
   > "What's the coverage for src/utils/helper.ts?"

3. **Find uncovered code:**
   > "Which lines in src/api/handler.ts need tests?"

4. **Compare branches:**
   > "How does coverage on feature-branch compare to main?"

5. **Review PR coverage:**
   > "What's the coverage impact of PR #123?"

## CI/CD Setup

For this MCP server to work, your repository needs to upload coverage data to Codecov. Here's how to set it up:

### GitHub Actions Example

```yaml
name: Test & Coverage

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v5
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

### Other CI Systems

Codecov supports many CI systems. See the [Codecov documentation](https://docs.codecov.com/docs/quick-start) for setup guides.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Supported Services

- GitHub (default)
- GitLab
- Bitbucket

Specify the service when querying if not using GitHub:

```
"Check coverage for my-group/my-project on GitLab"
```

## API Reference

All tools accept the following common parameters:

- `owner`: Repository owner/organization name (required)
- `repo`: Repository name (required for most tools)
- `service`: Git hosting service (`github`, `gitlab`, `bitbucket`). Defaults to `github`
- `branch`: Branch name. Defaults to repository's default branch
- `sha`: Commit SHA. Defaults to latest commit

### Tool-Specific Parameters

**codecov_get_file_coverage:**
- `path`: File path relative to repository root (required)

**codecov_get_coverage_tree:**
- `path`: Directory path to start from
- `depth`: How deep to traverse (1-10)

**codecov_compare_coverage:**
- `base`: Base commit/branch for comparison
- `head`: Head commit/branch for comparison
- `pullid`: Pull request ID (overrides base/head)

**Pagination (list tools):**
- `page`: Page number (1-indexed)
- `page_size`: Results per page (1-100, default: 25)

## License

MIT

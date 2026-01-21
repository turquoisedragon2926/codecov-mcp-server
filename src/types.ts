import type { Service } from "./constants.js";

// Common types
export interface Owner {
  service: Service;
  username: string;
  name: string | null;
  avatar_url: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total_pages: number;
}

// Repository types
export interface Repository {
  name: string;
  private: boolean;
  updatestamp: string | null;
  author: Owner;
  language: string | null;
  branch: string;
  active: boolean;
  activated: boolean;
  totals: CoverageTotals | null;
}

export interface RepositoryDetail extends Repository {
  upload_token: string | null;
  yaml: string | null;
}

// Coverage types
export interface CoverageTotals {
  files: number;
  lines: number;
  hits: number;
  misses: number;
  partials: number;
  coverage: number;
  branches: number;
  methods: number;
  messages: number;
  sessions: number;
  complexity: number;
  complexity_total: number;
  complexity_ratio: number;
  diff: DiffTotals | null;
}

export interface DiffTotals {
  files: number | null;
  lines: number | null;
  hits: number | null;
  misses: number | null;
  partials: number | null;
  coverage: number | null;
  branches: number | null;
  methods: number | null;
  messages: number | null;
}

export interface CoverageReport {
  totals: CoverageTotals;
  commit_file_url: string;
  files: FileReport[];
}

export interface FileReport {
  name: string;
  totals: CoverageTotals;
}

export interface FileCoverageReport {
  name: string;
  totals: CoverageTotals;
  line_coverage: LineCoverage[];
  commit_sha: string;
  commit_file_url: string;
}

export interface LineCoverage {
  line_number: number;
  coverage: number | null; // null = not relevant, 0 = miss, 1+ = hits
  is_partial_hit?: boolean;
}

// Tree types for coverage hierarchy
export interface CoverageTreeNode {
  name: string;
  full_path: string;
  coverage: number;
  lines: number;
  hits: number;
  partials: number;
  misses: number;
  children?: CoverageTreeNode[];
}

// Commit types
export interface Commit {
  commitid: string;
  message: string | null;
  timestamp: string;
  ci_passed: boolean | null;
  author: CommitAuthor | null;
  branch: string | null;
  totals: CoverageTotals | null;
  state: "complete" | "pending" | "error" | "skipped";
  parent: string | null;
}

export interface CommitAuthor {
  id: number | null;
  username: string | null;
  name: string | null;
  email: string | null;
}

// Pull Request types
export interface PullRequest {
  pullid: number;
  title: string | null;
  state: "open" | "closed" | "merged";
  updatestamp: string | null;
  author: CommitAuthor | null;
  base: CommitReference | null;
  head: CommitReference | null;
  compared_to: CommitReference | null;
}

export interface CommitReference {
  commitid: string;
  branch: string | null;
}

// Comparison types
export interface CoverageComparison {
  base_commit: string | null;
  head_commit: string;
  totals: ComparisonTotals;
  commit_uploads: CommitUpload[];
  diff: ComparisonDiff | null;
  files: ComparisonFile[];
  untracked: string[];
  has_unmerged_base_commits: boolean;
}

export interface ComparisonTotals {
  base: CoverageTotals | null;
  head: CoverageTotals;
  patch: PatchTotals | null;
}

export interface PatchTotals {
  hits: number;
  misses: number;
  partials: number;
  coverage: number;
}

export interface CommitUpload {
  commitid: string;
  message: string | null;
  timestamp: string;
  ci_passed: boolean | null;
  author: CommitAuthor | null;
  totals: CoverageTotals | null;
}

export interface ComparisonDiff {
  git_commits: GitCommit[];
}

export interface GitCommit {
  commitid: string;
  message: string;
  timestamp: string;
  author: CommitAuthor;
}

export interface ComparisonFile {
  name: string;
  totals: FileTotals;
  has_diff: boolean;
  stats: FileStats | null;
  change_summary: FileChangeSummary | null;
}

export interface FileTotals {
  base: CoverageTotals | null;
  head: CoverageTotals | null;
  patch: PatchTotals | null;
}

export interface FileStats {
  added: number;
  removed: number;
}

export interface FileChangeSummary {
  hits: number;
  misses: number;
  partials: number;
}

// API Error types
export interface CodecovApiError {
  detail?: string;
  message?: string;
}

import axios, { AxiosInstance, AxiosError } from "axios";
import {
  CODECOV_API_BASE_URL,
  DEFAULT_SERVICE,
  DEFAULT_PAGE_SIZE,
  type Service,
} from "../constants.js";
import type {
  Repository,
  RepositoryDetail,
  Commit,
  PullRequest,
  CoverageTotals,
  FileCoverageReport,
  CoverageComparison,
  CoverageTreeNode,
  PaginatedResponse,
  CodecovApiError as CodecovApiErrorResponse,
} from "../types.js";

export class CodecovApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public detail?: string
  ) {
    super(message);
    this.name = "CodecovApiError";
  }
}

export class CodecovClient {
  private client: AxiosInstance;
  private defaultService: Service;

  constructor(apiToken: string, defaultService: Service = DEFAULT_SERVICE) {
    if (!apiToken) {
      throw new Error(
        "CODECOV_API_TOKEN is required. Set it as an environment variable."
      );
    }

    this.defaultService = defaultService;
    this.client = axios.create({
      baseURL: CODECOV_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json",
      },
    });
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<CodecovApiErrorResponse>;
      const status = axiosError.response?.status;
      const detail =
        axiosError.response?.data?.detail || axiosError.response?.data?.message;

      if (status === 401) {
        throw new CodecovApiError(
          "Authentication failed. Check your CODECOV_API_TOKEN.",
          status,
          detail
        );
      }
      if (status === 403) {
        throw new CodecovApiError(
          "Access denied. You may not have permission to access this resource.",
          status,
          detail
        );
      }
      if (status === 404) {
        throw new CodecovApiError(
          "Resource not found. Check the owner, repo, or path.",
          status,
          detail
        );
      }
      if (status === 429) {
        throw new CodecovApiError("Rate limit exceeded. Try again later.", status, detail);
      }

      throw new CodecovApiError(
        detail || axiosError.message || "Unknown API error",
        status,
        detail
      );
    }

    if (error instanceof Error) {
      throw new CodecovApiError(error.message);
    }

    throw new CodecovApiError("Unknown error occurred");
  }

  private getService(service?: Service): Service {
    return service || this.defaultService;
  }

  // Repository methods
  async listRepositories(
    owner: string,
    options?: {
      service?: Service;
      page?: number;
      pageSize?: number;
      active?: boolean;
      names?: string[];
    }
  ): Promise<PaginatedResponse<Repository>> {
    try {
      const service = this.getService(options?.service);
      const params: Record<string, string | number | boolean> = {
        page_size: options?.pageSize || DEFAULT_PAGE_SIZE,
      };

      if (options?.page) params.page = options.page;
      if (options?.active !== undefined) params.active = options.active;
      if (options?.names?.length) params.names = options.names.join(",");

      const response = await this.client.get<PaginatedResponse<Repository>>(
        `/${service}/${owner}/repos/`,
        { params }
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getRepository(
    owner: string,
    repo: string,
    service?: Service
  ): Promise<RepositoryDetail> {
    try {
      const svc = this.getService(service);
      const response = await this.client.get<RepositoryDetail>(
        `/${svc}/${owner}/repos/${repo}/`
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Coverage methods
  async getCoverageTotals(
    owner: string,
    repo: string,
    options?: {
      service?: Service;
      sha?: string;
      branch?: string;
    }
  ): Promise<{ totals: CoverageTotals; commit_sha: string }> {
    try {
      const service = this.getService(options?.service);
      const params: Record<string, string> = {};

      if (options?.sha) params.sha = options.sha;
      if (options?.branch) params.branch = options.branch;

      const response = await this.client.get<{
        totals: CoverageTotals;
        commit_sha: string;
      }>(`/${service}/${owner}/repos/${repo}/totals/`, { params });

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getFileCoverage(
    owner: string,
    repo: string,
    path: string,
    options?: {
      service?: Service;
      sha?: string;
      branch?: string;
    }
  ): Promise<FileCoverageReport> {
    try {
      const service = this.getService(options?.service);
      const params: Record<string, string> = {};

      if (options?.sha) params.sha = options.sha;
      if (options?.branch) params.branch = options.branch;

      // Encode the path for the URL
      const encodedPath = encodeURIComponent(path);

      const response = await this.client.get<FileCoverageReport>(
        `/${service}/${owner}/repos/${repo}/file_report/${encodedPath}/`,
        { params }
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getCoverageTree(
    owner: string,
    repo: string,
    options?: {
      service?: Service;
      sha?: string;
      branch?: string;
      path?: string;
      depth?: number;
    }
  ): Promise<CoverageTreeNode[]> {
    try {
      const service = this.getService(options?.service);
      const params: Record<string, string | number> = {};

      if (options?.sha) params.sha = options.sha;
      if (options?.branch) params.branch = options.branch;
      if (options?.path) params.path = options.path;
      if (options?.depth) params.depth = options.depth;

      const response = await this.client.get<CoverageTreeNode[]>(
        `/${service}/${owner}/repos/${repo}/report/tree`,
        { params }
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Comparison methods
  async compareCoverage(
    owner: string,
    repo: string,
    options: {
      service?: Service;
      base?: string;
      head?: string;
      pullid?: number;
    }
  ): Promise<CoverageComparison> {
    try {
      const service = this.getService(options.service);
      const params: Record<string, string | number> = {};

      if (options.base) params.base = options.base;
      if (options.head) params.head = options.head;
      if (options.pullid) params.pullid = options.pullid;

      const response = await this.client.get<CoverageComparison>(
        `/${service}/${owner}/repos/${repo}/compare/`,
        { params }
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Commit methods
  async listCommits(
    owner: string,
    repo: string,
    options?: {
      service?: Service;
      page?: number;
      pageSize?: number;
      branch?: string;
    }
  ): Promise<PaginatedResponse<Commit>> {
    try {
      const service = this.getService(options?.service);
      const params: Record<string, string | number> = {
        page_size: options?.pageSize || DEFAULT_PAGE_SIZE,
      };

      if (options?.page) params.page = options.page;
      if (options?.branch) params.branch = options.branch;

      const response = await this.client.get<PaginatedResponse<Commit>>(
        `/${service}/${owner}/repos/${repo}/commits/`,
        { params }
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Pull Request methods
  async listPullRequests(
    owner: string,
    repo: string,
    options?: {
      service?: Service;
      page?: number;
      pageSize?: number;
      state?: "open" | "closed" | "merged";
    }
  ): Promise<PaginatedResponse<PullRequest>> {
    try {
      const service = this.getService(options?.service);
      const params: Record<string, string | number> = {
        page_size: options?.pageSize || DEFAULT_PAGE_SIZE,
      };

      if (options?.page) params.page = options.page;
      if (options?.state) params.state = options.state;

      const response = await this.client.get<PaginatedResponse<PullRequest>>(
        `/${service}/${owner}/repos/${repo}/pulls/`,
        { params }
      );

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Singleton instance (created when needed)
let clientInstance: CodecovClient | null = null;

export function getCodecovClient(): CodecovClient {
  if (!clientInstance) {
    const token = process.env.CODECOV_API_TOKEN;
    if (!token) {
      throw new Error(
        "CODECOV_API_TOKEN environment variable is required. " +
          "Get your token from Codecov settings: Settings > Access > Generate Token"
      );
    }
    clientInstance = new CodecovClient(token);
  }
  return clientInstance;
}

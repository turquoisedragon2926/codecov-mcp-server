export const CODECOV_API_BASE_URL = "https://api.codecov.io/api/v2";

export const DEFAULT_SERVICE = "github";

export const VALID_SERVICES = ["github", "gitlab", "bitbucket"] as const;

export type Service = (typeof VALID_SERVICES)[number];

export const DEFAULT_PAGE_SIZE = 25;

export const MAX_PAGE_SIZE = 100;

export const DEFAULT_PORT = 3000;

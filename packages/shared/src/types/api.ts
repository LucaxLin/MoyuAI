export interface ApiError {
  code: string;
  message: string;
}

export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  EMAIL_EXISTS: "EMAIL_EXISTS",
  INVALID_CODE: "INVALID_CODE",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  RATE_LIMITED: "RATE_LIMITED",
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

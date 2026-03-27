export const APP_NAME = "墨语";
export const APP_DESCRIPTION = "AI驱动的创意画布";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const VERIFICATION_CODE_LENGTH = 6;
export const VERIFICATION_CODE_EXPIRY_MINUTES = 10;
export const VERIFICATION_CODE_COOLDOWN_SECONDS = 60;

export const MAX_PROMPT_LENGTH = 500;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const IMAGE_WIDTH = 1024;
export const IMAGE_HEIGHT = 1024;

export const SUPPORTED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const API_RATE_LIMIT = {
  VERIFICATION_CODE: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 1,
  },
  GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
};

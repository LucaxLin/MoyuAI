import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getLogFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}-${hours}-${minutes}.log`;
}

function getLogFilePath(): string {
  return path.join(LOG_DIR, getLogFileName());
}

function formatMessage(level: string, tag: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  let logLine = `[${timestamp}] [${level}] [${tag}] ${message}`;
  
  if (data !== undefined) {
    if (typeof data === "object") {
      logLine += `\n${JSON.stringify(data, null, 2)}`;
    } else {
      logLine += ` ${String(data)}`;
    }
  }
  
  return logLine;
}

function writeToFile(message: string): void {
  try {
    const logPath = getLogFilePath();
    fs.appendFileSync(logPath, message + "\n", "utf-8");
  } catch (error) {
    console.error("Failed to write log to file:", error);
  }
}

export const logger = {
  info(tag: string, message: string, data?: unknown): void {
    const formattedMessage = formatMessage("INFO", tag, message, data);
    console.log(formattedMessage);
    writeToFile(formattedMessage);
  },

  error(tag: string, message: string, data?: unknown): void {
    const formattedMessage = formatMessage("ERROR", tag, message, data);
    console.error(formattedMessage);
    writeToFile(formattedMessage);
  },

  warn(tag: string, message: string, data?: unknown): void {
    const formattedMessage = formatMessage("WARN", tag, message, data);
    console.warn(formattedMessage);
    writeToFile(formattedMessage);
  },

  debug(tag: string, message: string, data?: unknown): void {
    const formattedMessage = formatMessage("DEBUG", tag, message, data);
    console.debug(formattedMessage);
    writeToFile(formattedMessage);
  },
};

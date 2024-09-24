import { Logger as TsLogger } from "tslog";

interface LoggerConfig {
  log_level: string;
}

interface MyLogObject {
  message: string;
  context: string;
}

const logLevelMapping: Record<string, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

const isBrowser = (): boolean => {
  return (
    typeof window !== "undefined" && typeof window.document !== "undefined"
  );
};

class Logger {
  private log: TsLogger<MyLogObject>;

  constructor(config: LoggerConfig) {
    const logLevel = logLevelMapping[config.log_level] || 2;

    if (isBrowser()) {
      // Configure for browser environment
      this.log = new TsLogger({
        minLevel: logLevel,
        type: "pretty",
        name: "BrowserLogger",
      });
    } else {
      // Configure for CLI environment
      this.log = new TsLogger({
        minLevel: logLevel,
      });
    }
  }

  debug(context: string, message: string) {
    this.log.debug(`[${context}] ${message}`);
  }

  info(context: string, message: string) {
    this.log.info(`[${context}] ${message}`);
  }

  warn(context: string, message: string) {
    this.log.warn(`[${context}] ${message}`);
  }

  error(context: string, message: string) {
    this.log.error(`[${context}] ${message}`);
  }

  fatal(context: string, message: string) {
    this.log.fatal(`[${context}] ${message}`);
  }
}

export default Logger;

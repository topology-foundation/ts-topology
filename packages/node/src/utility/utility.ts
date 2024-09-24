import { Logger as TsLogger } from "tslog";

interface LoggerConfig {
  log_level: string;
}

interface MyLogObject {
  message?: string;
  context?: string;
  [key: string]: any;
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
  private isBrowser: boolean;

  constructor(config: LoggerConfig) {
    const logLevel = logLevelMapping[config.log_level] || 2;
    this.isBrowser = isBrowser();

    if (this.isBrowser) {
      this.log = new TsLogger({
        minLevel: logLevel,
        type: "pretty",
        name: "BrowserLogger",
        prettyLogTemplate: "{{message}}", // Simplified for browser
        prettyLogTimeZone: "local",
        prettyInspectOptions: {
          colors: true,
          depth: 5, // Allows deeper object inspection in browser
        },
      });
    } else {
      this.log = new TsLogger({
        minLevel: logLevel,
      });
    }
  }

  private logMessage(
    level: keyof TsLogger<MyLogObject>,
    context: string,
    message: string | object
  ) {
    if (this.isBrowser) {
      this.log.debug({ context, message }); 
    } else {
      this.log.debug(
        typeof message === "object"
          ? JSON.stringify({ context, ...message }, null, 2)
          : `[${context}] ${message}`
      );
    }
  }


  debug(context: string, message: string | object) {
    this.logMessage("debug", context, message);
  }

  info(context: string, message: string | object) {
    this.logMessage("info", context, message);
  }

  warn(context: string, message: string | object) {
    this.logMessage("warn", context, message);
  }

  error(context: string, message: string | object) {
    this.logMessage("error", context, message);
  }

  fatal(context: string, message: string | object) {
    this.logMessage("fatal", context, message);
  }
}

export default Logger;

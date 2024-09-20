
import fs from "node:fs";


export class Logger {
  private static debugMode: boolean = false;
 
  static logToFile(message: string) {
    const logFilePath = "logs/debug.log";
  
    fs.mkdirSync("logs", { recursive: true });
    fs.appendFileSync(logFilePath, message + "\n");
  }
  static setDebugMode(isDebug: boolean): void {
    this.debugMode = isDebug;
  }

  static formatMessage(level: string, args: any[]) {
    return `[${level}] ${new Date().toISOString()} - ${args.join(" ")}`;
  }


  static debug(...args: any[]) {
    if (this.debugMode) {
      const message = this.formatMessage("DEBUG", args);
      this.logToFile(message);
      console.log(message);
    }
  }


  static info(...args: any[]) {
    if (this.debugMode) {
      const message = this.formatMessage("INFO", args);
      this.logToFile(message);
      console.log(message);
    }
  }


  static error(...args: any[]) {
    const message = this.formatMessage("ERROR", args);
    this.logToFile(message);
    console.error(message);
  }
}

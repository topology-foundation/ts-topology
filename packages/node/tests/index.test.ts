import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import Logger from "../src/utility/utility"; // Adjust the path to your Logger

describe("Logger", () => {

  beforeAll(() => {
    // Mock console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore console methods after tests
    vi.restoreAllMocks();
  });

  it("should log debug messages when log level is 'debug'", () => {
    const logger = new Logger({ log_level: "debug" });
    logger.debug("TestContext", "This is a debug message");

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[TestContext] This is a debug message")
    );
  });

  it("should log info messages when log level is 'info'", () => {
    const logger = new Logger({ log_level: "info" });
    logger.info("TestContext", "This is an info message");

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[TestContext] This is an info message")
    );
  });

  it("should log warn messages when log level is 'warn'", () => {
    const logger = new Logger({ log_level: "warn" });
    logger.warn("TestContext", "This is a warn message");

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[TestContext] This is a warn message")
    );
  });

  it("should log error messages when log level is 'error'", () => {
    const logger = new Logger({ log_level: "error" });
    logger.error("TestContext", "This is an error message");

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[TestContext] This is an error message")
    );
  });

  it("should log fatal messages when log level is 'fatal'", () => {
    const logger = new Logger({ log_level: "fatal" });
    logger.fatal("TestContext", "This is a fatal message");

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("[TestContext] This is a fatal message")
    );
  });
});

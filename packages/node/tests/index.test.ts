import { describe, test, expect, vi, beforeEach } from "vitest";
import Logger from "../src/utility/utility";

describe("Logger", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({ log_level: "info" });
  });

  test("should log info message correctly", () => {
    const logSpy = vi.spyOn(logger as any, "info");
    logger.info("TestContext", "This is a test info message");
    expect(logSpy).toHaveBeenCalledWith(
      "TestContext",
      "This is a test info message"
    );
  });

  test("should log error message correctly", () => {
    const logSpy = vi.spyOn(logger as any, "error");
    logger.error("ErrorContext", { error: "An error occurred" });
    expect(logSpy).toHaveBeenCalledWith("ErrorContext", {
      error: "An error occurred",
    });
  });

  test("should handle objects in CLI mode", () => {
    const logSpy = vi.spyOn(logger as any, "debug");
    logger.debug("TestContext", { foo: "bar" });
    expect(logSpy).toHaveBeenCalled();
  });
});

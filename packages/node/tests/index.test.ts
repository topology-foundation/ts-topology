import { test, expect, vi } from "vitest";
import { Logger } from "../src/utility/utility"; // Adjust the path to your Logger

test("Logger.debug should not log when debug mode is off", () => {
  // Mock console.log to spy on its calls
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  // Set DEBUG_MODE to false
  Logger.setDebugMode(false); // Assuming Logger has a method to set debug mode

  // Call Logger.debug
  Logger.debug("test::debug", "This should not appear");

  // Assert that console.log wasn't called
  expect(logSpy).not.toHaveBeenCalled();

  // Clean up the mock
  logSpy.mockRestore();
});

test("Logger.debug should log when debug mode is on", () => {

  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  Logger.setDebugMode(true); 


  Logger.debug("test::debug", "This should appear");


  expect(logSpy).toHaveBeenCalledWith(
    expect.stringMatching(
      /^\[DEBUG\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z - test::debug This should appear$/
    )
  );

  // Clean up the mock
  logSpy.mockRestore();
});

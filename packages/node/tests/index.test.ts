import { test, expect, vi } from "vitest";
import { Logger } from "../src/utility/utility"; // Adjust the path to your Logger

test("Logger.debug should not log when debug mode is off", () => {
 
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  
  Logger.setDebugMode(false);

 
  Logger.debug("test::debug", "This should not appear");


  expect(logSpy).not.toHaveBeenCalled();


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

 
  logSpy.mockRestore();
});

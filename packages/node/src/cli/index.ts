import { Command } from "commander";
import { VERSION } from "../version";

export const program = new Command();

program.version(VERSION);
program.command("start").action(async () => {
  // const { start } = await import("./run_node");
  // await start();
  console.log("start");
});

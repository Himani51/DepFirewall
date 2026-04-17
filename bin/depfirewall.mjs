#!/usr/bin/env node
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cliPath = path.join(__dirname, "../scripts/cli-scan.ts");

const args = process.argv.slice(2);

// Run the TSX script
const child = spawn("npx", ["tsx", cliPath, ...args], { stdio: "inherit" });

child.on("exit", (code) => {
  process.exit(code || 0);
});

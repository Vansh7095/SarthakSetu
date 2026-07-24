#!/usr/bin/env node
/**
 * SarthakSetu — Doctor Script
 *
 * Checks the development environment for common issues.
 * Run with: pnpm doctor
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const MIN_NODE = 20;
const MIN_PNPM = 9;

let exitCode = 0;

function ok(msg: string) {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
}

function warn(msg: string) {
  console.log(`  \x1b[33m⚠\x1b[0m ${msg}`);
  exitCode = 1;
}

function fail(msg: string) {
  console.log(`  \x1b[31m✗\x1b[0m ${msg}`);
  exitCode = 1;
}

function section(title: string) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

// ---------------------------------------------------------------------------
// Node.js
// ---------------------------------------------------------------------------
section("Node.js");
const nodeVersion = process.version;
const nodeMajor = Number(nodeVersion.replace("v", "").split(".")[0]);
if (nodeMajor >= MIN_NODE) {
  ok(`Node ${nodeVersion} (required >= ${MIN_NODE})`);
} else {
  fail(`Node ${nodeVersion} — upgrade to ${MIN_NODE}+`);
}

// ---------------------------------------------------------------------------
// pnpm
// ---------------------------------------------------------------------------
section("Package Manager");
try {
  const pnpmVersion = execSync("pnpm --version", { encoding: "utf-8" }).trim();
  const pnpmMajor = Number(pnpmVersion.split(".")[0]);
  if (pnpmMajor >= MIN_PNPM) {
    ok(`pnpm ${pnpmVersion} (required >= ${MIN_PNPM})`);
  } else {
    fail(`pnpm ${pnpmVersion} — upgrade to ${MIN_PNPM}+`);
  }
} catch {
  fail("pnpm not found — install with: npm install -g pnpm");
}

// ---------------------------------------------------------------------------
// Environment Variables
// ---------------------------------------------------------------------------
section("Environment Variables");
const envPath = resolve(process.cwd(), ".env");
const envExamplePath = resolve(process.cwd(), ".env.example");

if (existsSync(envPath)) {
  ok(".env file found");
} else if (existsSync(envExamplePath)) {
  warn(".env file missing — copy from .env.example: cp .env.example .env");
} else {
  fail(".env and .env.example both missing");
}

const requiredVars = [
  "DATABASE_URL",
  "CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "VITE_CLERK_PUBLISHABLE_KEY",
];

for (const v of requiredVars) {
  if (process.env[v]) {
    ok(`${v} is set`);
  } else {
    warn(`${v} is not set — add it to .env`);
  }
}

// ---------------------------------------------------------------------------
// PostgreSQL
// ---------------------------------------------------------------------------
section("PostgreSQL");
try {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = url.port || "5432";

    // Try TCP connect via Node
    const net = await import("node:net");
    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection(Number(port), host);
      socket.on("connect", () => {
        socket.end();
        resolve();
      });
      socket.on("error", reject);
      socket.setTimeout(3000, () => {
        socket.destroy();
        reject(new Error("Connection timeout"));
      });
    });
    ok(`PostgreSQL reachable at ${host}:${port}`);
  } else {
    warn("DATABASE_URL not set — cannot test PostgreSQL connection");
  }
} catch (err: any) {
  warn(`PostgreSQL connection failed: ${err.message}`);
  console.log(`    Ensure PostgreSQL is running and DATABASE_URL is correct.`);
}

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------
section("Dependencies");
const nodeModules = resolve(process.cwd(), "node_modules");
if (existsSync(nodeModules)) {
  ok("node_modules exists");
} else {
  fail("node_modules missing — run: pnpm install");
}

const keyPackages = [
  { name: "react", from: "artifacts/sarthaksetu" },
  { name: "express", from: "artifacts/api-server" },
  { name: "drizzle-orm", from: "lib/db" },
  { name: "pg", from: "lib/db" },
  { name: "@clerk/react", from: "artifacts/sarthaksetu" },
  { name: "@clerk/express", from: "artifacts/api-server" },
];

for (const { name: pkg, from: pkgFrom } of keyPackages) {
  // Check in the workspace package's node_modules (pnpm may not hoist everything)
  const pkgPath = resolve(
    process.cwd(),
    pkgFrom,
    "node_modules",
    pkg,
    "package.json",
  );
  const rootPkgPath = resolve(nodeModules, pkg, "package.json");
  const foundPath = existsSync(pkgPath)
    ? pkgPath
    : existsSync(rootPkgPath)
      ? rootPkgPath
      : null;

  if (foundPath) {
    const version = JSON.parse(readFileSync(foundPath, "utf-8")).version;
    ok(`${pkg} @ ${version}`);
  } else {
    fail(`${pkg} not installed — run: pnpm install`);
  }
}

// ---------------------------------------------------------------------------
// Build Artifacts
// ---------------------------------------------------------------------------
section("Build Status");
const apiDist = resolve(process.cwd(), "artifacts/api-server/dist/index.mjs");
const feDist = resolve(
  process.cwd(),
  "artifacts/sarthaksetu/dist/public/index.html",
);

if (existsSync(apiDist)) {
  ok("Backend built (dist/index.mjs)");
} else {
  warn(
    "Backend not built — run: pnpm --filter @workspace/api-server run build",
  );
}

if (existsSync(feDist)) {
  ok("Frontend built (dist/public/index.html)");
} else {
  warn("Frontend not built — run: pnpm --filter @workspace/sarthaksetu run build");
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("\n" + "─".repeat(50));
if (exitCode === 0) {
  console.log("\x1b[32mAll checks passed. You're good to go!\x1b[0m");
  console.log(
    "\nRun \x1b[1mpnpm dev\x1b[0m to start the development environment.",
  );
} else {
  console.log(
    "\x1b[33mSome checks failed. Fix the issues above and run again.\x1b[0m",
  );
}
console.log("─".repeat(50) + "\n");

process.exit(exitCode);

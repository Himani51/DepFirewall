import { glob } from "glob";
import fs from "fs-extra";
import path from "path";
import { builtinModules } from "module";
import https from "https";
import { RULES, ScanRule } from "../src/scanner-rules";

// Configuration & Formats
const ARGS = process.argv.slice(2);
const FORMAT = ARGS.find(a => a.startsWith("--format="))?.split("=")[1] || "text";

interface FirewallConfig {
  rules?: Record<string, "warn" | "error" | "off">;
}

async function loadConfig(): Promise<FirewallConfig> {
  const configPath = path.join(process.cwd(), ".depfirewallrc.json");
  if (await fs.pathExists(configPath)) {
    try {
      return await fs.readJson(configPath);
    } catch (e) {
      if (FORMAT === "text") console.error("⚠️ Could not parse .depfirewallrc.json");
    }
  }
  return { rules: {} };
}

async function getProjectNodeVersion(): Promise<number | null> {
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      if (pkg.engines?.node) {
        const match = pkg.engines.node.match(/\d+/);
        if (match) return parseInt(match[0], 10);
      }
    }
  } catch (e) {}
  return null;
}

async function getDeclaredDependencies(): Promise<Set<string>> {
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      return new Set([
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...Object.keys(pkg.optionalDependencies || {}),
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`)
      ]);
    }
  } catch (e) {}
  return new Set([...builtinModules, ...builtinModules.map(m => `node:${m}`)]);
}

function checkNpmRegistry(packageName: string): Promise<boolean> {
  return new Promise((resolve) => {
    https.get(`https://registry.npmjs.org/${packageName}`, (res) => resolve(res.statusCode === 200))
         .on("error", () => resolve(false));
  });
}

function fetchNpmLatestVersion(packageName: string): Promise<string | null> {
  return new Promise((resolve) => {
    https.get(`https://registry.npmjs.org/${packageName}`, (res) => {
      if (res.statusCode !== 200) { resolve(null); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
         try { resolve(JSON.parse(data)['dist-tags']?.latest || null); } catch(e) { resolve(null); }
      });
    }).on("error", () => resolve(null));
  });
}

interface Issue {
  file: string;
  line: number;
  ruleId: string;
  type: string;
  severity: string;
  message: string;
  snippet: string;
}

async function runCliScan() {
  const config = await loadConfig();
  const IS_AUTOFIX = ARGS.includes("--fix");
  
  if (FORMAT === "text") {
    console.log("\x1b[36m%s\x1b[0m", "🚀 Dependency Firewall - Advanced CLI Scanner");
    console.log("Scanning directory: " + process.cwd());
    if (IS_AUTOFIX) {
      console.log("\x1b[32m%s\x1b[0m", "✨ Auto-fix mode active.");
    }
  }

  const declaredDeps = await getDeclaredDependencies();
  const projectNodeVersion = await getProjectNodeVersion();
  const ctx = { nodeVersion: projectNodeVersion, fileContent: "" };

  const files = await glob("**/*.{ts,tsx,js}", { 
    ignore: ["node_modules/**", "dist/**", ".git/**", "scripts/**"] 
  });

  const allIssues: Issue[] = [];
  const importRegex = /(?:import\s+(?:.*)\s+from\s+|require\s*\(\s*)['"]([^./][^'"]*)['"]/g;
  const undeclaredPackagesToVerify = new Map<string, { file: string, line: number, text: string }[]>();

  let totalFixed = 0;

  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    const lines = content.split("\n");
    let needsWrite = false;
    ctx.fileContent = content;
    
    let skipNextLine = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // INLINE SUPPRESSION LOGIC
      if (line.includes("depfirewall-disable-next-line") || line.includes("depfirewall-ignore-next-line")) {
        skipNextLine = true;
        continue;
      }
      if (skipNextLine || line.includes("depfirewall-ignore")) {
        skipNextLine = false;
        continue;
      }

      for (const rule of RULES) {
        if (rule.name === "Outdated Dependency") continue;
        if (config.rules && config.rules[rule.name] === "off") continue;

        if (rule.pattern.test(line)) {
          if (!rule.validator || rule.validator(line, ctx)) {
            // AUTOFIX LOGIC
            if (IS_AUTOFIX && rule.autofix) {
              const newLine = rule.autofix(line);
              lines[i] = newLine;
              line = newLine; // Update for subsequent rules
              needsWrite = true;
              totalFixed++;
              continue; // Don't push issue if it's fixed
            }

            allIssues.push({
              file,
              line: i + 1,
              ruleId: rule.name,
              type: rule.type,
              severity: rule.severity,
              message: rule.message,
              snippet: line.trim()
            });
          }
        }
        rule.pattern.lastIndex = 0;
      }

      let match;
      while ((match = importRegex.exec(line)) !== null) {
        const fullImport = match[1];
        let depName = fullImport.split('/')[0];
        if (depName.startsWith('@') && fullImport.includes('/')) {
          depName = `${fullImport.split('/')[0]}/${fullImport.split('/')[1]}`;
        }
        if (!declaredDeps.has(depName) && !depName.startsWith('@types/')) {
          if (!undeclaredPackagesToVerify.has(depName)) undeclaredPackagesToVerify.set(depName, []);
          undeclaredPackagesToVerify.get(depName)?.push({ file, line: i + 1, text: line.trim() });
        }
      }
      importRegex.lastIndex = 0;
    }

    if (needsWrite && IS_AUTOFIX) {
       await fs.writeFile(file, lines.join("\n"));
    }
  }

  // Check NPM
  for (const [depName, occurrences] of undeclaredPackagesToVerify.entries()) {
    const existsOnNpm = await checkNpmRegistry(depName);
    occurrences.forEach(occ => {
      if (!existsOnNpm) {
        allIssues.push({
          file: occ.file, line: occ.line, ruleId: "Fake Library Detected",
          type: "hallucination", severity: "high",
          message: `Package "${depName}" DOES NOT EXIST on the npm registry!`, snippet: occ.text
        });
      } else {
        allIssues.push({
          file: occ.file, line: occ.line, ruleId: "Undeclared Dependency",
          type: "suspicious", severity: "medium",
          message: `Package "${depName}" exists on npm, but is missing from package.json.`, snippet: occ.text
        });
      }
    });
  }

  // Output formatting
  if (FORMAT === "json") {
    console.log(JSON.stringify(allIssues, null, 2));
    process.exit(allIssues.length > 0 ? 1 : 0);
  }

  if (FORMAT === "sarif") {
    const sarif = {
      $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
      version: "2.1.0",
      runs: [{
        tool: { driver: { name: "DepFirewall", informationUri: "https://github.com/depfirewall" } },
        results: allIssues.map(issue => ({
          ruleId: issue.ruleId,
          level: issue.severity === "high" ? "error" : "warning",
          message: { text: issue.message },
          locations: [{
            physicalLocation: { artifactLocation: { uri: issue.file }, region: { startLine: issue.line } }
          }]
        }))
      }]
    };
    console.log(JSON.stringify(sarif, null, 2));
    process.exit(allIssues.length > 0 ? 1 : 0);
  }

  // TEXT Output
  let currentFile = "";
  allIssues.sort((a,b) => a.file.localeCompare(b.file)).forEach(issue => {
    if (currentFile !== issue.file) {
       console.log(`\n\x1b[1m\x1b[44m\x1b[37m === 📂 FILE: ${issue.file} === \x1b[0m\n`);
       currentFile = issue.file;
    }
    const color = issue.type === "security" ? "\x1b[31m" : issue.type === "hallucination" ? "\x1b[35m" : "\x1b[33m";
    console.log(`${color}[${issue.type.toUpperCase()}]\x1b[0m \x1b[1m${issue.ruleId}\x1b[0m`);
    console.log(`  \x1b[36m▶ ${issue.file}:${issue.line}\x1b[0m`);
    console.log(`  \x1b[2m↳ ${issue.snippet.substring(0, 80)}\x1b[0m\n`);
  });

  if (allIssues.length === 0) {
    console.log("\x1b[32m%s\x1b[0m", "\n✅ No suspicious patterns detected.");
  } else {
    console.log("\x1b[33m%s\x1b[0m", `\n⚠️ Scan complete. Found ${allIssues.length} issues.`);
  }

  if (IS_AUTOFIX && FORMAT === "text") {
    console.log("\x1b[32m%s\x1b[0m", `✨ Auto-fixed ${totalFixed} issues across the codebase.`);
  }
}

runCliScan();

import { glob } from "glob";
import fs from "fs-extra";
import path from "path";
import { builtinModules } from "module";
import https from "https";
import { RULES, ScanRule } from "../src/scanner-rules";

async function getProjectNodeVersion(): Promise<number | null> {
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      if (pkg.engines && pkg.engines.node) {
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
      const deps = new Set([
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...Object.keys(pkg.optionalDependencies || {}),
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`)
      ]);
      return deps;
    }
  } catch (e) {
    console.error("Warning: Could not read package.json for dependency validation.");
  }
  return new Set([...builtinModules, ...builtinModules.map(m => `node:${m}`)]);
}

// Check if a package actually exists on the global NPM registry
function checkNpmRegistry(packageName: string): Promise<boolean> {
  return new Promise((resolve) => {
    https.get(`https://registry.npmjs.org/${packageName}`, (res) => {
      // 200 OM means it exists, 404 means it's a completely hallucinated fake package
      resolve(res.statusCode === 200);
    }).on("error", () => {
      resolve(false); // Assume it doesn't exist if network fails
    });
  });
}

function fetchNpmLatestVersion(packageName: string): Promise<string | null> {
  return new Promise((resolve) => {
    https.get(`https://registry.npmjs.org/${packageName}`, (res) => {
      if (res.statusCode !== 200) { resolve(null); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
         try {
           const parsed = JSON.parse(data);
           resolve(parsed['dist-tags']?.latest || null);
         } catch(e) { resolve(null); }
      });
    }).on("error", () => resolve(null));
  });
}

async function runCliScan() {
  console.log("\x1b[36m%s\x1b[0m", "🚀 Dependency Firewall - Advanced CLI Scanner");
  console.log("Scanning directory: " + process.cwd());

  // Detect Package Manager
  const lockFiles = {
    "package-lock.json": "npm",
    "yarn.lock": "yarn",
    "pnpm-lock.yaml": "pnpm",
    "bun.lockb": "bun",
    "bun.lock": "bun"
  };

  const detectedManagers: string[] = [];
  for (const [file, manager] of Object.entries(lockFiles)) {
    if (await fs.pathExists(path.join(process.cwd(), file))) {
      detectedManagers.push(manager);
    }
  }

  if (detectedManagers.length > 0) {
    console.log(`Detected Package Manager(s): \x1b[32m${detectedManagers.join(", ")}\x1b[0m\n`);
  } else {
    console.log("\x1b[33m%s\x1b[0m", "No lockfile detected. Run 'npm install' or similar.\n");
  }

  const declaredDeps = await getDeclaredDependencies();
  const projectNodeVersion = await getProjectNodeVersion();
  const ctx = { nodeVersion: projectNodeVersion };

  const files = await glob("**/*.{ts,tsx,js}", { 
    ignore: ["node_modules/**", "dist/**", ".git/**", "scripts/**"] 
  });

  let totalIssues = 0;
  const importRegex = /(?:import\s+(?:.*)\s+from\s+|require\s*\(\s*)['"]([^./][^'"]*)['"]/g;
  
  // Track packages we need to verify against live NPM
  const undeclaredPackagesToVerify = new Map<string, { file: string, line: number, text: string }[]>();

  let currentFile = "";

  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    const lines = content.split("\n");
    (ctx as any).fileContent = content;
    
    lines.forEach((line, i) => {
      // 1. Check Regex Rules
      RULES.forEach(rule => {
        if (rule.name === "Outdated Dependency") return;

        if (rule.pattern.test(line)) {
          if (!rule.validator || rule.validator(line, ctx)) {
            if (currentFile !== file) {
               console.log(`\n\x1b[1m\x1b[44m\x1b[37m === 📂 FILE: ${file} === \x1b[0m\n`);
               currentFile = file;
            }
            const typeColor = rule.type === "security" ? "\x1b[31m" : rule.type === "hallucination" ? "\x1b[35m" : "\x1b[33m";
            const ruleNameColor = "\x1b[1m"; // Bold
            
            console.log(`${typeColor}[${rule.type.toUpperCase()}]\x1b[0m ${ruleNameColor}${rule.name}\x1b[0m`);
            console.log(`  \x1b[36m▶ ${file}:${i+1}\x1b[0m`);
            console.log(`  \x1b[2m↳ ${line.trim().substring(0, 80)}\x1b[0m\n`);
            totalIssues++;
          }
        }
        rule.pattern.lastIndex = 0;
      });

      // 2. Identify Undeclared Dependencies
      let match;
      while ((match = importRegex.exec(line)) !== null) {
        const fullImport = match[1];
        let depName = fullImport.split('/')[0];
        
        // Handle scoped packages: @scope/package
        if (depName.startsWith('@') && fullImport.includes('/')) {
          const parts = fullImport.split('/');
          depName = `${parts[0]}/${parts[1]}`;
        }

        if (!declaredDeps.has(depName) && !depName.startsWith('@types/')) {
          if (!undeclaredPackagesToVerify.has(depName)) {
            undeclaredPackagesToVerify.set(depName, []);
          }
          undeclaredPackagesToVerify.get(depName)?.push({ file, line: i + 1, text: line.trim() });
        }
      }
      importRegex.lastIndex = 0;
    });
  }

  // 3. Live NPM Registry Check
  if (undeclaredPackagesToVerify.size > 0) {
    console.log("\n\x1b[36m%s\x1b[0m", "🔍 Contacting NPM Registry to verify suspicious imports...");
    
    for (const [depName, occurrences] of undeclaredPackagesToVerify.entries()) {
      const existsOnNpm = await checkNpmRegistry(depName);
      
      occurrences.forEach(occ => {
        if (!existsOnNpm) {
          // 404 from NPM -> It's a completely fake hallucinated library
          console.log(`\x1b[35m[HALLUCINATION]\x1b[0m \x1b[1mFake Library Detected\x1b[0m`);
          console.log(`  \x1b[36m▶ ${occ.file}:${occ.line}\x1b[0m`);
          console.log(`  \x1b[31m↳ Package "${depName}" DOES NOT EXIST on the npm registry!\x1b[0m\n`);
        } else {
          // 200 from NPM -> Real library, but developer forgot to npm install it
          console.log(`\x1b[33m[SUSPICIOUS]\x1b[0m \x1b[1mUndeclared Dependency\x1b[0m`);
          console.log(`  \x1b[36m▶ ${occ.file}:${occ.line}\x1b[0m`);
          console.log(`  \x1b[33m↳ Package "${depName}" exists on npm, but is missing from package.json.\x1b[0m\n`);
        }
        totalIssues++;
      });
    }
  }

  // 4. Outdated Dependency Check
  const pkgPath = path.join(process.cwd(), "package.json");
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    
    const entries = Object.entries(allDeps);
    if(entries.length > 0) console.log("\n\x1b[36m%s\x1b[0m", "🔍 Auditing dependency versions...");
    
    for (const [dep, versionStr] of entries) {
        if(typeof versionStr !== 'string') continue;
        const currentMajorMatch = versionStr.match(/\d+/);
        if(currentMajorMatch) {
            const currentMajor = parseInt(currentMajorMatch[0], 10);
            const latestVersion = await fetchNpmLatestVersion(dep);
            if (latestVersion) {
                const latestMajor = parseInt(latestVersion.split('.')[0], 10);
                if (latestMajor - currentMajor >= 2) {
                    console.log(`\x1b[33m[SUSPICIOUS]\x1b[0m \x1b[1mOutdated Dependency\x1b[0m`);
                    console.log(`  \x1b[36m▶ ${pkgPath}\x1b[0m`);
                    console.log(`  \x1b[33m↳ ${dep} (Current: ${versionStr}, Latest: ${latestVersion}) - Significantly outdated.\x1b[0m\n`);
                    totalIssues++;
                }
            }
        }
    }
  }

  if (totalIssues === 0) {
    console.log("\x1b[32m%s\x1b[0m", "\n✅ No suspicious patterns or undeclared dependencies detected.");
  } else {
    console.log("\x1b[33m%s\x1b[0m", `\n⚠️ Scan complete. Found ${totalIssues} potential firewall breaches.`);
    console.log("Suggestions:");
    console.log(" - Run 'npm install <package>' for undeclared dependencies that actually exist.");
    console.log(" - Remove completely hallucinated packages and ask the AI for a valid alternative.");
    console.log(" - Remove AI placeholders before pushing to production.");
    console.log("\n\x1b[2m💡 Tip: To copy this report, use the 'Copy Report' button in the Web Dashboard, or pipe standard output (e.g. npm run scan > report.txt)\x1b[0m");
  }
}

runCliScan();

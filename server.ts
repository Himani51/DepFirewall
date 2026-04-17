import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs-extra";
import { glob } from "glob";
import { RULES, ScanRule } from "./src/scanner-rules";

const app = express();
const PORT = 3000;

app.use(express.json());

// --- CORE SCANNER ENGINE ---

interface ScanResult {
  file: string;
  issues: {
    line: number;
    ruleId: string;
    type: "hallucination" | "suspicious" | "security";
    message: string;
    severity: "high" | "medium" | "low";
    snippet: string;
    canAutoFix: boolean;
  }[];
}

async function loadConfig() {
  const configPath = path.join(process.cwd(), ".depfirewallrc.json");
  if (await fs.pathExists(configPath)) {
    try { return await fs.readJson(configPath); } catch (e) {}
  }
  return { rules: {} };
}

async function scanCodebase(dir: string): Promise<ScanResult[]> {
  const config = await loadConfig();
  const files = await glob("**/*.{ts,tsx,js}", { 
    cwd: dir, 
    ignore: ["node_modules/**", "dist/**", ".git/**"] 
  });
  
  const results: ScanResult[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    const issues: ScanResult["issues"] = [];
    const ctx = {
      nodeVersion: parseInt(process.versions.node.split('.')[0], 10),
      fileContent: content
    };

    let skipNextLine = false;

    lines.forEach((lineText, index) => {
      // INLINE SUPPRESSION LOGIC
      if (lineText.includes("depfirewall-disable-next-line") || lineText.includes("depfirewall-ignore-next-line")) {
        skipNextLine = true;
        return;
      }
      if (skipNextLine || lineText.includes("depfirewall-ignore")) {
        skipNextLine = false;
        return;
      }

      RULES.forEach(rule => {
        if (rule.name === "Outdated Dependency") return;
        if (config.rules && config.rules[rule.name] === "off") return;

        if (rule.pattern.test(lineText)) {
          if (rule.validator && !rule.validator(lineText, ctx)) return;

          issues.push({
            line: index + 1,
            ruleId: rule.name,
            type: rule.type as any,
            message: rule.message,
            severity: rule.severity as any,
            snippet: lineText.trim(),
            canAutoFix: !!rule.autofix
          });
        }
        rule.pattern.lastIndex = 0;
      });
    });

    if (issues.length > 0) {
      results.push({ file, issues });
    }
  }

  return results;
}

// --- API ROUTES ---

app.get("/api/scan", async (req, res) => {
  try {
    const results = await scanCodebase(process.cwd());
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.post("/api/fix", async (req, res) => {
  try {
    const { file, ruleId, line } = req.body;
    const rule = RULES.find(r => r.name === ruleId);
    
    if (!rule || !rule.autofix) {
      res.status(400).json({ success: false, error: "Rule not found or does not support autofix." });
      return;
    }

    const filePath = path.join(process.cwd(), file);
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    
    // Apply fix
    lines[line - 1] = rule.autofix(lines[line - 1]);
    
    await fs.writeFile(filePath, lines.join("\n"));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.post("/api/ignore", async (req, res) => {
  try {
    const { file, line } = req.body;
    
    const filePath = path.join(process.cwd(), file);
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    
    // Insert suppression comment directly above the offending line
    lines.splice(line - 1, 0, "// depfirewall-disable-next-line");
    
    await fs.writeFile(filePath, lines.join("\n"));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// --- VITE MIDDLEWARE ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Firewall running at http://localhost:${PORT}`);
  });
}

startServer();

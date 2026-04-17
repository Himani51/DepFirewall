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
    type: "hallucination" | "suspicious" | "security";
    message: string;
    severity: "high" | "medium" | "low";
    snippet: string;
  }[];
}

async function scanCodebase(dir: string): Promise<ScanResult[]> {
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

    lines.forEach((lineText, index) => {
      RULES.forEach(rule => {
        // Outdated Dependencies is validated externally by the CLI currently
        if (rule.name === "Outdated Dependency") return;

        if (rule.pattern.test(lineText)) {
          // If a validator exists, run it
          if (rule.validator && !rule.validator(lineText, ctx)) return;

          issues.push({
            line: index + 1,
            type: rule.type as any,
            message: rule.message,
            severity: rule.severity as any,
            snippet: lineText.trim()
          });
        }
        // Reset regex state for global patterns
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

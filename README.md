# 🛡️ DepFirewall

![DepFirewall Header Showcase](https://picsum.photos/seed/depfirewall/800/300?blur=2)

A high-precision static analysis engine designed to detect **AI Hallucinations**, security vulnerabilities, and suspicious architectural patterns in modern TypeScript/JavaScript codebases. Built by **Himani Vaghani**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Security Audits](https://img.shields.io/badge/Security-Strict-red.svg)](#)
[![CLI Enabled](https://img.shields.io/badge/CLI-Ready-green.svg)](#)

## 📖 Overview

As Large Language Models (LLMs) like Claude, ChatGPT, and Gemini become central to the development workflow, they frequently introduce specific failure modes that standard linters miss. 

**DepFirewall** acts as a security gate, actively auditing your codebase for these patterns before they reach production.

---

## 🎯 Real-World Use Cases

### 1. Catching The "Copilot Blindspot" (Hallucinated Imports & APIs)
> **The Problem:** The AI confidently writes `import { MagicParser } from 'express-magic-utils'` or uses `user.autoAuthenticate()` — neither of which actually exist.
> **The Solution:** DepFirewall maps every import against the live NPM registry. If an AI hallucinates a library that doesn't exist, DepFirewall throws a **[🚨 HALLUCINATION DETECTED]** error instantly, failing the build before CI/CD breaks.

### 2. Guarding the Express.js Backend (Security Enforcements)
> **The Problem:** Generative AI often writes overly simplistic tutorial-grade backend code, skipping essential enterprise middleware and exposing servers to DDoS or XSS attacks.
> **The Solution:** DepFirewall scans for missing `helmet` security headers, nonexistent `express-rate-limit` implementations, and dangerously high `.json({ limit: "50mb" })` payload parsers, keeping your backend bulletproof.

### 3. CI/CD CI Pipeline "Sanity Check"
> **The Problem:** A developer accidentally commits an AI conversation snippet ("Here is the code you requested:") or leaves a hardcoded API key behind placeholder text like `YOUR_API_KEY_HERE`.
> **The Solution:** DepFirewall runs via a rapid CLI script (`npm run scan`) that can act as a pre-commit hook or part of your GitHub Actions pipeline, blocking malicious string injections and loose secrets.

---

## 🚀 Step-by-step Instructions

### Option 1: Interactive Dashboard (Best for Visual Audit)

The Dashboard provides a beautiful, high-density HUD to parse all detected violations.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/depfirewall.git
   cd depfirewall
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the local console:**
   ```bash
   npm run dev
   ```
4. Access the dashboard at `http://localhost:3000`. 
5. Click **"Initialize Full Analysis"** to start parsing your files. Use the **Copy Report** feature to securely copy your results!

### Option 2: CLI Scanner (Best for CI/CD or the Terminal)

You can run the DepFirewall scanner natively in the command line for beautiful terminal readouts.

#### Scan the Current Working Directory:
```bash
npm run scan
```

**Visual Terminal Output:**
```diff
=== 📂 FILE: server.ts ===

- [SECURITY] Express Missing Rate Limiting
  ▶ server.ts:8
  ↳ const app = express();

- [SUSPICIOUS] Debug Log Detector
  ▶ server.ts:103
  ↳ console.log(`AI Firewall running at http://localhost:${PORT}`);
```

#### Output Pipes:
If your scan reveals issues, you can pipe the output directly into a file to hand off to an AI or a developer to fix:
```bash
npm run scan > firewall_report.txt
```

#### Scan an external project:
If you want to audit a different codebase using this engine without installing it there:
1. Clone this repo to `~/tools/depfirewall`.
2. Move into your *target project* directory.
3. Run the scanner against it:
```bash
npx tsx ~/tools/depfirewall/scripts/cli-scan.ts
```

---

## 🔍 Highlighted Detectors

| Category | Detected Vectors |
| :--- | :--- |
| **Security Risk** | Hardcoded Secrets, Missing Rate Limitters, Empty JWT Hashers, Untemplated SQL Strings, Unsafe Regex (ReDoS possible). |
| **Hallucination** | 404 NPM Packages, Made-up standard built-in modules (`node:system`), Fake React Hooks. |
| **Suspicious** | Conversational leaking (`"As an AI..."`), Placeholders (`[INSERT]`), Stray Markdown, Unused Imports. |

## 🛠️ Tech Stack & Architecture
- **Engine:** Regex heuristic decomposition + NPM Registry verification.
- **Frontend Dashboard:** React, Tailwind CSS, Motion (Framer Motion).
- **Linter Engine:** ESLint with `eslint-plugin-security` & `eslint-plugin-sonarjs`.

## 📄 License
MIT License - Developed by Himani Vaghani. Distributed as Open Source.

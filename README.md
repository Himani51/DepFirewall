# 🛡️ Dependency Firewall

A high-precision static analysis engine designed to detect **AI Hallucinations** and suspicious architectural patterns in modern TypeScript/JavaScript codebases. Built by **Himani Vaghani**.

## 📖 Overview

As Large Language Models (LLMs) become central to the development workflow, they frequently introduce specific failure modes:
- **Hallucinated Libraries:** Importing non-existent or undeclared packages.
- **Phantom Methods:** Calling plausible but non-existent API methods.
- **Implementation Leaks:** Leaving behind AI markers or placeholders.

**Dependency Firewall** acts as a security gate, auditing your codebase for these patterns before they reach production.

## 🚀 How to Use

### Option 1: Interactive Dashboard (Best for Visual Audit)
1. **Clone the repository.**
2. **Install dependencies**: `npm install`
3. **Run the server**: `npm run dev`
4. Access the dashboard at `http://localhost:3000`. It will scan the project directory and display issues in a high-density console UI.

### Option 2: CLI Scanner (Best for CI/CD or Terminal)
You can run the scanner directly against any project directory.

#### To scan the current project:
```bash
npm run scan
```

#### To use this tool to scan *another* project:
If you want to audit a different codebase using this engine:
1. Clone this repo to a local directory (e.g., `~/tools/dependency-firewall`).
2. Run the scanner using `npx` and point it to your target project:
```bash
# From inside your target project directory:
npx tsx ~/tools/dependency-firewall/scripts/cli-scan.ts
```

## 🔍 Heuristic Features
- **Strict Dependency Check**: Cross-references imports against `package.json` to catch hallucinations.
- **Multilingual Lockfile Detection**: Detects `npm`, `yarn`, `pnpm`, and `bun` environments.
- **Placeholder Detection**: Flags `INSERT_CODE_HERE`, `YOUR_API_KEY_HERE`, etc.
- **Magic Method Guardian**: Detects "hallucinated" methods like `.optimizeEverything()`.

## 🛠️ Architecture
- **Engine:** Regex-based heuristic decomposition.
- **Frontend:** React + Motion with a high-density "Console" UI.
- **Backend:** Express-based static file analysis.

## 📄 License
MIT License - Developed by Himani Vaghani. Distributed as Open Source.

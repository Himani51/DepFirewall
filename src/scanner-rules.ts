export interface ScanRule {
  name: string;
  pattern: RegExp;
  message: string;
  severity: "high" | "medium" | "low";
  type: "hallucination" | "suspicious" | "security";
  validator?: (line: string, ctx?: any) => boolean;
}

export const RULES: ScanRule[] = [
  {
    name: "Fake Library Check",
    pattern: /import\s+.*\s+from\s+['"](ai-utils|magic-sdk|universal-api|easy-auth-v2|chatgpt-utils|llm-tools|auto-backend)['"]/gi,
    message: "Potential hallucinated library detected.",
    severity: "high",
    type: "hallucination"
  },
  {
    name: "Placeholder Detector",
    pattern: /(\[INSERT_CODE_HERE\]|<insert_your_code>|YOUR_API_KEY_HERE|YOUR_SECRET_HERE|TODO:\s*.*|FIXME:\s*.*)/gi,
    message: "AI placeholder or unconfigured secret found.",
    severity: "medium",
    type: "suspicious"
  },
  {
    name: "Impossible API Calls",
    pattern: /\.(fetchDataFromVoid|generatePerfectCode|autoFixSecurity|predictUserIntent|optimizeEverything)\(/g,
    message: "Call to non-existent 'magic' method detected.",
    severity: "high",
    type: "hallucination"
  },
  {
    name: "Suspicious Import Destructuring",
    pattern: /import\s+\{\s*(.*)\s*\}\s+from\s+['"]react['"]/g,
    validator: (match: string) => {
      const parts = match.match(/\{ (.*) \}/);
      if (parts && (parts[1].includes("useMagicState") || parts[1].includes("useAI"))) return true;
      return false;
    },
    message: "Hallucinated React hook (e.g., useMagicState) detected.",
    severity: "high",
    type: "hallucination"
  },
  {
    name: "AI Output Leak",
    pattern: /(As an AI language model,|I cannot fulfill this request|Here is the code you requested:)/gi,
    message: "AI conversational output leaked into source code.",
    severity: "high",
    type: "suspicious"
  },
  {
    name: "Hardcoded Secrets",
    pattern: /(AKIA[0-9A-Z]{16}|(?:sk|rk)_(?:test|live)_[0-9a-zA-Z]{24,}|xox[baprs]-[0-9a-zA-Z]{10,48}|gh[pousr]_[a-zA-Z0-9]{36}|AIza[0-9A-Za-z\-_]{35}|SK[0-9a-fA-F]{32}|SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}|sk-[a-zA-Z0-9]{20,}|(?:ey[a-zA-Z0-9]{10,}\.ey[a-zA-Z0-9]{10,}\.[a-zA-Z0-9_-]{10,})|(?:"|')?(?:password|secret|api_key|apikey|token|access_token|auth_token)(?:"|')?\s*[:=]\s*["'][a-zA-Z0-9\-_]{16,}["'])/gi,
    message: "Potential hardcoded SaaS API key, JWT, or secret token.",
    severity: "high",
    type: "security"
  },
  {
    name: "Unresolved Diff Markers",
    pattern: /(<<<<<<< HEAD|=======|>>>>>>> [a-zA-Z0-9_.-]+)/g,
    message: "Unresolved version control conflict or AI diff artifact.",
    severity: "high",
    type: "suspicious"
  },
  {
    name: "Dangerous Dynamic Execution",
    pattern: /(eval\s*\(|new\s+Function\s*\()/g,
    message: "Dangerous dynamic code execution function detected.",
    severity: "high",
    type: "security"
  },
  {
    name: "Hallucinated UI Components",
    pattern: /<(_?MagicTable|AutoForm|SmartGrid|AIAssistant|LLMWrapper)/g,
    message: "Usage of commonly hallucinated AI component.",
    severity: "medium",
    type: "hallucination"
  },
  {
    name: "Legacy Crypto API Risk",
    pattern: /(?:import\s+(?:.*)\s+from\s+|require\s*\(\s*)['"](node:)?crypto['"]/g,
    message: "Direct import of crypto module. Verify Node.js >= 14 compatibility.",
    severity: "medium",
    type: "security",
    validator: (line: string, ctx?: any) => {
      if (!ctx || !process) return true; // Default behavior
      const version = ctx.nodeVersion !== null ? ctx.nodeVersion : parseInt(process.versions?.node?.split('.')[0] || "18", 10);
      return version < 14;
    }
  },
  {
    name: "Client-Side Secret Exposure",
    pattern: /process\.env\.(PRIVATE_KEY|DATABASE_URL|AWS_SECRET_ACCESS_KEY|STRIPE_SECRET_KEY|GITHUB_TOKEN|OPENAI_API_KEY|ANTHROPIC_API_KEY|TWILIO_AUTH_TOKEN|SENDGRID_API_KEY|SUPABASE_SERVICE_ROLE_KEY|FIREBASE_PRIVATE_KEY|DATADOG_API_KEY|NEW_RELIC_LICENSE_KEY|SLACK_BOT_TOKEN|[A-Z0-9_]*_SECRET[A-Z0-9_]*|[A-Z0-9_]*_PRIVATE[A-Z0-9_]*)/gi,
    message: "High risk: Server environment variable exposed in potentially client-side code.",
    severity: "high",
    type: "security"
  },
  {
    name: "AI Placeholder Mock Data",
    pattern: /(John Doe|Jane Doe|foo@example\.com|1234567890|"placeholder")/gi,
    message: "AI mock placeholder user data detected.",
    severity: "low",
    type: "suspicious"
  },
  {
    name: "Unsafe DOM Manipulation",
    pattern: /dangerouslySetInnerHTML=\{\{\s*__html\s*:/g,
    message: "Potentially unsafe dangerouslySetInnerHTML without verified sanitization.",
    severity: "high",
    type: "security"
  },
  {
    name: "Hallucinated Iteration Methods",
    pattern: /\.(mapAsync|forEachAsync|filterAsync|findAndRemove|toObject|flattenDeep)\(/g,
    message: "Usage of nonexistent or hallucinated collection method.",
    severity: "medium",
    type: "hallucination"
  },
  {
    name: "Swallowed Error / Empty Catch",
    pattern: /catch\s*\([^)]*\)\s*\{\s*(?:\/\/[^\n]*\s*)?\}/g,
    message: "Empty catch block detected. AIs frequently omit error handling to save space.",
    severity: "medium",
    type: "suspicious"
  },
  {
    name: "Fake Node.js Modules",
    pattern: /(?:import\s+(?:.*)\s+from\s+|require\s*\(\s*)['"](node:)?(files|network|system|web|browser|database)['"]/g,
    message: "Importing nonexistent Node.js built-in module.",
    severity: "high",
    type: "hallucination"
  },
  {
    name: "Fake Authentication Bypass",
    pattern: /\.(skipAuth|bypassSecurity|forceLogin|mockUserSession|generateAdminToken)\(/g,
    message: "Suspicious authentication bypass method, commonly created by AI for testing.",
    severity: "high",
    type: "security"
  },
  {
    name: "Private Cryptographic Key Leak",
    pattern: /(-----BEGIN [A-Z\s]+ PRIVATE KEY-----)/g,
    message: "Critical: Hardcoded private cryptographic key detected.",
    severity: "high",
    type: "security"
  },
  {
    name: "Discord Webhook Leak",
    pattern: /https:\/\/(?:discord|discordapp)\.com\/api\/webhooks\/[0-9]+\/[a-zA-Z0-9_\-]+/gi,
    message: "Critical: Hardcoded Discord Webhook URL detected.",
    severity: "high",
    type: "security"
  },
  {
    name: "Disabled TLS/SSL Validation",
    pattern: /rejectUnauthorized:\s*false/g,
    message: "Critical: TLS/SSL certificate validation explicitly disabled.",
    severity: "high",
    type: "security"
  },
  {
    name: "Raw SQL Injection Risk",
    pattern: /\.(query|execute|raw)\(\s*[`'"][^;]*\$\{/g,
    message: "High Risk: Untemplated literal string interpolation in potential database query.",
    severity: "high",
    type: "security"
  },
  {
    name: "Exposed Internal IPs",
    pattern: /['"](?:http:\/\/)?(?:192\.168\.|10\.|172\.(?:1[6-9]|2[0-9]|3[0-1])\.)[0-9]{1,3}\.[0-9]{1,3}(?::[0-9]{1,5})?['"]/g,
    message: "Suspicious: Local or internal network IP address hardcoded.",
    severity: "medium",
    type: "suspicious"
  },
  {
    name: "Unconfigured Tutorial Paths",
    pattern: /['"]\/?(?:path\/to\/your|your-project-id|your_account_id|your-username|example-bucket)['"]/i,
    message: "Suspicious: Unconfigured boilerplate path or placeholder.",
    severity: "medium",
    type: "suspicious"
  },
  {
    name: "AI Lazy Component Return",
    pattern: /return\s+<\w+[^>]*>\s*(?:TODO|Replace with|Content|Placeholder|\.\.\.)\s*<\/\w+>/gi,
    message: "Suspicious: AI generated a lazy, empty, or incomplete React component.",
    severity: "medium",
    type: "suspicious"
  },
  {
    name: "Insecure Crypto.random() / Math.random()",
    pattern: /(?:password|secret|token|id|key|salt|hash)\s*[:=]\s*[^;]*Math\.random\(\)/gi,
    message: "Security Risk: Math.random() is being used to generate secure values. Use crypto module instead.",
    severity: "high",
    type: "security"
  },
  {
    name: "Stray AI Markdown Artifact",
    pattern: /^\s*```(?:javascript|typescript|js|ts|tsx|jsx)?\s*$/gmi,
    message: "Syntax Error Risk: AI left Markdown code blocks (```) inside a source code file.",
    severity: "high",
    type: "suspicious"
  },
  {
    name: "Insecure External HTTP Request",
    pattern: /(?:['"]|URL\()http:\/\/(?!(?:localhost|127\.0\.0\.1|10\.|172\.(?:1[6-9]|2\d|3[01])|192\.168\.))\S+['"]/gi,
    message: "Security Risk: Hardcoded 'http://' URL used for an external resource instead of secure HTTPS.",
    severity: "medium",
    type: "security"
  },
  {
    name: "Weak Cryptographic Hashing",
    pattern: /crypto\.createHash\(['"](md5|sha1)['"]\)/gi,
    message: "Critical: Weak hashing algorithm (MD5/SHA1) used where secure cryptography is expected.",
    severity: "high",
    type: "security"
  },
  {
    name: "Hardcoded Database Credentials",
    pattern: /(?:postgres|mysql|mongodb|redis):\/\/[^:]+:[^@]+@/gi,
    message: "Critical: Database connection string contains hardcoded plaintext username and password.",
    severity: "high",
    type: "security"
  },
  {
    name: "Localhost Deployment Trap",
    pattern: /fetch\(['"]http:\/\/(?:localhost|127\.0\.0\.1):\d+/gi,
    message: "Deployment Risk: API fetch call hardcoded to localhost. This will break when deployed to cloud. Use relative paths like '/api/...'",
    severity: "medium",
    type: "suspicious"
  },
  {
    name: "Suspicious Linter Suppression",
    pattern: /\/\/\s*eslint-disable(?:-next-line|-line)?\s+(?:no-eval|no-implied-eval|dangerouslySetInnerHTML|@typescript-eslint\/no-explicit-any)/gi,
    message: "Security: Critical linter rules (like no-eval or dangeroulySetInnerHTML) have been manually disabled.",
    severity: "medium",
    type: "security"
  },
  {
    name: "Hardcoded LLM System Prompt Leak",
    pattern: /(?:ignore\s+all\s+previous\s+instructions|system\s+prompt|you\s+are\s+a\s+helpful\s+assistant)/gi,
    message: "Data Leak: Unobfuscated LLM configuration or system prompt found directly in source code.",
    severity: "medium",
    type: "suspicious"
  },
  {
    name: "Logging Sensitive Data",
    pattern: /console\.(?:log|error|warn)\(\s*.*(?:password|secret|token|key|credit_card|ssn).*?\)/gi,
    message: "Security Risk: Application logging variables whose names suggest highly sensitive data.",
    severity: "high",
    type: "security"
  },
  {
    name: "Permissive CORS Configuration",
    pattern: /(?:cors\(\s*\{\s*origin\s*:\s*['"]\*['"]\s*\}\s*\)|Access-Control-Allow-Origin['",\s]+['"]\*['"])/gi,
    message: "Security Risk: Overly permissive CORS configuration allowing requests from all ('*') origins.",
    severity: "high",
    type: "security"
  },
  {
    name: "Prisma ORM Unsafe Injection",
    pattern: /\.(?:\$queryRawUnsafe|\$executeRawUnsafe)\(/g,
    message: "Critical: Usage of Prisma's unsafe raw SQL execution method, which completely bypasses injection protections.",
    severity: "high",
    type: "security"
  },
  {
    name: "Sequelize Literal SQL Injection",
    pattern: /Sequelize\.literal\(\s*[`'"][^)]*\$\{/gi,
    message: "High Risk: Untemplated literal string interpolation inside Sequelize.literal() is vulnerable to SQL injection.",
    severity: "high",
    type: "security"
  },
  {
    name: "Insecure Express Session Config",
    pattern: /cookie\s*:\s*\{\s*[^}]*secure\s*:\s*false/gi,
    message: "Security Risk: Explicitly disabling 'secure' cookies in express-session configuration.",
    severity: "high",
    type: "security"
  },
  {
    name: "JWT 'None' Algorithm Verification",
    pattern: /algorithms\s*:\s*\[\s*['"]none['"]\s*\]/gi,
    message: "Critical: JWT configured to accept the 'none' algorithm, rendering signature verification useless.",
    severity: "high",
    type: "security"
  },
  {
    name: "CSRF Protection Explicitly Disabled",
    pattern: /(?:csrf|xsrf|checkCSRF)\s*:\s*false/gi,
    message: "Security Risk: Cross-Site Request Forgery (CSRF) protection explicitly disabled in configuration.",
    severity: "high",
    type: "security"
  },
  {
    name: "React Insecure Target Blank",
    pattern: /<a[^>]+target=(?:'|")_blank(?:'|")[^>]*>/gi,
    message: "Security Risk: Unsafe '_blank' link in React. Should include 'rel=\"noopener noreferrer\"' to prevent reverse tabnabbing.",
    severity: "medium",
    type: "security",
    validator: (line: string) => {
      // It's a violation ONLY if it lacks the noopener attribute
      return !(/rel=(?:'|")[^'"]*noopener/i.test(line));
    }
  },
  {
    name: "Outdated Dependency",
    pattern: /"dependencies":/,
    message: "Dependency is significantly outdated. Consider updating to a newer version for security and feature improvements.",
    severity: "low",
    type: "suspicious"
  },
  {
    name: "Debug Log Detector",
    pattern: /console\.log\((?![\s]*['"`]DEBUG:)/gi,
    message: "Potential debug log statement found in production code. Ensure it is intentional or remove it.",
    severity: "low",
    type: "suspicious"
  },
  {
    name: "Express Missing Rate Limiting",
    pattern: /(?:const|let|var)\s+\w+\s*=\s*express\(\)/g,
    message: "Security Risk: Express application initialized without 'express-rate-limit'. Applications are vulnerable to brute-force and DDoS attacks without rate limiting.",
    severity: "high",
    type: "security",
    validator: (line: string, ctx: any) => {
      if (!ctx || !ctx.fileContent) return true;
      return !/express-rate-limit|rateLimit/i.test(ctx.fileContent);
    }
  },
  {
    name: "Improper Express Body Limiting",
    pattern: /(?:express|bodyParser)\.(?:json|urlencoded)\([^)]*limit\s*:\s*['"]?(?:[5-9]\d{1,}|[1-9]\d{2,})\s*[mM][bB]['"]?[^)]*\)/g,
    message: "Security Risk: Express body parser configured with excessively high limits (>= 50MB). This exposes the server to Denial of Service (DoS) attacks.",
    severity: "high",
    type: "security"
  },
  {
    name: "Vulnerable Express Middleware",
    pattern: /(?:app\.use\(\s*(?:express\.bodyParser|express\.multipart|express\.limit)\(\s*\))|require\(['"]csurf['"]\)|from\s+['"]csurf['"]/g,
    message: "High Risk: Usage of deprecated/vulnerable Express middleware (e.g., csurf, express.bodyParser). Update to modern, secure alternatives.",
    severity: "high",
    type: "security"
  },
  {
    name: "Express Missing Security Headers (Helmet)",
    pattern: /(?:const|let|var)\s+\w+\s*=\s*express\(\)/g,
    message: "Security Risk: Express application initialized without 'helmet'. Missing security headers expose the app to XSS, clickjacking, and other web vulnerabilities.",
    severity: "high",
    type: "security",
    validator: (line: string, ctx: any) => {
      if (!ctx || !ctx.fileContent) return true;
      return !/helmet/i.test(ctx.fileContent);
    }
  },
  {
    name: "Unused Import",
    pattern: /^import\s+(?:\{[^}]+\}|\w+)\s+from\s+['"][^'"]+['"]/g,
    message: "Unused import statement detected. Consider removing it for cleaner code.",
    severity: "low",
    type: "suspicious",
    validator: (line: string, ctx: any) => {
      if (!ctx || !ctx.fileContent) return false;
      const match = line.match(/^import\s+(?:\{([^}]+)\}|(\w+))/);
      if (!match) return false;
      const varsStr = match[1] || match[2];
      const vars = varsStr.split(',').map(v => v.trim().split(/\s+as\s+/)[0]).filter(v => v.length > 0 && v !== 'type');
      for (const v of vars) {
         const usageRegex = new RegExp(`\\b${v}\\b`, 'g');
         const matches = ctx.fileContent.match(usageRegex);
         if (matches && matches.length === 1) return true; // Used only in the import statement
      }
      return false;
    }
  }
];

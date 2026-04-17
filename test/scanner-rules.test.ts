import { describe, it, expect } from "vitest";
import { RULES } from "../src/scanner-rules";

describe("Dependency Firewall Core Rules", () => {
    it("should flag express missing rate limiting", () => {
        const rule = RULES.find(r => r.name === "Express Missing Rate Limiting");
        expect(rule).toBeDefined();

        const badLine = "const app = express();";
        
        rule!.pattern.lastIndex = 0;
        expect(rule!.pattern.test(badLine)).toBe(true);
        // Validator returns true when it's unsage (doesn't have rate limit)
        expect(rule!.validator!(badLine, { fileContent: badLine })).toBe(true);
    });

    it("should NOT flag express missing rate limiting if rateLimit is included", () => {
        const rule = RULES.find(r => r.name === "Express Missing Rate Limiting");
        const safeLine = "const app = express();";
        const safeContent = "import rateLimit from 'express-rate-limit';\nconst app = express();";
        
        rule!.pattern.lastIndex = 0;
        expect(rule!.pattern.test(safeLine)).toBe(true);
        // Validator returns false if it's safe (rateLimit is present)
        expect(rule!.validator!(safeLine, { fileContent: safeContent })).toBe(false);
    });

    it("should catch fake AI UI Components (MagicTable)", () => {
        const rule = RULES.find(r => r.name === "Hallucinated UI Components");
        expect(rule).toBeDefined();

        const badLine = "return <MagicTable data={data} />";
        rule!.pattern.lastIndex = 0;
        expect(rule!.pattern.test(badLine)).toBe(true);
    });

    it("should catch unprotected generic variables", () => {
        const rule = RULES.find(r => r.name === "Hardcoded Secrets");
        expect(rule).toBeDefined();

        const badLine = 'const api_key = "a_super_secret_API_KEY_123456789";';
        rule!.pattern.lastIndex = 0;
        expect(rule!.pattern.test(badLine)).toBe(true);
    });
});

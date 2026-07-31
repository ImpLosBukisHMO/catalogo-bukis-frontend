import { describe, it, expect } from "vitest";
import { sanitizeInput, sanitizeEmail, sanitizeSearchQuery, sanitizeNumeric } from "./sanitizer";

describe("sanitizer utility", () => {
  describe("sanitizeInput", () => {
    it("should return empty string for non-string inputs", () => {
      expect(sanitizeInput(null as unknown as string)).toBe("");
      expect(sanitizeInput(undefined as unknown as string)).toBe("");
    });

    it("should remove <script> tags and their contents", () => {
      const malicious = "Hola <script>alert('XSS')</script> Mundo";
      expect(sanitizeInput(malicious)).toBe("Hola  Mundo");
    });

    it("should remove inline event handlers like onload or onerror", () => {
      const malicious = "img src='x' onerror='alert(1)'";
      expect(sanitizeInput(malicious)).not.toContain("onerror=");
    });

    it("should remove javascript: protocol", () => {
      const malicious = "javascript:alert(1)";
      expect(sanitizeInput(malicious)).toBe("alert(1)");
    });

    it("should escape remaining HTML brackets", () => {
      const input = "<b>Negrita</b>";
      expect(sanitizeInput(input)).toBe("&lt;b&gt;Negrita&lt;/b&gt;");
    });

    it("should remove null characters", () => {
      const input = "Hola\0Mundo";
      expect(sanitizeInput(input)).toBe("HolaMundo");
    });
  });

  describe("sanitizeEmail", () => {
    it("should trim, lowercase and remove spaces", () => {
      const email = "  Usuario.Test@Example.COM  ";
      expect(sanitizeEmail(email)).toBe("usuario.test@example.com");
    });

    it("should remove script payloads in email field", () => {
      const malicious = "user<script></script>@domain.com";
      expect(sanitizeEmail(malicious)).toBe("user@domain.com");
    });
  });

  describe("sanitizeSearchQuery", () => {
    it("should collapse multiple spaces and sanitize scripts", () => {
      const query = "  zapato   <script>bad()</script>  deportivo  ";
      expect(sanitizeSearchQuery(query)).toBe("zapato deportivo");
    });

    it("should truncate searches exceeding max length", () => {
      const longQuery = "a".repeat(150);
      expect(sanitizeSearchQuery(longQuery, 100).length).toBe(100);
    });
  });

  describe("sanitizeNumeric", () => {
    it("should strip non-digit characters", () => {
      expect(sanitizeNumeric("123-456 abc!")).toBe("123456");
      expect(sanitizeNumeric("OTP: 987654")).toBe("987654");
    });
  });
});

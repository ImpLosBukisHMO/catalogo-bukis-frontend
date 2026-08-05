import { describe, it, expect } from "vitest";
import { sanitizeEmail, sanitizeSearchQuery, sanitizeNumeric } from "./sanitizer";

describe("sanitizer utility", () => {
  describe("sanitizeEmail", () => {
    it("should trim, lowercase and remove spaces", () => {
      const email = "  Usuario.Test@Example.COM  ";
      expect(sanitizeEmail(email)).toBe("usuario.test@example.com");
    });

    it("should return empty string for non-string inputs", () => {
      expect(sanitizeEmail(null as unknown as string)).toBe("");
      expect(sanitizeEmail(undefined as unknown as string)).toBe("");
    });

    it("should remove internal spaces", () => {
      expect(sanitizeEmail("user @domain.com")).toBe("user@domain.com");
    });
  });

  describe("sanitizeSearchQuery", () => {
    it("should trim and collapse multiple spaces", () => {
      const query = "  zapato   deportivo  ";
      expect(sanitizeSearchQuery(query)).toBe("zapato deportivo");
    });

    it("should truncate searches exceeding max length", () => {
      const longQuery = "a".repeat(150);
      expect(sanitizeSearchQuery(longQuery, 100).length).toBe(100);
    });

    it("should return empty string for non-string inputs", () => {
      expect(sanitizeSearchQuery(null as unknown as string)).toBe("");
    });
  });

  describe("sanitizeNumeric", () => {
    it("should strip non-digit characters", () => {
      expect(sanitizeNumeric("123-456 abc!")).toBe("123456");
      expect(sanitizeNumeric("OTP: 987654")).toBe("987654");
    });

    it("should return empty string for non-string inputs", () => {
      expect(sanitizeNumeric(null as unknown as string)).toBe("");
    });
  });
});

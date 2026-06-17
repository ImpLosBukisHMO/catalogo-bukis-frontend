import { describe, expect, it } from "vitest";
import { normalizeResponse } from "./responseNormalizer";

type Item = { id: number };

describe("normalizeResponse", () => {
  it("returns a direct array unchanged", () => {
    const data = [{ id: 1 }];

    expect(normalizeResponse<Item>(data)).toEqual(data);
  });

  it("unwraps arrays under data", () => {
    expect(normalizeResponse<Item>({ data: [{ id: 1 }] })).toEqual([{ id: 1 }]);
  });

  it("unwraps arrays under results", () => {
    expect(normalizeResponse<Item>({ results: [{ id: 2 }] })).toEqual([{ id: 2 }]);
  });

  it("unwraps arrays under datos", () => {
    expect(normalizeResponse<Item>({ datos: [{ id: 3 }] })).toEqual([{ id: 3 }]);
  });

  it("returns an empty array for invalid payloads", () => {
    expect(normalizeResponse<Item>({ invalid: true })).toEqual([]);
    expect(normalizeResponse<Item>(null)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { queryClient } from "./queryClient";

describe("queryClient", () => {
  it("uses conservative global query defaults", () => {
    expect(queryClient.getDefaultOptions().queries).toMatchObject({
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    });
  });
});

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "./lib/queryClient";
import { App } from "./main";

vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => null,
}));

function QueryContextProbe() {
  const client = useQueryClient();
  const { data } = useQuery({
    queryKey: ["app-shell-query-context"],
    queryFn: async () => "query-context-ready",
  });

  return (
    <>
      <div>{client === queryClient ? "shared-query-client" : "unexpected-query-client"}</div>
      <div>{data ?? "loading"}</div>
    </>
  );
}

describe("App", () => {
  afterEach(() => {
    queryClient.clear();
  });

  it("provides React Query context to routed components from the app root", async () => {
    const router = createMemoryRouter([{ path: "/", element: <QueryContextProbe /> }]);

    render(<App router={router} />);

    expect(await screen.findByText("query-context-ready")).toBeInTheDocument();
    expect(screen.getByText("shared-query-client")).toBeInTheDocument();
  });
});

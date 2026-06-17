import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { WorkerThemeProvider } from "./WorkerThemeProvider";
import "../../styles/worker.css";

type WorkerProvidersProps = {
  children: ReactNode;
};

const createWorkerQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
    },
  });

export const WorkerProviders = ({ children }: WorkerProvidersProps) => {
  const [queryClient] = useState(createWorkerQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <WorkerThemeProvider>{children}</WorkerThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

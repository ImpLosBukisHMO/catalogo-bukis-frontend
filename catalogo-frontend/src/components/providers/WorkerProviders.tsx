import { type ReactNode } from "react";
import { WorkerThemeProvider } from "./WorkerThemeProvider";
import "../../styles/worker.css";

type WorkerProvidersProps = {
  children: ReactNode;
};

export const WorkerProviders = ({ children }: WorkerProvidersProps) => {
  return <WorkerThemeProvider>{children}</WorkerThemeProvider>;
};

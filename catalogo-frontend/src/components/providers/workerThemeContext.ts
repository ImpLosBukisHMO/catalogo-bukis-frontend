import { createContext } from "react";

export type WorkerTheme = "light" | "dark";

export type WorkerThemeContextValue = {
  theme: WorkerTheme;
  setTheme: (theme: WorkerTheme) => void;
  toggleTheme: () => void;
};

export const WORKER_THEME_STORAGE_KEY = "bukis.worker.theme";

export const WorkerThemeContext = createContext<WorkerThemeContextValue | null>(null);

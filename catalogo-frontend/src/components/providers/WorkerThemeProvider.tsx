import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  WORKER_THEME_STORAGE_KEY,
  WorkerThemeContext,
  type WorkerTheme,
} from "./workerThemeContext";

const isWorkerTheme = (value: string | null): value is WorkerTheme =>
  value === "light" || value === "dark";

const getSystemWorkerTheme = (): WorkerTheme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getInitialWorkerTheme = (): WorkerTheme => {
  if (typeof window === "undefined") return "light";

  const storedTheme = window.localStorage.getItem(WORKER_THEME_STORAGE_KEY);
  if (isWorkerTheme(storedTheme)) return storedTheme;

  return getSystemWorkerTheme();
};

type WorkerThemeProviderProps = {
  children: ReactNode;
};

export const WorkerThemeProvider = ({ children }: WorkerThemeProviderProps) => {
  const [theme, setThemeState] = useState<WorkerTheme>(getInitialWorkerTheme);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(WORKER_THEME_STORAGE_KEY);
    if (isWorkerTheme(storedTheme)) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      setThemeState(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  const setTheme = useCallback((nextTheme: WorkerTheme) => {
    window.localStorage.setItem(WORKER_THEME_STORAGE_KEY, nextTheme);
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme]
  );

  return (
    <WorkerThemeContext.Provider value={value}>
      <div className="worker-scope" data-worker-theme={theme}>
        {children}
      </div>
    </WorkerThemeContext.Provider>
  );
};

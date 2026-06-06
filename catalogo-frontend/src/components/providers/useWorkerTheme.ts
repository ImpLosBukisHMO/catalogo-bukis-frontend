import { useContext } from "react";
import { WorkerThemeContext } from "./workerThemeContext";

export const useWorkerTheme = () => {
  const context = useContext(WorkerThemeContext);
  if (!context) {
    throw new Error("useWorkerTheme must be used within WorkerThemeProvider");
  }
  return context;
};

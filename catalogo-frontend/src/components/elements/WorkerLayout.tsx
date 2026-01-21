import { Outlet } from "react-router-dom";
import WorkerSidebar from "./WorkerSidebar";

const WorkerLayout = () => {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        color: "#111",
      }}
    >
      <WorkerSidebar />

      <main
        style={{
          flex: 1,
          padding: "32px",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default WorkerLayout;

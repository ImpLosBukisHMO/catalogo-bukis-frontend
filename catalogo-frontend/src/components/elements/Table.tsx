// src/components/elements/Table.tsx
import React from "react";

type Column<T> = {
  header: string;
  render: (row: T) => React.ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
};

export default function Table<T>({ columns, data }: TableProps<T>) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#f9fafb" }}>
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                style={{
                  textAlign: "left",
                  padding: "12px",
                  fontSize: 14,
                  color: "#374151",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((c, j) => (
                <td
                  key={j}
                  style={{
                    padding: "12px",
                    fontSize: 14,
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

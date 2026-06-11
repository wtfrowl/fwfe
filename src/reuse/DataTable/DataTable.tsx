import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => ReactNode;
}

export function DataTable<T>({
  title,
  subtitle,
  columns,
  data,
}: {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 ${
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b last:border-none hover:bg-gray-50 transition">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-4 ${
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                    }`}
                  >
                    {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

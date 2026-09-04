import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => ReactNode;
}

const alignClass = (align: Column<unknown>["align"]) =>
  align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

export function DataTable<T>({
  title,
  subtitle,
  columns,
  data,
  emptyMessage = "Nothing to show yet.",
}: {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}) {
  return (
    <section className="overflow-hidden rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)]">
      <header className="border-b border-hairline px-5 py-4">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-secondary">{subtitle}</p>}
      </header>

      {/* An analytics table with no rows used to render as a bare header and
          an empty white box, which reads as a broken component. */}
      {data.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-ink-tertiary">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "text-caption px-4 py-3 text-xs font-semibold uppercase whitespace-nowrap text-ink-tertiary",
                      alignClass(col.align)
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-hairline/70 transition-colors duration-150 last:border-0 hover:bg-ink/3"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3.5 text-ink-secondary",
                        /* Numbers line up only with tabular figures, and a
                           right-aligned column is always numeric here. */
                        col.align === "right" && "tabular-nums",
                        alignClass(col.align)
                      )}
                    >
                      {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

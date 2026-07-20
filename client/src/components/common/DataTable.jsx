import { cn } from "@/lib/utils";

export function DataTable({ columns, data, emptyMessage = "No data", className, onRowClick }) {
  if (!data?.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{emptyMessage}</p>;
  }

  return (
    <div className={cn("w-full overflow-x-auto rounded-md border", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
              <th key={col.key} className="h-10 px-4 text-left font-medium text-muted-foreground">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id ?? row._id ?? i}
              className={cn("border-b last:border-0", onRowClick && "cursor-pointer hover:bg-muted/50")}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 align-middle">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

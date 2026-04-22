import { useState, ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: string;
  filterOptions?: FilterOption[];
  onRowClick?: (item: T) => void;
  pageSize?: number;
}

export function DataTable<T extends Record<string, any>>({
  data, columns, searchPlaceholder = "Tìm kiếm...", searchKey = "name",
  filterOptions = [], onRowClick, pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);

  let filtered = data.filter((item) => {
    if (search && !String(item[searchKey] ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    for (const [key, value] of Object.entries(filters)) {
      if (value && value !== "all" && item[key] !== value) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        {filterOptions.map((f) => (
          <Select key={f.key} value={filters[f.key] || "all"} onValueChange={(v) => { setFilters({ ...filters, [f.key]: v }); setPage(0); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder={f.label} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {f.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : (
              paginated.map((item, i) => (
                <TableRow key={i} className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""} onClick={() => onRowClick?.(item)}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>{col.render ? col.render(item) : String(item[col.key] ?? "")}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Hiển thị {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filtered.length)} / {filtered.length}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

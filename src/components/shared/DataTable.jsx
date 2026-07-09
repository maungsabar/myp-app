import { Search, Edit2, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';

const ENTRIES_OPTIONS = [10, 25, 50, 100];

export default function DataTable({ columns, data, onEdit, onDelete, onView, title, actions, selectable = false, selectedIds, onSelectionChange, bulkActions }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = data.filter(row =>
    columns.some(col => {
      const val = row[col.key];
      return val && String(val).toLowerCase().includes(search.toLowerCase());
    })
  );

  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = a[sortCol] ?? '';
        const bv = b[sortCol] ?? '';
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : filtered;

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sorted.length / entriesPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * entriesPerPage;
  const paginatedData = sorted.slice(startIdx, startIdx + entriesPerPage);

  // Reset to page 1 when search, sort, or entries change
  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleEntriesChange = (value) => {
    setEntriesPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(key); setSortDir('asc'); }
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, safePage - 1);
      let end = Math.min(totalPages - 1, safePage + 1);
      if (safePage <= 2) { start = 2; end = 4; }
      if (safePage >= totalPages - 1) { start = totalPages - 3; end = totalPages - 1; }
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  // Selection helpers (only when selectable)
  const pageIds = useMemo(() => paginatedData.map(row => row.id), [paginatedData]);
  const allPageSelected = selectable && pageIds.length > 0 && pageIds.every(id => selectedIds?.has(id));
  const somePageSelected = selectable && pageIds.some(id => selectedIds?.has(id));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (allPageSelected) {
      pageIds.forEach(id => next.delete(id));
    } else {
      pageIds.forEach(id => next.add(id));
    }
    onSelectionChange(next);
  };

  const handleSelectRow = (id) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const totalColSpan = columns.length + (selectable ? 1 : 0) + ((onEdit || onDelete || onView) ? 1 : 0);

  return (
    <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-warm-200 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        {title && <h3 className="text-base font-semibold text-primary-800">{title}</h3>}
        <div className="flex items-center gap-2 flex-1 sm:justify-end">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Cari..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-warm-50 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          {actions}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectable && selectedIds?.size > 0 && (
        <div className="px-5 py-2.5 bg-primary-50 border-b border-primary-100 flex items-center gap-3">
          <span className="text-sm font-medium text-primary-700">
            {selectedIds.size} data dipilih
          </span>
          {bulkActions}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-50">
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap
                    ${col.sortable !== false ? 'cursor-pointer hover:text-primary-600' : ''}`}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortCol === col.key && <span className="text-primary-600">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
              ))}
              {(onEdit || onDelete || onView) && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {paginatedData.length === 0 ? (
              <tr><td colSpan={totalColSpan} className="px-4 py-12 text-center text-gray-400">Tidak ada data</td></tr>
            ) : paginatedData.map((row, idx) => (
              <tr key={row.id || idx} className={`hover:bg-warm-50/50 transition-colors duration-150 ${selectable && selectedIds?.has(row.id) ? 'bg-primary-50/40' : ''}`}>
                {selectable && (
                  <td className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(row.id) || false}
                      onChange={() => handleSelectRow(row.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {(onEdit || onDelete || onView) && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onView && (
                        <button onClick={() => onView(row)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200">
                          <Eye size={15} />
                        </button>
                      )}
                      {onEdit && (
                        <button onClick={() => onEdit(row)} className="p-1.5 text-gray-400 hover:text-gold-500 hover:bg-gold-50 rounded-lg transition-all duration-200">
                          <Edit2 size={15} />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(row)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with Show Entries + Pagination */}
      <div className="px-5 py-3 border-t border-warm-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Tampilkan</span>
          <select
            value={entriesPerPage}
            onChange={e => handleEntriesChange(e.target.value)}
            className="px-2 py-1 text-sm border border-warm-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            {ENTRIES_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <span>data</span>
          <span className="text-gray-400 ml-2">
            {sorted.length > 0
              ? `${startIdx + 1}–${Math.min(startIdx + entriesPerPage, sorted.length)} dari ${sorted.length}`
              : `0 dari ${data.length}`
            }
            {search && sorted.length !== data.length && ` (difilter dari ${data.length})`}
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {pageNumbers.map((page, i) =>
              page === '...' ? (
                <span key={`dots-${i}`} className="px-2 py-1 text-xs text-gray-400">…</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200
                    ${safePage === page
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'
                    }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

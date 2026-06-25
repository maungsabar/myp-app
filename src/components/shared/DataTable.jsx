import { Search, Edit2, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';

export default function DataTable({ columns, data, onEdit, onDelete, onView, title, actions }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

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

  const handleSort = (key) => {
    if (sortCol === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(key); setSortDir('asc'); }
  };

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
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-warm-50 border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-50">
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
            {sorted.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-gray-400">Tidak ada data</td></tr>
            ) : sorted.map((row, idx) => (
              <tr key={row.id || idx} className="hover:bg-warm-50/50 transition-colors duration-150">
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

      {/* Footer */}
      <div className="px-5 py-3 border-t border-warm-100 text-xs text-gray-400">
        Menampilkan {sorted.length} dari {data.length} data
      </div>
    </div>
  );
}

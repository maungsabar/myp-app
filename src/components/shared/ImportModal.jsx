import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { X, Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImportModal({ isOpen, onClose, onImport, title, columns, templateName }) {
  const [step, setStep] = useState(1); // 1: upload, 2: preview/verify, 3: done
  const [rawData, setRawData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Reset state when modal opens/closes
  const resetState = useCallback(() => {
    setStep(1);
    setRawData([]);
    setErrors([]);
    setFileName('');
    setDragOver(false);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ── Download Template ──
  const downloadTemplate = () => {
    const headers = columns.map(c => c.header);
    const sampleRow = columns.map(c => c.sample || '');
    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);

    // Set column widths
    ws['!cols'] = columns.map(c => ({ wch: Math.max(c.header.length + 4, 18) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${templateName || 'Template_Import'}.xlsx`);
  };

  // ── Parse uploaded file ──
  const parseFile = (file) => {
    if (!file) return;
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Format file tidak didukung. Gunakan file .xlsx, .xls, atau .csv');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (json.length === 0) {
          alert('File kosong atau tidak ada data yang terbaca.');
          return;
        }

        // Normalize header string: trim, lowercase, collapse whitespace to underscore
        const normalizeHeader = (header) =>
          header
            ?.toString()
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_');

        // Build a lookup map: normalizedKey -> original Excel header key
        // This handles mismatched casing/whitespace (e.g. "EMAIL" -> "email", " Role " -> "role")
        const excelHeaders = json.length > 0 ? Object.keys(json[0]) : [];
        const headerMap = {};
        excelHeaders.forEach(h => {
          headerMap[normalizeHeader(h)] = h;
        });

        // Map Excel columns to our data fields
        const mapped = json.map((row, idx) => {
          const item = {};
          columns.forEach(col => {
            // Try exact match first, then normalized header, then normalized key
            const val = row[col.header]
              ?? row[headerMap[normalizeHeader(col.header)]]
              ?? row[col.key]
              ?? row[headerMap[normalizeHeader(col.key)]]
              ?? '';
            item[col.key] = col.transform ? col.transform(String(val).trim()) : String(val).trim();
          });
          item._row = idx + 2; // Excel row number (1-indexed + header)
          return item;
        });

        // Validate
        const validationErrors = [];
        mapped.forEach((item, idx) => {
          columns.forEach(col => {
            if (col.required && (!item[col.key] || String(item[col.key]).trim() === '')) {
              validationErrors.push({
                row: item._row,
                field: col.header,
                message: `${col.header} wajib diisi`,
              });
            }
            if (col.validate && item[col.key]) {
              const result = col.validate(item[col.key]);
              // validate can return: boolean (true=valid, false=invalid) or string (error message)
              if (result === false) {
                validationErrors.push({
                  row: item._row,
                  field: col.header,
                  message: `${col.header} tidak valid`,
                });
              } else if (typeof result === 'string') {
                validationErrors.push({
                  row: item._row,
                  field: col.header,
                  message: result,
                });
              }
              // result === true means valid, skip
            }
          });
        });

        setRawData(mapped);
        setErrors(validationErrors);
        setStep(2);
      } catch (err) {
        alert('Gagal membaca file. Pastikan format file benar.\n' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── File input handlers ──
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    parseFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    parseFile(file);
  };

  // ── Remove invalid rows ──
  const removeInvalidRows = () => {
    const errorRows = new Set(errors.map(e => e.row));
    const filtered = rawData.filter(item => !errorRows.has(item._row));
    setRawData(filtered);
    setErrors([]);
  };

  // ── Confirm import ──
  const handleConfirmImport = () => {
    const cleanData = rawData.map(({ _row, ...rest }) => rest);
    onImport(cleanData);
    setStep(3);
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  // ── Error summary ──
  const errorCount = errors.length;
  const errorRows = [...new Set(errors.map(e => e.row))];
  const validCount = rawData.length - errorRows.length;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl" style={{ animation: 'fadeIn 0.3s ease-out forwards' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={20} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-primary-800">{title}</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-warm-100 rounded-lg transition-all duration-200">
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2 text-xs font-medium">
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-warm-100 text-gray-400'}`}>
            <Upload size={12} /> Upload
          </span>
          <ChevronRight size={14} className="text-gray-300" />
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-warm-100 text-gray-400'}`}>
            <CheckCircle2 size={12} /> Verifikasi
          </span>
          <ChevronRight size={14} className="text-gray-300" />
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${step >= 3 ? 'bg-green-600 text-white' : 'bg-warm-100 text-gray-400'}`}>
            <CheckCircle2 size={12} /> Selesai
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Download template */}
              <div className="flex items-center justify-between bg-primary-50 rounded-xl border border-primary-200 p-4">
                <div>
                  <p className="text-sm font-semibold text-primary-800">Download Template</p>
                  <p className="text-xs text-gray-500 mt-0.5">Gunakan template ini agar format data sesuai</p>
                </div>
                <button onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-white border border-primary-200 hover:bg-primary-100 rounded-lg transition-all duration-200">
                  <Download size={16} /> Download .xlsx
                </button>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200
                  ${dragOver ? 'border-primary-400 bg-primary-50' : 'border-warm-300 hover:border-primary-300 hover:bg-warm-50'}`}
              >
                <Upload size={36} className={`mx-auto mb-3 ${dragOver ? 'text-primary-500' : 'text-gray-300'}`} />
                <p className="text-sm font-medium text-gray-600">
                  Seret & lepas file di sini, atau <span className="text-primary-600 underline">pilih file</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">Format: .xlsx, .xls, .csv</p>
                {fileName && (
                  <p className="text-xs text-primary-600 mt-2 font-medium">{fileName}</p>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
            </div>
          )}

          {/* STEP 2: Preview & Verify */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-warm-50 rounded-xl border border-warm-200 p-3 text-center">
                  <p className="text-2xl font-bold text-primary-700">{rawData.length}</p>
                  <p className="text-xs text-gray-500">Total Baris</p>
                </div>
                <div className="flex-1 bg-green-50 rounded-xl border border-green-200 p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{validCount}</p>
                  <p className="text-xs text-gray-500">Valid</p>
                </div>
                <div className={`flex-1 rounded-xl border p-3 text-center ${errorCount > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-2xl font-bold ${errorCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{errorCount}</p>
                  <p className="text-xs text-gray-500">Error</p>
                </div>
              </div>

              {/* Errors */}
              {errorCount > 0 && (
                <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-500" />
                      <p className="text-sm font-semibold text-red-700">{errorCount} error ditemukan di {errorRows.length} baris</p>
                    </div>
                    <button onClick={removeInvalidRows}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-all duration-200">
                      <Trash2 size={12} /> Hapus Baris Error
                    </button>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1">
                    {errors.slice(0, 20).map((err, i) => (
                      <p key={i} className="text-xs text-red-600">
                        Baris {err.row}: <span className="font-medium">{err.field}</span> — {err.message}
                      </p>
                    ))}
                    {errors.length > 20 && <p className="text-xs text-red-400 italic">...dan {errors.length - 20} error lainnya</p>}
                  </div>
                </div>
              )}

              {/* Data preview table */}
              <div className="overflow-x-auto border border-warm-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-warm-50">
                      <th className="px-3 py-2 text-left text-gray-500 font-semibold">No</th>
                      {columns.map(col => (
                        <th key={col.key} className="px-3 py-2 text-left text-gray-500 font-semibold whitespace-nowrap">{col.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {rawData.slice(0, 50).map((row, idx) => {
                      const hasError = errorRows.includes(row._row);
                      return (
                        <tr key={idx} className={hasError ? 'bg-red-50/50' : 'hover:bg-warm-50/50'}>
                          <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                          {columns.map(col => {
                            const cellError = errors.some(e => e.row === row._row && e.field === col.header);
                            return (
                              <td key={col.key} className={`px-3 py-2 whitespace-nowrap ${cellError ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                                {col.renderCell ? col.renderCell(row[col.key]) : String(row[col.key] ?? '')}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {rawData.length > 50 && (
                  <p className="text-xs text-gray-400 text-center py-2">Menampilkan 50 dari {rawData.length} baris</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Done */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} className="text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Import Berhasil!</h3>
              <p className="text-sm text-gray-500 mt-1">{validCount} data berhasil diimport.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 3 && (
          <div className="px-6 py-4 border-t border-warm-200 flex items-center justify-between">
            <div>
              {step === 2 && (
                <button onClick={() => { setStep(1); setRawData([]); setErrors([]); setFileName(''); }}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 bg-warm-100 hover:bg-warm-200 rounded-lg transition-all duration-200">
                  <ChevronLeft size={14} /> Upload Ulang
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-warm-100 hover:bg-warm-200 rounded-lg transition-all duration-200">Batal</button>
              {step === 2 && (
                <button onClick={handleConfirmImport}
                  disabled={validCount === 0}
                  className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 shadow-sm
                    ${validCount > 0 ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-300 cursor-not-allowed'}`}>
                  <Upload size={14} /> Import {validCount} Data
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

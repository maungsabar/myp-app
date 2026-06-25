import { useState, useEffect } from 'react';
import api from '../services/api';
import { useApp } from '../context/AppContext';
import { ClipboardList, Save, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';

const DEFAULT_BOUNDARIES = [
  { grade: 1, min: 0, max: 5, label: "Produces work of very limited quality." },
  { grade: 2, min: 6, max: 9, label: "Produces work of limited quality." },
  { grade: 3, min: 10, max: 14, label: "Produces work of an acceptable quality." },
  { grade: 4, min: 15, max: 18, label: "Produces good-quality work." },
  { grade: 5, min: 19, max: 23, label: "Produces generally high-quality work." },
  { grade: 6, min: 24, max: 27, label: "Produces high-quality, occasionally innovative work." },
  { grade: 7, min: 28, max: 32, label: "Produces high-quality, frequently innovative work." },
];

const gradeColors = {
  1: 'bg-red-100 text-red-700 border-red-200',
  2: 'bg-red-100 text-red-700 border-red-200',
  3: 'bg-orange-100 text-orange-700 border-orange-200',
  4: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  5: 'bg-amber-100 text-amber-700 border-amber-200',
  6: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  7: 'bg-teal-100 text-teal-800 border-teal-200',
};

export default function GradeBoundaries() {
  const { showToast } = useApp();
  const [boundaries, setBoundaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    api.getGradeBoundaries()
      .then(data => {
        if (data.length > 0) {
          setBoundaries(data);
        } else {
          setBoundaries([...DEFAULT_BOUNDARIES]);
        }
      })
      .catch(() => setBoundaries([...DEFAULT_BOUNDARIES]))
      .finally(() => setLoading(false));
  }, []);

  const updateBoundary = (index, field, value) => {
    setBoundaries(prev => prev.map((b, i) =>
      i === index ? { ...b, [field]: field === 'label' ? value : Number(value) } : b
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api.saveGradeBoundaries(boundaries);
      setBoundaries(result);
      setHasChanges(false);
      showToast('success', 'Grade boundaries berhasil disimpan.');
    } catch (err) {
      showToast('error', `Gagal menyimpan: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setBoundaries([...DEFAULT_BOUNDARIES]);
    setHasChanges(true);
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600">
            <ClipboardList size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-900">Grade Boundaries</h1>
            <p className="text-sm text-gray-500">Atur batas nilai dan deskriptor untuk setiap MYP Final Grade (1–7).</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-warm-100 hover:bg-warm-200 rounded-lg transition-all duration-200"
            title="Reset ke default"
          >
            <RotateCcw size={15} /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={16} /> {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertCircle size={18} className="text-primary-500 shrink-0 mt-0.5" />
        <div className="text-sm text-primary-700">
          <p className="font-medium">Panduan MYP Grade Boundaries</p>
          <p className="text-xs text-primary-600 mt-0.5">
            Setiap MYP Final Grade (1–7) memiliki rentang skor (Boundary Guidelines) dari total maksimal 32 poin (4 kriteria × 8 poin).
            Descriptor menjelaskan kualitas pekerjaan siswa pada setiap level grade.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-700 text-white">
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase w-24">Final Grade</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase w-20">Min</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase w-20">Max</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Descriptor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {boundaries.map((b, idx) => (
                <tr key={b.grade} className="hover:bg-warm-50/50 transition-colors">
                  {/* Grade badge */}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-base font-bold border-2 ${gradeColors[b.grade] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {b.grade}
                    </span>
                  </td>
                  {/* Min */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={0}
                      max={32}
                      value={b.min}
                      onChange={e => updateBoundary(idx, 'min', e.target.value)}
                      className="w-16 px-2 py-1.5 text-sm text-center border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </td>
                  {/* Max */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min={0}
                      max={32}
                      value={b.max}
                      onChange={e => updateBoundary(idx, 'max', e.target.value)}
                      className="w-16 px-2 py-1.5 text-sm text-center border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                  </td>
                  {/* Descriptor */}
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={b.label}
                      onChange={e => updateBoundary(idx, 'label', e.target.value)}
                      className={inputCls}
                      placeholder="Deskriptor untuk grade ini..."
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

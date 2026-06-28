import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getCriteriaKeys, getCriteriaCount, ACHIEVEMENT_LEVELS } from '../data/dummyData';
import { BookOpen, Save, CheckCircle2, ChevronRight, GraduationCap } from 'lucide-react';

function isSubjectAvailableForGrade(subject, gradeLevel) {
  if (!subject?.availableGrades || subject.availableGrades.length === 0) return true;
  const gl = typeof gradeLevel === 'string' ? parseInt(gradeLevel) : gradeLevel;
  return subject.availableGrades.includes(gl);
}

// Default empty levels structure
const emptyLevels = () => ({ "0": [], "1-2": [], "3-4": [], "5-6": [], "7-8": [] });

export default function Descriptors() {
  const { subjects, criteriaDescriptors, setCriteriaDescriptors, saveCriteriaDescriptors, GRADE_LEVELS } = useApp();
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState(GRADE_LEVELS[0]?.key || '7');
  const [localDescriptors, setLocalDescriptors] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const criteriaCount = getCriteriaCount(selectedSubject, parseInt(selectedGradeLevel));
  const activeCriteria = getCriteriaKeys(criteriaCount);

  const availableGradeLevels = GRADE_LEVELS.filter(gl =>
    isSubjectAvailableForGrade(selectedSubject, gl.key)
  );

  useEffect(() => {
    if (selectedSubject && !isSubjectAvailableForGrade(selectedSubject, selectedGradeLevel)) {
      const firstAvailable = GRADE_LEVELS.find(gl => isSubjectAvailableForGrade(selectedSubject, gl.key));
      if (firstAvailable) setSelectedGradeLevel(firstAvailable.key);
    }
  }, [selectedSubjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedSubjectId && criteriaDescriptors[selectedSubjectId]) {
      const src = criteriaDescriptors[selectedSubjectId][selectedGradeLevel];
      const subject = subjects.find(s => s.id === selectedSubjectId);
      const keys = getCriteriaKeys(getCriteriaCount(subject, parseInt(selectedGradeLevel)));
      if (src) {
        const cloned = {};
        keys.forEach(k => {
          const srcLevels = src[k]?.levels || src[k]?.descriptors
            ? (src[k].levels || { "0": [], "1-2": [], "3-4": [], "5-6": [], "7-8": src[k].descriptors || [] })
            : emptyLevels();
          cloned[k] = {
            title: src[k]?.title || '',
            levels: { ...emptyLevels(), ...srcLevels },
          };
        });
        setLocalDescriptors(cloned);
      } else {
        const empty = {};
        keys.forEach(k => {
          empty[k] = { title: '', levels: emptyLevels() };
        });
        setLocalDescriptors(empty);
      }
    }
  }, [selectedSubjectId, selectedGradeLevel, criteriaDescriptors, subjects]);

  const updateTitle = (criteria, title) => {
    setLocalDescriptors(prev => ({
      ...prev,
      [criteria]: { ...prev[criteria], title },
    }));
  };

  const updateLevelDescriptors = (criteria, level, text) => {
    const lines = text.split('\n').filter(l => l.trim());
    setLocalDescriptors(prev => ({
      ...prev,
      [criteria]: {
        ...prev[criteria],
        levels: { ...prev[criteria]?.levels, [level]: lines },
      },
    }));
  };

  const getLevelText = (criteria, level) => {
    if (!localDescriptors?.[criteria]?.levels?.[level]) return '';
    return localDescriptors[criteria].levels[level].join('\n');
  };

  const handleSave = () => {
    if (!selectedSubjectId || !localDescriptors) return;
    const filtered = {};
    activeCriteria.forEach(k => {
      filtered[k] = localDescriptors[k] || { title: '', levels: emptyLevels() };
    });
    const existing = criteriaDescriptors[selectedSubjectId] || {};
    const merged = { ...existing, [selectedGradeLevel]: filtered };
    setCriteriaDescriptors(prev => ({ ...prev, [selectedSubjectId]: merged }));
    saveCriteriaDescriptors(selectedSubjectId, merged);
    setSaveMsg('Deskriptor berhasil disimpan.');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const hasDescriptors = (subjectId, gradeLevel) => {
    return !!criteriaDescriptors[subjectId]?.[gradeLevel];
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-warm-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400';
  const labelCls = 'block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1';

  const criteriaColors = {
    A: { border: 'border-l-primary-600', bg: 'bg-primary-50', text: 'text-primary-700', badge: 'bg-primary-600 text-white' },
    B: { border: 'border-l-gold-500', bg: 'bg-gold-50', text: 'text-gold-600', badge: 'bg-gold-500 text-white' },
    C: { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-500 text-white' },
    D: { border: 'border-l-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-500 text-white' },
  };

  const levelColors = {
    "0": 'bg-gray-100 text-gray-600 border-gray-200',
    "1-2": 'bg-red-50 text-red-700 border-red-200',
    "3-4": 'bg-amber-50 text-amber-700 border-amber-200',
    "5-6": 'bg-emerald-50 text-emerald-700 border-emerald-200',
    "7-8": 'bg-primary-50 text-primary-700 border-primary-200',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600">
            <BookOpen size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-primary-800">Deskriptor Kriteria</h2>
            <p className="text-sm text-gray-500">Atur deskriptor per level pencapaian untuk setiap kriteria.</p>
          </div>
        </div>
        {saveMsg && (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={16} />
            {saveMsg}
          </div>
        )}
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left panel: Subject list */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-warm-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Mata Pelajaran</h3>
            </div>
            <div className="divide-y divide-warm-100 max-h-[600px] overflow-y-auto">
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => setSelectedSubjectId(subject.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150
                    ${selectedSubjectId === subject.id ? 'bg-primary-50 border-l-3 border-l-primary-600' : 'hover:bg-warm-50'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${selectedSubjectId === subject.id ? 'text-primary-700' : 'text-gray-700'}`}>
                      {subject.shortName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{subject.category}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {GRADE_LEVELS.map(gl => {
                      const available = isSubjectAvailableForGrade(subject, gl.key);
                      return (
                        <span
                          key={gl.key}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            !available
                              ? 'bg-gray-100 text-gray-300 line-through'
                              : hasDescriptors(subject.id, gl.key)
                                ? 'bg-primary-100 text-primary-600'
                                : 'bg-gray-100 text-gray-400'
                          }`}
                          title={available ? gl.label : `${gl.label} — tidak tersedia`}
                        >
                          {gl.key}
                        </span>
                      );
                    })}
                  </div>
                  {selectedSubjectId === subject.id && <ChevronRight size={16} className="text-primary-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel: Criteria forms */}
        <div className="lg:col-span-8 xl:col-span-9">
          {!selectedSubject || !localDescriptors ? (
            <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-12 text-center text-gray-400">
              Pilih mata pelajaran untuk mengedit deskriptor.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Subject header */}
              <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-primary-800">{selectedSubject.name}</h3>
                  <p className="text-xs text-gray-400">{selectedSubject.category}</p>
                </div>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Save size={16} /> Simpan
                </button>
              </div>

              {/* Grade level tabs */}
              <div className="bg-white rounded-xl border border-warm-200 shadow-sm p-1 flex items-center gap-1">
                {availableGradeLevels.map(gl => (
                  <button
                    key={gl.key}
                    onClick={() => setSelectedGradeLevel(gl.key)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                      ${selectedGradeLevel === gl.key
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-500 hover:bg-warm-50 hover:text-gray-700'
                      }`}
                  >
                    <GraduationCap size={16} />
                    <div className="text-left">
                      <p className="font-semibold text-xs">{gl.label}</p>
                      <p className={`text-[10px] ${selectedGradeLevel === gl.key ? 'text-primary-100' : 'text-gray-400'}`}>{gl.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Criteria sections with achievement levels */}
              {activeCriteria.map(key => {
                const colors = criteriaColors[key];
                const criteria = localDescriptors[key];
                return (
                  <div key={key} className={`bg-white rounded-xl border border-warm-200 shadow-sm overflow-hidden border-l-4 ${colors.border}`}>
                    {/* Criteria header */}
                    <div className={`px-5 py-3 ${colors.bg} flex items-center gap-3`}>
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${colors.badge}`}>
                        {key}
                      </span>
                      <input
                        className={`flex-1 bg-transparent text-base font-semibold ${colors.text} focus:outline-none border-b border-transparent focus:border-current pb-0.5`}
                        value={criteria?.title || ''}
                        onChange={e => updateTitle(key, e.target.value)}
                        placeholder={`Criterion ${key} Title`}
                      />
                    </div>

                    {/* Achievement level bands */}
                    <div className="p-4 space-y-3">
                      {ACHIEVEMENT_LEVELS.map(level => {
                        const isLevelZero = level.key === "0";
                        return (
                          <div key={level.key} className={`rounded-lg border ${levelColors[level.key]} p-3`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/60">
                                Level {level.label}
                              </span>
                              <span className="text-[11px] italic opacity-70">{level.description}</span>
                            </div>
                            {isLevelZero ? (
                              <p className="text-xs opacity-60 italic pl-2">
                                (Deskriptor tetap — tidak dapat diubah)
                              </p>
                            ) : (
                              <textarea
                                className={`w-full px-3 py-2 text-xs border border-transparent rounded-md bg-white/50 focus:bg-white focus:border-warm-300 focus:outline-none focus:ring-1 focus:ring-primary-300 resize-y font-mono leading-relaxed`}
                                value={getLevelText(key, level.key)}
                                onChange={e => updateLevelDescriptors(key, level.key, e.target.value)}
                                placeholder={`Deskriptor untuk level ${level.label}, satu per baris...`}
                                rows={Math.max(2, (localDescriptors?.[key]?.levels?.[level.key]?.length || 0) + 1)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

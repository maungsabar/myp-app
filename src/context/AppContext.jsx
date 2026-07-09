import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as data from '../data/dummyData';
import api, { setAuthToken, clearAuthToken, getAuthToken } from '../services/api';

const AppContext = createContext();

// Role-based page access map
export const ROLE_ACCESS = {
  admin: ['*'], // all pages
  coordinator: ['/', '/master/mata-pelajaran', '/master/deskriptor', '/master/grade-boundaries', '/laporan/progres-nilai', '/laporan/rapor'],
  homeroom: ['/', '/akademik/nilai', '/akademik/kehadiran', '/laporan/progres-nilai', '/laporan/rapor'],
  subject: ['/', '/akademik/nilai'],
  student: ['/', '/laporan/rapor'],
};

export function AppProvider({ children }) {
  // ─── Auth State ────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // ─── Data State (start empty, populated from API) ─────────────────
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [homeroomComments, setHomeroomComments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [schoolProfile, setSchoolProfile] = useState({ name: '', address: '', phone: '', email: '', principal: '', mypCoordinator: '' });
  const [users, setUsers] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [classes, setClasses] = useState([]);
  const [criteriaDescriptors, setCriteriaDescriptors] = useState({});
  const [learnerProfiles, setLearnerProfiles] = useState([]);
  const [ibProfileLogo, setIbProfileLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);
  const toastTimer = useRef(null);

  // ─── Toast helper ──────────────────────────────────────────────────
  const showToast = useCallback((type, message) => {
    if (!type) { setToast(null); return; }
    setToast({ type, message });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // ─── Auth: check token on mount ─────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      const token = getAuthToken();
      if (!token) { setAuthLoading(false); return; }
      try {
        const user = await api.getMe();
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch {
        clearAuthToken();
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  // ─── Auth: login ────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    const result = await api.login(username, password);
    setAuthToken(result.token);
    setCurrentUser(result.user);
    setIsAuthenticated(true);
    return result.user;
  }, []);

  // ─── Auth: logout ───────────────────────────────────────────────
  const logout = useCallback(() => {
    clearAuthToken();
    setCurrentUser(null);
    setIsAuthenticated(false);
  }, []);

  // ─── Load all data from API on mount ──────────────────────────────
  useEffect(() => {
    if (authLoading) return; // Wait for auth check to finish
    let cancelled = false;
    async function loadAll() {
      if (!isAuthenticated) { setLoading(false); return; }
      try {
        // Use allSettled so role-restricted endpoints don't block other data
        const results = await Promise.allSettled([
          api.getStudents(),          // 0
          api.getTeachers(),          // 1
          api.getSubjects(),          // 2
          api.getGrades(),            // 3
          api.getAttendance(),        // 4
          api.getHomeroomComments(),  // 5
          api.getAcademicYears(),     // 6
          api.getSchoolProfile(),     // 7
          api.getUsers(),             // 8
          api.getAlumni(),            // 9
          api.getClasses(),           // 10
          api.getLearnerProfiles(),   // 11
          api.getIbProfileLogo(),     // 12
        ]);

        if (cancelled) return;

        // Helper: extract value if fulfilled
        const val = (i) => results[i].status === 'fulfilled' ? results[i].value : null;
        const hasAnySuccess = results.some(r => r.status === 'fulfilled');

        if (val(0)) setStudents(val(0));
        if (val(1)) setTeachers(val(1));
        if (val(2)) setSubjects(val(2));
        if (val(3)) setGrades(val(3).map(({ student, subject, ...rest }) => rest));
        if (val(4)) setAttendances(val(4).map(({ student, ...rest }) => rest));
        if (val(5)) setHomeroomComments(val(5).map(({ student, ...rest }) => rest));
        if (val(6)) setAcademicYears(val(6));
        if (val(7)) setSchoolProfile(val(7));
        if (val(8)) setUsers(val(8));
        if (val(9)) setAlumni(val(9));
        if (val(10)) setClasses(val(10).map(({ homeroomTeacher, ...rest }) => rest));
        if (val(11)) setLearnerProfiles(val(11).map(({ name, description }) => ({ name, description })));
        if (val(12)) setIbProfileLogo(val(12)?.logo || null);

        if (hasAnySuccess) {
          setApiConnected(true);
          // Initialize selectedAcademicYearId to active year
          const activeYear = (val(6) || []).find(y => y.isActive);
          if (activeYear) setSelectedAcademicYearId(activeYear.id);
        } else {
          setApiConnected(false);
          showToast('error', 'Backend tidak terhubung. Jalankan server: cd server && npm run dev');
        }

        // Load criteria descriptors for available subjects
        const subjectsList = val(2) || [];
        if (subjectsList.length > 0) {
          const descMap = {};
          await Promise.all(
            subjectsList.map(async (sub) => {
              try {
                const desc = await api.getCriteriaDescriptors(sub.id);
                descMap[sub.id] = desc;
              } catch { descMap[sub.id] = {}; }
            })
          );
          if (!cancelled) setCriteriaDescriptors(prev => ({ ...prev, ...descMap }));
        }
      } catch (err) {
        if (!cancelled) {
          setApiConnected(false);
          showToast('error', `Backend tidak terhubung: ${err.message}. Jalankan server: cd server && npm run dev`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, [isAuthenticated, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeYear = academicYears.find(y => y.isActive) || academicYears[academicYears.length - 1];

  // ─── Re-fetch year-dependent data when selected year changes ──────
  useEffect(() => {
    if (!isAuthenticated || !selectedAcademicYearId) return;
    const yearId = selectedAcademicYearId;

    // Re-fetch students filtered by year
    api.getStudents({ academicYearId: yearId }).then(data => setStudents(data)).catch(() => {});
    // Re-fetch classes filtered by year
    api.getClasses({ academicYearId: yearId }).then(data => setClasses(data.map(({ homeroomTeacher, ...rest }) => rest))).catch(() => {});
  }, [selectedAcademicYearId, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Safe API wrapper ─────────────────────────────────────────────
  // Calls API, shows error toast on failure. Returns the API response or null.
  const safeApi = useCallback(async (apiCall, actionLabel) => {
    try {
      return await apiCall();
    } catch (err) {
      showToast('error', `Gagal ${actionLabel}: ${err.message}`);
      return null;
    }
  }, [showToast]);

  // ─── CRUD helpers ──────────────────────────────────────────────────

  // Students
  const addStudent = useCallback(async (item) => {
    const created = await safeApi(() => api.createStudent(item), 'menambah siswa');
    if (created) {
      setStudents(prev => [...prev, created]);
      return created;
    }
    return null;
  }, [safeApi]);

  const updateStudent = useCallback(async (id, updates) => {
    const result = await safeApi(() => api.updateStudent(id, updates), 'mengupdate siswa');
    if (result) {
      setStudents(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    }
  }, [safeApi]);

  const deleteStudent = useCallback(async (id) => {
    const result = await safeApi(() => api.deleteStudent(id), 'menghapus siswa');
    if (result) {
      setStudents(prev => prev.filter(i => i.id !== id));
    }
  }, [safeApi]);

  const bulkDeleteStudents = useCallback(async (ids) => {
    const result = await safeApi(() => api.bulkDeleteStudents(ids), 'menghapus siswa massal');
    if (result) {
      const idSet = new Set(ids);
      setStudents(prev => prev.filter(i => !idSet.has(i.id)));
    }
    return result;
  }, [safeApi]);

  // Teachers
  const addTeacher = useCallback(async (item) => {
    const created = await safeApi(() => api.createTeacher(item), 'menambah guru');
    if (created) {
      setTeachers(prev => [...prev, created]);
      return created;
    }
    return null;
  }, [safeApi]);

  const updateTeacher = useCallback(async (id, updates) => {
    const result = await safeApi(() => api.updateTeacher(id, updates), 'mengupdate guru');
    if (result) {
      setTeachers(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    }
  }, [safeApi]);

  const deleteTeacher = useCallback(async (id) => {
    const result = await safeApi(() => api.deleteTeacher(id), 'menghapus guru');
    if (result) {
      setTeachers(prev => prev.filter(i => i.id !== id));
    }
  }, [safeApi]);

  const bulkDeleteTeachers = useCallback(async (ids) => {
    const result = await safeApi(() => api.bulkDeleteTeachers(ids), 'menghapus guru massal');
    if (result) {
      const idSet = new Set(ids);
      setTeachers(prev => prev.filter(i => !idSet.has(i.id)));
    }
    return result;
  }, [safeApi]);

  // Subjects
  const addSubject = useCallback(async (item) => {
    const created = await safeApi(() => api.createSubject(item), 'menambah mata pelajaran');
    if (created) {
      setSubjects(prev => [...prev, created]);
      return created;
    }
    return null;
  }, [safeApi]);

  const updateSubject = useCallback(async (id, updates) => {
    const result = await safeApi(() => api.updateSubject(id, updates), 'mengupdate mata pelajaran');
    if (result) {
      setSubjects(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    }
  }, [safeApi]);

  const deleteSubject = useCallback(async (id) => {
    const result = await safeApi(() => api.deleteSubject(id), 'menghapus mata pelajaran');
    if (result) {
      setSubjects(prev => prev.filter(i => i.id !== id));
    }
  }, [safeApi]);

  // Classes
  const addClass = useCallback(async (item) => {
    const created = await safeApi(() => api.createClass(item), 'menambah kelas');
    if (created) {
      setClasses(prev => [...prev, created]);
      return created;
    }
    return null;
  }, [safeApi]);

  const updateClass = useCallback(async (id, updates) => {
    const result = await safeApi(() => api.updateClass(id, updates), 'mengupdate kelas');
    if (result) {
      setClasses(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    }
  }, [safeApi]);

  const deleteClass = useCallback(async (id) => {
    const result = await safeApi(() => api.deleteClass(id), 'menghapus kelas');
    if (result) {
      setClasses(prev => prev.filter(i => i.id !== id));
    }
  }, [safeApi]);

  // Users
  const addUser = useCallback(async (item) => {
    const created = await safeApi(() => api.createUser(item), 'menambah user');
    if (created) {
      setUsers(prev => [...prev, created]);
      return created;
    }
    return null;
  }, [safeApi]);

  const updateUser = useCallback(async (id, updates) => {
    const result = await safeApi(() => api.updateUser(id, updates), 'mengupdate user');
    if (result) {
      setUsers(prev => prev.map(i => i.id === id ? { ...i, ...result } : i));
    }
  }, [safeApi]);

  const deleteUser = useCallback(async (id) => {
    const result = await safeApi(() => api.deleteUser(id), 'menghapus user');
    if (result) {
      setUsers(prev => prev.filter(i => i.id !== id));
    }
  }, [safeApi]);

  const bulkDeleteUsers = useCallback(async (ids) => {
    const result = await safeApi(() => api.bulkDeleteUsers(ids), 'menghapus user massal');
    if (result) {
      const idSet = new Set(ids);
      setUsers(prev => prev.filter(i => !idSet.has(i.id)));
    }
    return result;
  }, [safeApi]);

  // Grades — upsert
  const upsertGrade = useCallback(async (gradeData) => {
    const result = await safeApi(() => api.upsertGrade(gradeData), 'menyimpan nilai');
    if (result) {
      const { studentId, subjectId, semester, academicYear } = gradeData;
      setGrades(prev => {
        const existing = prev.find(g =>
          g.studentId === studentId && g.subjectId === subjectId &&
          g.semester === semester && g.academicYear === academicYear
        );
        if (existing) return prev.map(g => g.id === existing.id ? { ...g, ...result } : g);
        return [...prev, result];
      });
    }
  }, [safeApi]);

  const updateGrade = useCallback(async (id, updates) => {
    const result = await safeApi(() => api.updateGrade(id, updates), 'mengupdate nilai');
    if (result) {
      setGrades(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    }
  }, [safeApi]);

  // Attendance — upsert
  const upsertAttendance = useCallback(async (attData) => {
    const result = await safeApi(() => api.upsertAttendance(attData), 'menyimpan kehadiran');
    if (result) {
      const { studentId, semester, academicYear } = attData;
      setAttendances(prev => {
        const existing = prev.find(a => a.studentId === studentId && a.semester === semester && a.academicYear === academicYear);
        if (existing) return prev.map(a => a.id === existing.id ? { ...a, ...result } : a);
        return [...prev, result];
      });
    }
  }, [safeApi]);

  const updateAttendance = useCallback(async (id, updates) => {
    const result = await safeApi(() => api.updateAttendance(id, updates), 'mengupdate kehadiran');
    if (result) {
      setAttendances(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    }
  }, [safeApi]);

  // Homeroom Comments — upsert
  const upsertHomeroomComment = useCallback(async (commentData) => {
    const result = await safeApi(() => api.upsertHomeroomComment(commentData), 'menyimpan komentar wali kelas');
    if (result) {
      const { studentId, semester, academicYear } = commentData;
      setHomeroomComments(prev => {
        const existing = prev.find(c => c.studentId === studentId && c.semester === semester && c.academicYear === academicYear);
        if (existing) return prev.map(c => c.id === existing.id ? { ...c, ...result } : c);
        return [...prev, result];
      });
    }
  }, [safeApi]);

  const updateHomeroomComment = useCallback(async (id, updates) => {
    const result = await safeApi(() => api.updateHomeroomComment(id, updates), 'mengupdate komentar');
    if (result) {
      setHomeroomComments(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    }
  }, [safeApi]);

  // Alumni
  const addAlumni = useCallback(async (item) => {
    const created = await safeApi(() => api.createAlumni(item), 'menambah alumni');
    if (created) {
      setAlumni(prev => [...prev, created]);
      return created;
    }
    return null;
  }, [safeApi]);

  // School Profile
  const saveSchoolProfile = useCallback(async (profileData) => {
    const result = await safeApi(() => api.updateSchoolProfile(profileData), 'menyimpan profil sekolah');
    if (result) {
      setSchoolProfile(result);
      return true;
    }
    return false;
  }, [safeApi]);

  // Criteria Descriptors
  const saveCriteriaDescriptors = useCallback(async (subjectId, descriptors) => {
    const result = await safeApi(() => api.saveCriteriaDescriptors(subjectId, descriptors), 'menyimpan deskriptor');
    if (result) {
      setCriteriaDescriptors(prev => ({ ...prev, [subjectId]: result }));
    }
  }, [safeApi]);

  // Learner Profiles
  const saveLearnerProfiles = useCallback(async (profiles) => {
    const result = await safeApi(() => api.saveLearnerProfiles(profiles), 'menyimpan profil pembelajar');
    if (result) {
      setLearnerProfiles(result.map(({ name, description }) => ({ name, description })));
    }
  }, [safeApi]);

  // IB Profile Logo
  const saveIbProfileLogo = useCallback(async (logo) => {
    try {
      if (logo) await api.saveIbProfileLogo(logo);
      else await api.deleteIbProfileLogo();
      setIbProfileLogo(logo);
    } catch (err) {
      showToast('error', `Gagal menyimpan logo: ${err.message}`);
    }
  }, [showToast]);

  return (
    <AppContext.Provider value={{
      loading, apiConnected, toast, showToast,
      selectedAcademicYearId, setSelectedAcademicYearId,
      // Auth
      currentUser, isAuthenticated, authLoading, login, logout,
      // Students
      students, addStudent, updateStudent, deleteStudent, bulkDeleteStudents, setStudents,
      // Teachers
      teachers, addTeacher, updateTeacher, deleteTeacher, bulkDeleteTeachers,
      // Subjects
      subjects, addSubject, updateSubject, deleteSubject,
      // Grades
      grades, setGrades, updateGrade, upsertGrade,
      // Attendance
      attendances, updateAttendance, upsertAttendance, setAttendances,
      // Homeroom Comments
      homeroomComments, updateHomeroomComment, upsertHomeroomComment, setHomeroomComments,
      // Academic Years
      academicYears, setAcademicYears, activeYear,
      // School Profile
      schoolProfile, setSchoolProfile: saveSchoolProfile,
      // Users
      users, addUser, updateUser, deleteUser, bulkDeleteUsers,
      // Alumni
      alumni, setAlumni, addAlumni,
      // Classes
      classes, setClasses, addClass, updateClass, deleteClass,
      // Criteria Descriptors
      criteriaDescriptors, setCriteriaDescriptors, saveCriteriaDescriptors,
      // Static helpers (client-side only)
      gradeBoundaries: data.gradeBoundaries,
      calculateGrade: data.calculateGrade,
      calculateGradeDynamic: data.calculateGradeDynamic,
      getLocalGrade: data.getLocalGrade,
      getCriteriaKeys: data.getCriteriaKeys,
      getCriteriaCount: data.getCriteriaCount,
      getScaledBoundaries: data.getScaledBoundaries,
      ALL_CRITERIA: data.ALL_CRITERIA,
      CRITERIA_GRADE_LEVELS: data.CRITERIA_GRADE_LEVELS,
      GRADE_LEVELS: data.GRADE_LEVELS,
      ACHIEVEMENT_LEVELS: data.ACHIEVEMENT_LEVELS,
      getGradeLevelKey: data.getGradeLevelKey,
      getSemesterLabel: data.getSemesterLabel,
      // Learner Profiles & Logo
      learnerProfiles, setLearnerProfiles: saveLearnerProfiles,
      ibProfileLogo, setIbProfileLogo: saveIbProfileLogo,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

const BASE = '/api';
let authToken = localStorage.getItem('authToken') || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) localStorage.setItem('authToken', token);
  else localStorage.removeItem('authToken');
}

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('authToken');
}

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const res = await fetch(`${BASE}${url}`, { ...options, headers });

  // Handle 401 — token expired or invalid
  if (res.status === 401 && url !== '/auth/login' && url !== '/auth/me') {
    clearAuthToken();
    window.location.href = '/login';
    throw new Error('Sesi berakhir, silakan login kembali.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const api = {
  // ─── Auth ──────────────────────────────────────────────────────────
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getMe: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

  // ─── Students ──────────────────────────────────────────────────────
  getStudents: (params) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request(`/students${qs ? '?' + qs : ''}`);
  },
  getStudent: (id) => request(`/students/${id}`),
  createStudent: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),
  bulkImportStudents: (students) => request('/students/bulk', { method: 'POST', body: JSON.stringify({ students }) }),

  // ─── Teachers ──────────────────────────────────────────────────────
  getTeachers: (params) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request(`/teachers${qs ? '?' + qs : ''}`);
  },
  getMyTeacher: () => request('/teachers/me'),
  getTeacher: (id) => request(`/teachers/${id}`),
  createTeacher: (data) => request('/teachers', { method: 'POST', body: JSON.stringify(data) }),
  updateTeacher: (id, data) => request(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeacher: (id) => request(`/teachers/${id}`, { method: 'DELETE' }),
  bulkImportTeachers: (teachers) => request('/teachers/bulk', { method: 'POST', body: JSON.stringify({ teachers }) }),

  // ─── Classes ───────────────────────────────────────────────────────
  getClasses: (params) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request(`/classes${qs ? '?' + qs : ''}`);
  },
  createClass: (data) => request('/classes', { method: 'POST', body: JSON.stringify(data) }),
  updateClass: (id, data) => request(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClass: (id) => request(`/classes/${id}`, { method: 'DELETE' }),

  // ─── Subjects ──────────────────────────────────────────────────────
  getSubjects: () => request('/subjects'),
  createSubject: (data) => request('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id, data) => request(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubject: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),

  // ─── Grades ────────────────────────────────────────────────────────
  getGrades: (params) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request(`/grades${qs ? '?' + qs : ''}`);
  },
  upsertGrade: (data) => request('/grades', { method: 'POST', body: JSON.stringify(data) }),
  updateGrade: (id, data) => request(`/grades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  batchUpsertGrades: (grades) => request('/grades/batch', { method: 'POST', body: JSON.stringify({ grades }) }),

  // ─── Attendance ────────────────────────────────────────────────────
  getAttendance: (params) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request(`/attendance${qs ? '?' + qs : ''}`);
  },
  upsertAttendance: (data) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  updateAttendance: (id, data) => request(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ─── Homeroom Comments ─────────────────────────────────────────────
  getHomeroomComments: (params) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request(`/homeroom-comments${qs ? '?' + qs : ''}`);
  },
  upsertHomeroomComment: (data) => request('/homeroom-comments', { method: 'POST', body: JSON.stringify(data) }),
  updateHomeroomComment: (id, data) => request(`/homeroom-comments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ─── Academic Years ────────────────────────────────────────────────
  getAcademicYears: () => request('/academic-years'),
  createAcademicYear: (data) => request('/academic-years', { method: 'POST', body: JSON.stringify(data) }),
  updateAcademicYear: (id, data) => request(`/academic-years/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setActiveAcademicYear: (id) => request(`/academic-years/${id}/set-active`, { method: 'PUT' }),
  deleteAcademicYear: (id) => request(`/academic-years/${id}`, { method: 'DELETE' }),

  // ─── School Profile ────────────────────────────────────────────────
  getSchoolProfile: () => request('/school-profile'),
  updateSchoolProfile: (data) => request('/school-profile', { method: 'PUT', body: JSON.stringify(data) }),

  // ─── Users ─────────────────────────────────────────────────────────
  getUsers: (params) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request(`/users${qs ? '?' + qs : ''}`);
  },
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id) => request(`/users/${id}/reset-password`, { method: 'PUT' }),
  changeUserPassword: (id, newPassword) =>
    request(`/users/${id}/change-password`, { method: 'PUT', body: JSON.stringify({ newPassword }) }),

  // ─── Alumni ────────────────────────────────────────────────────────
  getAlumni: (params) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request(`/alumni${qs ? '?' + qs : ''}`);
  },
  createAlumni: (data) => request('/alumni', { method: 'POST', body: JSON.stringify(data) }),
  bulkCreateAlumni: (alumni) => request('/alumni/bulk', { method: 'POST', body: JSON.stringify({ alumni }) }),

  // ─── Criteria Descriptors ──────────────────────────────────────────
  getCriteriaDescriptors: (subjectId) => request(`/criteria-descriptors/${subjectId}`),
  saveCriteriaDescriptors: (subjectId, data) =>
    request(`/criteria-descriptors/${subjectId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ─── Learner Profiles ──────────────────────────────────────────────
  getLearnerProfiles: () => request('/learner-profiles'),
  saveLearnerProfiles: (profiles) =>
    request('/learner-profiles', { method: 'PUT', body: JSON.stringify(profiles) }),

  // ─── Settings ──────────────────────────────────────────────────────
  getIbProfileLogo: () => request('/settings/ib-profile-logo'),
  saveIbProfileLogo: (logo) => request('/settings/ib-profile-logo', { method: 'PUT', body: JSON.stringify({ logo }) }),
  deleteIbProfileLogo: () => request('/settings/ib-profile-logo', { method: 'DELETE' }),

  // ─── Grade Boundaries ──────────────────────────────────────────────
  getGradeBoundaries: () => request('/grade-boundaries'),
  saveGradeBoundaries: (boundaries) =>
    request('/grade-boundaries', { method: 'PUT', body: JSON.stringify(boundaries) }),

  // ─── Grade Progress ────────────────────────────────────────────────
  getGradeProgress: (params) => {
    const qs = new URLSearchParams(params || {}).toString();
    return request(`/grade-progress${qs ? '?' + qs : ''}`);
  },

  // ─── Dashboard ─────────────────────────────────────────────────────
  getDashboardStats: () => request('/dashboard/stats'),

  // ─── Teaching Assignments ──────────────────────────────────────────
  getTeachingAssignments: (className) => {
    const qs = className ? `?className=${className}` : '';
    return request(`/teaching-assignments${qs}`);
  },
  assignTeacher: (data) =>
    request('/teaching-assignments', { method: 'POST', body: JSON.stringify(data) }),
  updateTeachingAssignment: (id, data) =>
    request(`/teaching-assignments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeachingAssignment: (id) =>
    request(`/teaching-assignments/${id}`, { method: 'DELETE' }),

  // ─── Backup & Restore ──────────────────────────────────────────────
  createBackup: () => request('/backup/create', { method: 'POST' }),
  getBackupList: () => request('/backup/list'),
  deleteBackup: (filename) => request(`/backup/${encodeURIComponent(filename)}`, { method: 'DELETE' }),
  downloadBackup: async (filename) => {
    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch(`${BASE}/backup/download/${encodeURIComponent(filename)}`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.blob();
  },
  restoreBackup: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch(`${BASE}/backup/restore`, { method: 'POST', headers, body: formData });
    if (res.status === 401) {
      clearAuthToken();
      window.location.href = '/login';
      throw new Error('Sesi berakhir, silakan login kembali.');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },
};

export default api;

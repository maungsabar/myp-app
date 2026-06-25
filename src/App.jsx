import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Students from './pages/Students';
import PromoteClass from './pages/PromoteClass';
import Alumni from './pages/Alumni';
import Teachers from './pages/Teachers';
import TeachingAssignments from './pages/TeachingAssignments';
import Classes from './pages/Classes';
import Subjects from './pages/Subjects';
import Descriptors from './pages/Descriptors';
import GradeBoundaries from './pages/GradeBoundaries';
import Grades from './pages/Grades';
import Attendance from './pages/Attendance';
import Report from './pages/Report';
import GradeProgress from './pages/GradeProgress';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import SchoolProfile from './pages/SchoolProfile';
import IBLearnerProfile from './pages/IBLearnerProfile';
import AcademicYear from './pages/AcademicYear';
import UserManagement from './pages/UserManagement';

// Smart dashboard: admin sees full Dashboard, coordinator sees CoordinatorDashboard
function SmartDashboard() {
  const { currentUser } = useApp();
  if (currentUser?.role === 'admin') return <Dashboard />;
  if (currentUser?.role === 'coordinator') return <CoordinatorDashboard />;
  if (currentUser?.role === 'student') return <StudentDashboard />;
  return <TeacherDashboard />;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/" element={<SmartDashboard />} />
            <Route path="/master/siswa" element={<ProtectedRoute allowedRoles={['/', '/master/siswa']}><Students /></ProtectedRoute>} />
            <Route path="/master/siswa/naik-kelas" element={<ProtectedRoute allowedRoles={['/', '/master/siswa']}><PromoteClass /></ProtectedRoute>} />
            <Route path="/master/siswa/alumni" element={<ProtectedRoute allowedRoles={['/', '/master/siswa']}><Alumni /></ProtectedRoute>} />
            <Route path="/master/guru" element={<ProtectedRoute allowedRoles={['/', '/master/guru']}><Teachers /></ProtectedRoute>} />
            <Route path="/master/guru/mengajar" element={<ProtectedRoute allowedRoles={['/', '/master/guru']}><TeachingAssignments /></ProtectedRoute>} />
            <Route path="/master/kelas" element={<ProtectedRoute allowedRoles={['/', '/master/kelas']}><Classes /></ProtectedRoute>} />
            <Route path="/master/mata-pelajaran" element={<ProtectedRoute allowedRoles={['/', '/master/mata-pelajaran']}><Subjects /></ProtectedRoute>} />
            <Route path="/master/deskriptor" element={<ProtectedRoute allowedRoles={['/', '/master/deskriptor']}><Descriptors /></ProtectedRoute>} />
            <Route path="/master/grade-boundaries" element={<ProtectedRoute allowedRoles={['/', '/master/grade-boundaries']}><GradeBoundaries /></ProtectedRoute>} />
            <Route path="/akademik/nilai" element={<ProtectedRoute allowedRoles={['/', '/akademik/nilai']}><Grades /></ProtectedRoute>} />
            <Route path="/akademik/kehadiran" element={<ProtectedRoute allowedRoles={['/', '/akademik/kehadiran']}><Attendance /></ProtectedRoute>} />
            <Route path="/laporan/progres-nilai" element={<ProtectedRoute allowedRoles={['/', '/laporan/progres-nilai']}><GradeProgress /></ProtectedRoute>} />
            <Route path="/laporan/rapor" element={<ProtectedRoute allowedRoles={['/', '/laporan/rapor']}><Report /></ProtectedRoute>} />
            <Route path="/pengaturan/profil-sekolah" element={<ProtectedRoute allowedRoles={['/', '/pengaturan/profil-sekolah']}><SchoolProfile /></ProtectedRoute>} />
            <Route path="/pengaturan/profil-pembelajar-ib" element={<ProtectedRoute allowedRoles={['/', '/pengaturan/profil-pembelajar-ib']}><IBLearnerProfile /></ProtectedRoute>} />
            <Route path="/pengaturan/tahun-pelajaran" element={<ProtectedRoute allowedRoles={['/', '/pengaturan/tahun-pelajaran']}><AcademicYear /></ProtectedRoute>} />
            <Route path="/pengaturan/kelola-user" element={<ProtectedRoute allowedRoles={['/', '/pengaturan/kelola-user']}><UserManagement /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;

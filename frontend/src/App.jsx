import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider } from './context/AuthContext'; // 1. นำเข้า AuthProvider
import ProtectedRoute from './components/ProtectedRoute';
import Users from './pages/Users';
import CreateProject from './pages/CreateProject';
import Projects from './pages/Projects';
import MyProjects from './pages/MyProjects';
import ProjectDetail from './pages/ProjectDetail';


function App() {
  return (
    <AuthProvider> {/* 2. หุ้มด้วย AuthProvider */}
      <ProjectProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/users" element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            } />

            <Route path="/CreateProject" element={
              <ProtectedRoute>
                <CreateProject />
              </ProtectedRoute>
            } />

            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />

            <Route path="/myprojects" element={
              <ProtectedRoute>
                <MyProjects />
              </ProtectedRoute>
            } />

            <Route path="/projects/:id" element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            } />

          </Routes>
        </BrowserRouter>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
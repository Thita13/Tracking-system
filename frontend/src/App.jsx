import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { ProjectProvider } from './context/ProjectContext'; // ต้องตรวจสอบว่าไฟล์นี้มีอยู่จริง

function App() {
  return (
    // ProjectProvider จะเป็นตัวกลางดึงข้อมูลจาก API มาเก็บไว้ใน State ให้หน้าต่างๆ เรียกใช้
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* เพิ่ม Route อื่นๆ ได้ที่นี่ */}
        </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}
export default App;
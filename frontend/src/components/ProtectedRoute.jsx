import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user } = useAuth(); // ดึงสถานะ user จาก AuthContext

  // ถ้าไม่มี user ให้ดีดกลับไปหน้า login ทันที
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ถ้ามี user ให้ปล่อยผ่านเข้าหน้า Dashboard
  return children;
}

export default ProtectedRoute;
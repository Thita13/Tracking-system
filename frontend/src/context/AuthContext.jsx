import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 🔴 1. เปลี่ยนจาก localStorage เป็น sessionStorage ตรงนี้
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
        try {
            setUser(JSON.parse(savedUser));
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    // 🔴 2. เปลี่ยนจาก localStorage เป็น sessionStorage ตรงนี้ด้วย
    sessionStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
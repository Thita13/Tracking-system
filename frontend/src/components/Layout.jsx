import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Notification from './Notification'; // นำเข้าคอมโพเนนต์ Notification ที่แยกไว้

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMenus, setCurrentMenus] = useState([]);

  // Config เมนูตามสิทธิ์การใช้งาน
  const menuConfig = {
    admin: [
      { name: 'แดชบอร์ด', path: '/dashboard' },
      { name: 'ผู้ใช้งาน', path: '/users' },
      { name: 'สร้างงานใหม่', path: '/CreateProject' },
      { name: 'โครงการทั้งหมด', path: '/projects' },
    ],
    project_director: [
      { name: 'แดชบอร์ด', path: '/dashboard' },
      { name: 'สร้างงานใหม่', path: '/CreateProject' },
      { name: 'โครงการทั้งหมด', path: '/projects' },
    ],
    interior: [
      { name: 'แดชบอร์ด', path: '/dashboard' },
      { name: 'โครงการทั้งหมด', path: '/projects' },
      { name: 'งานของฉัน', path: '/myprojects' },
    ],
    pricing: [
      { name: 'แดชบอร์ด', path: '/dashboard' },
      { name: 'โครงการทั้งหมด', path: '/projects' },
      { name: 'งานของฉัน', path: '/myprojects' },
    ],
  };

  // อัปเดตเมนูเมื่อ user หรือ role เปลี่ยน
  useEffect(() => {
    const normalizedRole = user?.role?.toLowerCase().replace(' ', '_') || 'admin';
    setCurrentMenus(menuConfig[normalizedRole] || menuConfig['admin']);
  }, [user]);

  // ปิด Dropdown โปรไฟล์เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchQuery.trim() !== '') {
        navigate('/projects', { state: { searchKeyword: searchQuery } });
        setSearchQuery('');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F5F5F5] font-sans">
      <Toaster />

      {/* Header */}
      <header className="h-20 bg-[#188BFE] flex items-center justify-between px-6 z-20 shrink-0 shadow-md">
        <div className="w-56 text-white font-black text-3xl tracking-widest">LOGO</div>

        <div className="flex-1 max-w-md ml-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="ค้นหา"
              className="w-full px-5 py-2.5 rounded-full bg-white border border-gray-300 outline-none transition-all shadow-inner"
            />
            <Search onClick={handleSearch} className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>
        </div>

        <div className="flex items-center space-x-6 text-white pr-4">
          
          {/* เรียกใช้คอมโพเนนต์ Notification ที่แยกไฟล์ไว้ */}
          <Notification 
          userId={user?.id || user?.id_users} 
          role={user?.role}
          />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/20 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 text-[#188BFE] flex items-center justify-center font-bold shadow-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="text-[10px] uppercase opacity-80">{user?.role?.replace('_', ' ') || '...'}</p>
                <p className="font-semibold">{user?.username || 'กำลังโหลด...'}</p>
              </div>
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-gray-800">
                <div className="flex items-center space-x-3 px-5 py-4 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-[#188BFE] flex items-center justify-center font-bold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-base font-bold text-gray-900 truncate">{user?.username}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="py-2">
                  <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center px-5 py-2.5 text-sm font-semibold hover:bg-blue-50 hover:text-[#188BFE]">โปรไฟล์ของฉัน</Link>
                  <Link to="/change-password" onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center px-5 py-2.5 text-sm font-semibold hover:bg-blue-50 hover:text-[#188BFE]">เปลี่ยนรหัสผ่าน</Link>
                  <button onClick={() => { setIsDropdownOpen(false); logout(); }} className="w-full flex items-center px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50">ออกจากระบบ</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-[#FCFBF4] shadow-[4px_0_10px_rgba(0,0,0,0.05)] flex flex-col z-10">
          <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
            {currentMenus.map((item) => {
              const isActive = location.pathname.toLowerCase() === item.path.toLowerCase();
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                      ? 'bg-[#188BFE] text-white shadow-md scale-[1.02] text-base font-bold'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
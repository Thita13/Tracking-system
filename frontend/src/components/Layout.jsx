import { useState , useEffect, useRef } from 'react'; // 1. นำเข้า useState
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const dropdownRef = useRef(null);

  const [hasNewTask, setHasNewTask] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 2. ปิด Dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const role = user?.role || 'admin';
  const userName = user?.username || 'กำลังโหลด...';
  const userEmail = user?.email || '...';

  const menuConfig = {
    admin: [
      { name: 'แดชบอร์ด', path: '/dashboard' },
      { name: 'ผู้ใช้งาน', path: '/users' },
      { name: 'สร้างงานใหม่', path: '/CreateProject' },
      { name: 'โครงการ', path: '/projects' },
    ],
    project_director: [
      { name: 'แดชบอร์ด', path: '/dashboard' },
      { name: 'สร้างงานใหม่', path: '/CreateProject' },
      { name: 'โครงการ', path: '/projects' },
    ],
    interior: [
      { name: 'แดชบอร์ด', path: '/dashboard' },
      { name: 'โครงการ', path: '/projects' },
      { name: 'Design', path: '/design' },
      { name: '3D', path: '/3d' },
    ],
    pricing: [
      { name: 'แดชบอร์ด', path: '/dashboard' },
      { name: 'โครงการ', path: '/projects' },
      { name: 'ประเมินราคา', path: '/pricing' },
    ],
  };

  const currentMenus = menuConfig[role] || menuConfig['admin'];

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchQuery.trim() !== '') {
        // พาไปหน้า projects พร้อมกับแนบคำค้นหาไปในชื่อ searchKeyword
        navigate('/projects', { state: { searchKeyword: searchQuery } });
        setSearchQuery(''); // ล้างช่องค้นหาหลังจากกดส่ง
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F5F5F5] font-sans">


      {/* กล่องแจ้งเตือน บันทึกสำเร็จ */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          // ตั้งค่าสไตล์พื้นฐานให้เข้ากับเว็บ
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }}
      />

      <header className="h-20 bg-[#188BFE] flex items-center justify-between px-6 z-20 shrink-0 shadow-md">

        <div className="w-56 flex items-center pl-2 text-white font-black text-3xl tracking-widest">
          LOGO
        </div>

        {/* กล่องค้นหา */}
        <div className="flex-1 max-w-md ml-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch} // ดักจับการกดปุ่มบนคีย์บอร์ด
              placeholder="ค้นหา"
              className="w-full px-5 py-2.5 rounded-full bg-white border border-gray-300 text-black placeholder:text-gray-500 focus:ring-2 focus:ring-white outline-none transition-all shadow-inner"
            />
            <Search
              onClick={handleSearch}
              className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
            />
          </div>
        </div>

        {/* ปุ่มกระดิ่ง */}
        <div className="flex items-center space-x-6 text-white pr-4">
          <button className="relative p-2" onClick={() => setHasNewTask(false)}>
            🔔 {hasNewTask && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
          </button>


          {/* ปุ่มผู้ใช้งาน (กดเพื่อเปิด/ปิด Dropdown) */}
          <div className="relative" ref={dropdownRef} >
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-white/20 transition-all"
>
              <div className="w-9 h-9 rounded-full bg-blue-100 text-[#188BFE] flex items-center justify-center font-bold shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm">
                <p className="text-[10px] uppercase">{role.replace('_', ' ')}</p>
                <p className="font-semibold">{userName}</p>
              </div>
            </div>

            {/* กล่อง Dropdown ที่จะเด้งลงมา */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-gray-800">

                {/* ส่วนหัว Dropdown: แสดงชื่อและอีเมลจากฐานข้อมูล */}
                <div className="flex items-center space-x-3 px-5 py-4 border-b border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-[#188BFE] flex items-center justify-center font-bold shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
                  <div className="overflow-hidden">
                    <p className="text-base font-bold text-gray-900 truncate">{user?.username}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>

                {/* รายการเมนู */}
                <div className="py-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)} // ปิดเมนูเมื่อคลิก
                    className="w-full flex items-center px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#188BFE] transition-colors"
                  >
                    โปรไฟล์ของฉัน
                  </Link>

                  <Link
                    to="/change-password"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#188BFE] transition-colors"
                  >
                    เปลี่ยนรหัสผ่าน
                  </Link>

                  {/* ปุ่มออกจากระบบ: สำคัญที่สุดต้องเรียกฟังก์ชัน logout จาก context */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout(); // ฟังก์ชันนี้จะลบ Token/User ออกจากระบบ
                    }}
                    className="w-full flex items-center px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

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
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}

export default Layout;
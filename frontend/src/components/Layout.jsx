import { useState } from 'react'; // 1. นำเข้า useState
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Toaster } from 'react-hot-toast';


function Layout({ children, role = 'admin', userName, userEmail = 'jaemin@gmail.com' }) {
  const location = useLocation();
  const navigate = useNavigate();

  // สร้างตัวแปรจำลองว่า "มีงานใหม่เข้าหรือไม่" (เริ่มต้นให้เป็น true เพื่อโชว์จุดแดงก่อน)
  const [hasNewTask, setHasNewTask] = useState(true);

  // สร้างตัวแปรสำหรับเปิด/ปิด Dropdown Menu (เริ่มต้นให้ปิด)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

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
            {/* ทำให้ไอคอนคลิกได้ด้วย */}
            <Search
              onClick={handleSearch}
              className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center space-x-6 text-white pr-4">

          {/* 3. แก้ไขปุ่มกระดิ่งตรงนี้ */}
          <button
            className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
            // เมื่อกดปุ่มกระดิ่ง จะสั่งให้ hasNewTask กลายเป็น false (จุดแดงจะหายไป)
            onClick={() => setHasNewTask(false)}
          >
            🔔
            {/* 4. ใส่เงื่อนไข: ถ้า hasNewTask เป็นจริง (&&) ถึงจะแสดงจุดแดง */}
            {hasNewTask && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#3B82F6]"></span>
            )}
          </button>

          <div className="relative">
            {/* ปุ่มผู้ใช้งาน (กดเพื่อเปิด/ปิด Dropdown) */}
            <div
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full border border-white/20 cursor-pointer hover:bg-white/20 transition-colors select-none"
            >
              <div className="w-9 h-9 rounded-full bg-white text-[#188BFE] flex items-center justify-center font-bold shadow-sm text-lg">
                {role.charAt(0).toUpperCase()}
              </div>
              <div className="text-sm font-semibold">
                <p className="text-[13px] text-blue-100 uppercase tracking-tighter">{role.replace('_', ' ')}</p>
                <p className="leading-tight">{userName}</p>
              </div>
              {/* ลูกศรชี้ลง (หมุนขึ้นเมื่อเมนูเปิด) */}
              <span className={`text-[10px] opacity-70 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
            </div>

            {/* กล่อง Dropdown ที่จะเด้งลงมา */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-gray-800">

                {/* ส่วนหัว Dropdown */}
                <div className="flex items-center space-x-3 px-5 py-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-base font-bold text-gray-900 truncate">{userName}</p>
                    <p className="text-[11px] text-gray-500 truncate">{userEmail}</p>
                  </div>
                </div>

                {/* รายการเมนู */}
                <div className="py-2">
                  <Link
                    to="/profile"
                    className="w-full flex items-center px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#188BFE] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    โปรไฟล์ของฉัน
                  </Link>

                  <Link
                    to="/change-password"
                    onClick={() => setIsDropdownOpen(false)} // เพื่อให้เมนูหุบลงเมื่อคลิก
                    className="w-full flex items-center px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#188BFE] transition-colors border-b border-gray-100 pb-3 mb-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    เปลี่ยนรหัสผ่าน
                  </Link>

                  <button className="w-full flex items-center px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
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
                  className={`flex items-center  px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                      ? 'bg-[#188BFE] text-white shadow-md scale-[1.02] text-base font-bold'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
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
import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProjectTable from '../components/ProjectTable';
import { useProject } from '../context/ProjectContext';

function Projects() {
  const { projects, isLoading, error } = useProject();
  const location = useLocation();
  const navigate = useNavigate(); // 🔴 เพิ่ม useNavigate สำหรับใช้เคลียร์คำค้นหา
  
  // สถานะสำหรับการกรองข้อมูล (Dropdown)
  const [filterType, setFilterType] = useState('ประเภทโครงการ');
  const [filterStatus, setFilterStatus] = useState(location.state?.filterStatus || 'โครงการทั้งหมด');

  // 🔴 1. เพิ่ม State สำหรับเก็บคำค้นหา
  const [searchTerm, setSearchTerm] = useState('');

  // 🔴 2. ใช้ useEffect เพื่อดึงค่าคำค้นหาที่ส่งมาจาก Header (Layout.jsx)
  useEffect(() => {
    // เช็คว่ามีการพิมพ์ค้นหาแล้วกด Enter ส่งมาหรือไม่
    if (location.state?.searchKeyword !== undefined) {
      setSearchTerm(location.state.searchKeyword);
    }
  }, [location.state]);

  // กรองข้อมูลตามสถานะที่เลือก และ คำค้นหา
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    let filtered = projects;

    // 1. กรองตามประเภท (บ้าน/คอนโด)
    if (filterType === 'home' || filterType === 'condo') {
      filtered = filtered.filter(p => p.type === filterType);
    }

    // 2. กรองตามสถานะ 
    if (filterStatus === 'โครงการที่กำลังดำเนินการ') {
      filtered = filtered.filter(p => ['NEW', 'INTERIOR', 'WAITING_CONFIRM', 'PRICING', 'DESIGN_3D'].includes(p.status));
    } else if (filterStatus === 'โครงการที่ดำเนินการสำเร็จ') {
      filtered = filtered.filter(p => p.status === 'COMPLETED');
    } else if (filterStatus === 'โครงการที่ไม่ได้ดำเนินการต่อ') {
      filtered = filtered.filter(p => p.status === 'CANCELLED');
    }

    // 🔴 3. กรองตามคำค้นหา (ชื่อโครงการ หรือ ชื่อลูกค้า หรือ ID)
    if (searchTerm.trim() !== '') {
      const keyword = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name && p.name.toLowerCase().includes(keyword)) ||
        (p.customer && p.customer.toLowerCase().includes(keyword)) ||
        (String(p.id).includes(keyword))
      );
    }

    return filtered; 
  }, [projects, filterStatus, filterType, searchTerm]); // 🔴 อย่าลืมเพิ่ม searchTerm ลงใน array นี้

  // 🔴 4. ฟังก์ชันสำหรับล้างคำค้นหา
  const handleClearSearch = () => {
    setSearchTerm('');
    // ล้างค่าใน location.state เพื่อไม่ให้คำค้นหาค้างตอนรีเฟรชหน้า
    navigate('/projects', { replace: true, state: {} });
  };

  return (
    <Layout>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        {/* ส่วนหัวของหน้าและ Dropdown กรองข้อมูล */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800">โครงการทั้งหมด</h2>
            {/* 🔴 5. แสดงข้อความแจ้งเตือนว่ากำลังค้นหาคำว่าอะไรอยู่ (เพื่อให้ User ไม่งง) */}
            {searchTerm && (
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                ผลการค้นหา: <span className="font-bold text-[#188BFE]">"{searchTerm}"</span>
                <button 
                  onClick={handleClearSearch}
                  className="text-red-500 hover:text-red-700 hover:underline text-xs font-semibold px-2"
                >
                  (ล้างการค้นหา)
                </button>
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <select
              className="border border-gray-200 rounded-xl px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option>ประเภทโครงการ</option>
              <option value="home">บ้าน</option>
              <option value="condo">คอนโด</option>
            </select>

            <select
              className="border border-gray-200 rounded-xl px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option>โครงการทั้งหมด</option>
              <option>โครงการที่กำลังดำเนินการ</option>
              <option>โครงการที่ดำเนินการสำเร็จ</option>
              <option>โครงการที่ไม่ได้ดำเนินการต่อ</option>
            </select>
          </div>
        </div>

        {/* ตารางแสดงผล */}
        <ProjectTable
          projects={filteredProjects}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </Layout>
  );
}

export default Projects;
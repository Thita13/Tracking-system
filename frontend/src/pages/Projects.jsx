import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import ProjectTable from '../components/ProjectTable';
import { useProject } from '../context/ProjectContext';

function Projects() {
  const { projects, isLoading, error } = useProject();
  const location = useLocation();
  
  // สถานะสำหรับการกรองข้อมูล (Dropdown)
  const [filterType, setFilterType] = useState('ประเภทโครงการ');
  const [filterStatus, setFilterStatus] = useState(location.state?.filterStatus || 'โครงการทั้งหมด');

  // กรองข้อมูลตามสถานะที่เลือก
 const filteredProjects = useMemo(() => {
    if (!projects) return [];

    let filtered = projects;

    // 1. กรองตามประเภท (บ้าน/คอนโด)
    if (filterType === 'home' || filterType === 'condo') {
      filtered = filtered.filter(p => p.type === filterType);
    }

    // 2. กรองตามสถานะ (ทำต่อจาก filtered ที่กรอง type มาแล้ว)
    if (filterStatus === 'โครงการที่กำลังดำเนินการ') {
      filtered = filtered.filter(p => ['NEW', 'INTERIOR', 'WAITING_CONFIRM', 'PRICING', 'DESIGN_3D'].includes(p.status));
    } else if (filterStatus === 'โครงการที่ดำเนินการสำเร็จ') {
      filtered = filtered.filter(p => p.status === 'COMPLETED');
    } else if (filterStatus === 'โครงการที่ไม่ได้ดำเนินการต่อ') {
      filtered = filtered.filter(p => p.status === 'CANCELLED');
    }

    return filtered; // ส่งผลลัพธ์ที่ผ่านการกรองทั้ง 2 ขั้นตอนออกไป
  }, [projects, filterStatus, filterType]);


  return (
    <Layout>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        {/* ส่วนหัวของหน้าและ Dropdown กรองข้อมูล */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">โครงการทั้งหมด</h2>
          
          <div className="flex gap-4">
            <select 
              className="border border-gray-200 rounded-xl px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-400"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option>ประเภทโครงการ</option>
              <option value="home">บ้าน</option>
              <option value="condo">คอนโด</option>
            </select>

            <select 
              className="border border-gray-200 rounded-xl px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-400"
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
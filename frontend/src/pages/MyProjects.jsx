import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // 🔴 1. นำเข้า useLocation และ useNavigate
import Layout from '../components/Layout';
import ProjectTable from '../components/ProjectTable';
import { useAuth } from '../context/AuthContext';

function MyProjects() {
  const { user } = useAuth();
  const location = useLocation(); // 🔴 เรียกใช้
  const navigate = useNavigate(); // 🔴 เรียกใช้
  
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState('active');
  const [searchTerm, setSearchTerm] = useState(''); // 🔴 2. State สำหรับเก็บคำค้นหา

  // 🔴 3. ดึงคำค้นหาที่ถูกส่งมาจาก Header
  useEffect(() => {
    if (location.state?.searchKeyword !== undefined) {
      setSearchTerm(location.state.searchKeyword);
    }
  }, [location.state]);

  // ฟังก์ชันดึงข้อมูลงานทั้งหมดของฉัน
  const fetchMyTasks = async () => {
    if (!user || !user.id) return;
    setIsLoading(true);
    try {
      const endpoint = `http://localhost:5000/tasks/my-tasks/${user.id}`;
      const response = await fetch(endpoint);
      const data = await response.json();

      const tasksArray = Array.isArray(data) ? data : [];

      const formatted = tasksArray.map(item => ({
        id: item.id_task,
        name: item.task_name || 'ไม่มีชื่อ',
        customer: item.customer_name || '-',
        createdDate: item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : '-',
        type: item.task_type || '-',
        status: item.status || 'NEW',
        assignedTo: { department: item.department || '-' }
      }));

      setTasks(formatted);
    } catch (err) {
      console.error("Error fetching my tasks:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyTasks();
    }
  }, [user]);

  // 🔴 4. กรองข้อมูลงานตาม สถานะ + คำค้นหา
  const filteredTasks = tasks.filter(item => {
    // กรองสถานะ
    let statusMatch = true;
    if (filterStatus === 'active') {
      statusMatch = item.status !== 'COMPLETED';
    } else if (filterStatus === 'completed') {
      statusMatch = item.status === 'COMPLETED';
    }

    // กรองคำค้นหา
    let searchMatch = true;
    if (searchTerm.trim() !== '') {
      const keyword = searchTerm.toLowerCase();
      searchMatch = 
        (item.name && item.name.toLowerCase().includes(keyword)) ||
        (item.customer && item.customer.toLowerCase().includes(keyword)) ||
        (String(item.id).includes(keyword));
    }

    return statusMatch && searchMatch;
  });

  // 🔴 5. ฟังก์ชันสำหรับล้างการค้นหา
  const handleClearSearch = () => {
    setSearchTerm('');
    navigate('/myprojects', { replace: true, state: {} });
  };

  return (
    <Layout>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">

        {/* หัวข้อและ Dropdown เลือกสถานะ */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              งานของฉัน
            </h2>
            {/* 🔴 6. แสดงข้อความผลการค้นหา และปุ่มล้างคำค้นหา */}
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

          {/* Dropdown สลับมุมมอง */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-400 bg-white text-sm cursor-pointer"
            >
              <option value="active">งานที่กำลังดำเนินการ</option>
              <option value="completed">งานที่ดำเนินการสำเร็จ</option>
              <option value="all">งานของฉันทั้งหมด</option>
            </select>
          </div>
        </div>

        <ProjectTable
          projects={filteredTasks}
          isLoading={isLoading}
          systemRole={user?.role}
        />
      </div>
    </Layout>
  );
}

export default MyProjects;
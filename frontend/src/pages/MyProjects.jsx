import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProjectTable from '../components/ProjectTable';
import { useAuth } from '../context/AuthContext';

function MyProjects() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔴 เปลี่ยนเป็น State สำหรับ Dropdown เลือกสถานะงาน ('active' = กำลังดำเนินการ, 'completed' = เสร็จสิ้นแล้ว, 'all' = ทั้งหมด)
  const [filterStatus, setFilterStatus] = useState('active');

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

  // 🔴 กรองข้อมูลงานตามค่าที่เลือกใน Dropdown
  const filteredTasks = tasks.filter(item => {
    if (filterStatus === 'active') {
      return item.status !== 'COMPLETED'; // งานที่กำลังดำเนินการ
    } else if (filterStatus === 'completed') {
      return item.status === 'COMPLETED'; // งานที่เสร็จสิ้นแล้ว
    } else {
      return true; // แสดงทั้งหมด
    }
  });

  return (
    <Layout>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">

        {/* หัวข้อและ Dropdown เลือกสถานะ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold text-gray-800">
            งานของฉัน
          </h2>

          {/* 🔴 Dropdown สลับมุมมองให้เหมือนกับหน้าโครงการทั้งหมด */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-400 bg-white text-sm cursor-pointer"
            >
              <option value="active">งานที่กำลังดำเนินการ</option>
              <option value="completed">งานที่ดำเนินการสำเร็จ</option>
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
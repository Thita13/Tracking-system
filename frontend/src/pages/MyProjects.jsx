import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProjectTable from '../components/ProjectTable';
import { useAuth } from '../context/AuthContext';

function MyProjects() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ฟังก์ชันดึงข้อมูลงานเฉพาะที่ได้รับมอบหมาย
  const fetchMyTasks = async () => {
    if (!user || !user.id) return;
    setIsLoading(true);
    try {
      // ดึงงานเฉพาะของ Interior คนนี้เท่านั้น (ผ่าน Endpoint ที่เราทำไว้)
      const endpoint = `http://localhost:5000/tasks/my-tasks/${user.id}`;
      console.log("Fetching from URL:", endpoint);
      const response = await fetch(endpoint);
      const data = await response.json();

      // ตรวจสอบว่าได้ Array ข้อมูลมาหรือไม่
      const tasksArray = Array.isArray(data) ? data : [];

      const formatted = tasksArray.map(item => ({
        id: item.id_task,
        name: item.task_name || 'ไม่มีชื่อ',
        customer: item.customer_name || '-',
        createdDate: item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : '-',
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

  // ตัดฟังก์ชัน handleClaimTask และ renderActionButtons ออกไป 
  // เพราะหน้างานของฉันไม่ต้องมีการกดรับงานเพิ่ม

  return (
    <Layout>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          งานของฉัน
        </h2>
        {/* ส่งเพียงแค่ props ที่จำเป็น หน้าตาจะเหมือนหน้า Dashboard */}
        <ProjectTable
          projects={tasks}
          isLoading={isLoading}
          systemRole={user?.role}
        />
      </div>
    </Layout>
  );
}

export default MyProjects;
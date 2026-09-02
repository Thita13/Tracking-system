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
      const endpoint = `http://localhost:5000/tasks/my-tasks/${user.id}`;
      const response = await fetch(endpoint);
      const data = await response.json();

      const tasksArray = Array.isArray(data) ? data : [];

      // 🔴 กรองเฉพาะงานที่สถานะ "ไม่ใช่ COMPLETED" (ซ่อนงานที่เสร็จแล้วออกไป)
      const activeTasks = tasksArray.filter(item => item.status !== 'COMPLETED');

      const formatted = activeTasks.map(item => ({
        id: item.id_task,
        name: item.task_name || 'ไม่มีชื่อ',
        customer: item.customer_name || '-',
        createdDate: item.created_at ? new Date(item.created_at).toLocaleDateString('th-TH') : '-',
        type: item.task_type || '-', // เพิ่มฟิลด์ประเภทโครงการให้ตรงกับ Table
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

  return (
    <Layout>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          งานของฉัน
        </h2>
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
import { useMemo } from 'react';
import Layout from '../components/Layout';
import ProjectTable from '../components/ProjectTable';
import { useProject } from '../context/ProjectContext';
import { Link } from 'react-router-dom';

function Dashboard() {
  const { projects, isLoading, error } = useProject();
  
  const stats = useMemo(() => {
    if (!projects) return { total: 0, inProgress: 0, completed: 0, cancelled: 0 };

    const total = projects.length;
    const completed = projects.filter(p => p.status === 'COMPLETED').length;

    const inProgress = projects.filter(p => 
      ['NEW', 'INTERIOR', 'WAITING_CONFIRM', 'PRICING', 'DESIGN_3D'].includes(p.status)
    ).length;

    const cancelled = 0;

    return { total, inProgress, completed, cancelled };
  }, [projects]);

  const statCards = [
    {
      id: 1,
      title: 'โครงการทั้งหมด',
      count: stats.total,
      bgColor: 'bg-white', // สีขาว
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      filterValue: 'โครงการทั้งหมด'
    },
    {
      id: 2,
      title: 'โครงการที่กำลังดำเนินการ',
      count: stats.inProgress,
      bgColor: 'bg-[#6EE7B7]', // สีเขียวมิ้นท์ (แกะสีจาก Mockup)
      borderColor: 'border-[#34D399]',
      textColor: 'text-gray-900',
      filterValue: 'โครงการที่กำลังดำเนินการ'
    },
    {
      id: 3,
      title: 'โครงการที่ดำเนินการสำเร็จ',
      count: stats.completed,
      bgColor: 'bg-[#A5B4FC]', // สีฟ้าอมม่วง (แกะสีจาก Mockup)
      borderColor: 'border-[#818CF8]',
      textColor: 'text-gray-900',
      filterValue: 'โครงการที่ดำเนินการสำเร็จ'
    },
    {
      id: 4,
      title: 'โครงการที่ไม่ได้ดำเนินการต่อ',
      count: stats.cancelled,
      bgColor: 'bg-[#FDA4AF]', // สีแดง/ชมพู (แกะสีจาก Mockup)
      borderColor: 'border-[#FB7185]',
      textColor: 'text-gray-900',
      filterValue: 'โครงการที่ไม่ได้ดำเนินการต่อ'
    },
  ];

  return (
    <Layout>

      {/* --- ส่วนการ์ดสถิติ 4 ใบ --- */}
      {/* ใช้ CSS Grid แบ่งหน้าจอเป็น 4 คอลัมน์ (ถ้าจอมือถือจะเหลือ 1 คอลัมน์อัตโนมัติ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* ใช้คำสั่ง .map() เพื่อวนลูปสร้างการ์ดทีละใบจากข้อมูล statCards ด้านบน */}
        {statCards.map((card) => (
          <Link
            to="/projects"
            state={{ filterStatus: card.filterValue }} 
            key={card.id}
            className={`flex flex-col rounded-3xl border shadow-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer block ${card.bgColor} ${card.borderColor} ${card.textColor}`}
          >
            <h3 className="text-base font-extrabold opacity-80 mb-2">{card.title}</h3>
            <div className="text-4xl font-bold mb-6">{card.count}</div>
            <div className="mt-auto border-t border-black/10 pt-4 flex items-center justify-between text-base font-medium hover:opacity-70 transition-opacity">
              <span>ดูทั้งหมด</span>
              <span className="text-lg leading-none">→</span>
            </div>
          </Link>
        ))}
        
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">โครงการทั้งหมด</h2>
        <ProjectTable 
          projects={projects} 
          isLoading={isLoading} 
          error={error} 
        />
      </div>

    </Layout>
  );
}

export default Dashboard;
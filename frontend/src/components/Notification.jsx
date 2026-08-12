import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Clock } from 'lucide-react';

export default function Notification({ userId, role }) {
  const [taskNotis, setTaskNotis] = useState([]);
  const [readTasks, setReadTasks] = useState([]); 
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  const storageKey = `read_tasks_with_time_${userId}`;

  // ดึงข้อมูลแจ้งเตือนงานเฉพาะของ user คนนี้
  useEffect(() => {
    if (!userId || !role) return;

    // โหลดประวัติการอ่านที่บันทึกเวลาไว้จาก localStorage ทันที
    const savedReadTasks = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const now = new Date();

    // กรองเอาเฉพาะรายการที่กดอ่านไปแล้วแต่ยังไม่เกิน 10 วัน (นับจากเวลาที่กดอ่าน)
    const validReadTasks = savedReadTasks.filter(item => {
      const readTime = new Date(item.readAt);
      const diffTime = Math.abs(now - readTime);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 10; // เกิน 10 วันนับจากวันที่อ่าน จะหายไปจากประวัติ
    });

    setReadTasks(validReadTasks);
    localStorage.setItem(storageKey, JSON.stringify(validReadTasks));

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`http://localhost:5000/tasks/notifications/${userId}/${role}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setTaskNotis(data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); 
    return () => clearInterval(interval);
  }, [userId, role]);

  // ปิดกล่อง Dropdown เมื่อคลิกพื้นที่ด้านนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const past = new Date(dateString);
    const diffTime = Math.abs(now - past);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if(diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if(diffHours === 0) {
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            return diffMinutes <= 1 ? 'เมื่อสักครู่' : `${diffMinutes} นาทีที่แล้ว`;
        }
        return `${diffHours} ชั่วโมงที่แล้ว`;
    }
    return `${diffDays} วันที่แล้ว`;
  };

  // คำนวณจำนวนงานที่ยังไม่ได้อ่าน
  const unreadCount = taskNotis.filter(task => {
    return !readTasks.some(item => item.id_task === task.id_task && item.created_at === task.created_at);
  }).length;

  return (
    <div className="relative" ref={notificationRef}>
      <button 
        className="relative p-2.5 rounded-full border-2 border-white/80 text-white flex items-center justify-center shadow-sm focus:outline-none hover:bg-white/20 transition-all" 
        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
      >
        <Bell className="w-5 h-5 text-white fill-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md">
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* กล่องแสดงรายการแจ้งเตือน */}
      {isNotificationOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-gray-800 animate-in fade-in slide-in-from-top-2 duration-200">

          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-base text-gray-900">การแจ้งเตือน</h4>
              <span className="text-xs bg-blue-100 text-[#188BFE] px-2 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {taskNotis.length > 0 ? (
              taskNotis.map((task) => {
                // แก้ไขให้เช็คเทียบทั้ง id_task และ created_at พร้อมกัน
                const isRead = readTasks.some(item => item.id_task === task.id_task && item.created_at === task.created_at);
                const isNew = !task.status || task.status === 'NEW';

                return (
                  <div 
                    key={`${task.id_task}-${task.created_at}`}
                    onClick={() => {
                      // บันทึกเวลาที่กดอ่าน พร้อมแนบ created_at ป้องกัน ID ซ้ำ
                      if (!isRead) {
                        const newReadItem = { 
                          id_task: task.id_task, 
                          created_at: task.created_at,
                          readAt: new Date().toISOString() 
                        };
                        
                        const updatedReadTasks = [...readTasks, newReadItem];
                        setReadTasks(updatedReadTasks);
                        localStorage.setItem(storageKey, JSON.stringify(updatedReadTasks));
                      }

                      setIsNotificationOpen(false);
                      navigate(`/projects/${task.id_task}`);
                    }}
                    className={`p-4 cursor-pointer transition-all flex items-start space-x-3 text-left ${
                      isRead ? 'bg-white opacity-60 hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50/80'
                    }`}
                  >
                    {/* รายละเอียดตรงกลาง */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate transition-colors ${isRead ? 'font-normal text-gray-600' : 'font-bold text-gray-900'}`}>
                        {task.task_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {task.task_type || 'ไม่มีประเภทงาน'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] text-gray-400 font-medium">
                          {formatTimeAgo(task.created_at)}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                          isRead ? 'bg-gray-100 text-gray-500' : (isNew ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700')
                        }`}>
                          {isRead ? 'อ่านแล้ว' : (isNew ? 'งานใหม่' : task.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-gray-400">
                <CheckCircle2 className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-semibold">ไม่มีการแจ้งเตือนในขณะนี้</p>
              </div>
            )}
          </div>

          {/* ส่วนท้ายกล่อง */}
          <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400 font-medium">ระบบติดตามสถานะโครงการ</span>
          </div>

        </div>
      )}
    </div>
  );
}
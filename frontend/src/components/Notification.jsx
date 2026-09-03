import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, CheckCheck } from 'lucide-react';

export default function Notification({ userId, role }) {
  const [taskNotis, setTaskNotis] = useState([]);
  const [readTasks, setReadTasks] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [timeTick, setTimeTick] = useState(0); 
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  const storageKey = `read_tasks_with_time_${userId}`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(prev => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!userId || !role) return;

    const savedReadTasks = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const now = new Date();

    const validReadTasks = savedReadTasks.filter(item => {
      const readTime = new Date(item.readAt);
      const diffTime = Math.abs(now - readTime);
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });

    setReadTasks(validReadTasks);
    localStorage.setItem(storageKey, JSON.stringify(validReadTasks));

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`http://localhost:5000/tasks/notifications/${userId}/${role}`);
        const data = await res.json();
        if (Array.isArray(data)) setTaskNotis(data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [userId, role]);

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
    
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'เมื่อสักครู่';
    if (diffMinutes < 60) return `${diffMinutes} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    return `${diffDays} วันที่แล้ว`;
  };

  const unreadCount = taskNotis.filter(task => {
    return !readTasks.some(item => item.id_task === task.id_task && item.created_at === task.created_at);
  }).length;

  const markAllAsRead = () => {
    const now = new Date().toISOString();
    const newReadTasks = [...readTasks];
    let hasChanges = false;

    taskNotis.forEach(task => {
      const isRead = newReadTasks.some(item => item.id_task === task.id_task && item.created_at === task.created_at);
      if (!isRead) {
        newReadTasks.push({ id_task: task.id_task, created_at: task.created_at, readAt: now });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setReadTasks(newReadTasks);
      localStorage.setItem(storageKey, JSON.stringify(newReadTasks));
    }
  };

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

      {isNotificationOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden text-gray-800 animate-in fade-in slide-in-from-top-2 duration-200">

          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-base text-gray-900">การแจ้งเตือน</h4>
              <span className="text-xs bg-blue-100 text-[#188BFE] px-2 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-1 text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>อ่านทั้งหมด</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {taskNotis.length > 0 ? (
              taskNotis.map((task) => {
                const isRead = readTasks.some(item => item.id_task === task.id_task && item.created_at === task.created_at);

                const isComment = task.tracking_status === 'NEW_COMMENT';
                const isNew = ['CREATE_TASK', 'SEND_TO_INTERIOR', 'SEND_TO_PRICING', 'SEND_TO_3D'].includes(task.tracking_status);
                
                // 🔴 ตัวแปร 2 ตัวนี้คือจุดที่แก้ปัญหา Error ของคุณครับ
                const isReview = ['SEND_TO_PROJECTDIRECTOR', 'SUBMIT_WORK', 'SUBMIT_3D_WORK'].includes(task.tracking_status);
                const isRevision = task.tracking_status === 'REQUEST_REVISION';

                const formatStatusText = (status) => {
                  const statusMap = {
                    'REQUEST_REVISION': 'งานแก้ไข',
                    'SUBMIT_WORK': 'ส่งงาน',
                    'SUBMIT_3D_WORK': 'ส่งงาน 3D',
                    'SEND_TO_PROJECTDIRECTOR': 'รอตรวจสอบ',
                    'COMPLETE': 'จบโครงการ',
                    'NEW_COMMENT': 'คอมเมนต์ใหม่',
                    'CREATE_TASK': 'สร้างโปรเจกต์ใหม่',
                    'SEND_TO_INTERIOR': 'คุณได้รับมอบหมายงาน',
                    'SEND_TO_PRICING': 'คุณได้รับมอบหมายงาน',
                    'SEND_TO_3D': 'คุณได้รับมอบหมายงาน'
                  };
                  return statusMap[status] || status;
                };

                let tagClass = 'bg-blue-100 text-blue-700'; 
                if (isRead) {
                    tagClass = 'bg-gray-100 text-gray-500';
                } else if (isComment) {
                    tagClass = 'bg-purple-100 text-purple-700 border border-purple-200'; 
                } else if (isNew) {
                    tagClass = 'bg-red-100 text-red-600'; 
                }

                return (
                  <div
                    key={`${task.id_task}-${task.created_at}`}
                    onClick={() => {
                      if (!isRead) {
                        const newReadItem = { id_task: task.id_task, created_at: task.created_at, readAt: new Date().toISOString() };
                        const updatedReadTasks = [...readTasks, newReadItem];
                        setReadTasks(updatedReadTasks);
                        localStorage.setItem(storageKey, JSON.stringify(updatedReadTasks));
                      }
                      setIsNotificationOpen(false);
                      navigate(`/projects/${task.id_task}${isComment ? '#comments' : ''}`);
                    }}
                    className={`p-4 cursor-pointer transition-all flex items-start space-x-3 text-left ${
                        isRead ? 'bg-white opacity-60 hover:bg-gray-50' : (isComment ? 'bg-purple-50/40 hover:bg-purple-50/70' : 'bg-blue-50/40 hover:bg-blue-50/80')
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate transition-colors ${isRead ? 'font-normal text-gray-600' : 'font-bold text-gray-900'}`}>
                        {task.task_name}
                      </p>
                      
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        {isComment ? (
                            <span className={`flex items-center min-w-0 ${isRead ? 'text-gray-400' : 'text-purple-600'}`}>
                                <span className="truncate">
                                    <span className="font-semibold">{task.action_by}</span> 
                                    {task.action_by_role && (
                                        <span className="font-normal ml-1">
                                            ({task.action_by_role})
                                        </span>
                                    )}
                                    <span className="font-normal mr-1"> :</span>
                                    <span className="font-normal">{task.detail}</span>
                                </span>
                            </span>
                        ) : (
                            <span className={`flex items-center min-w-0 ${isRead ? 'text-gray-400' : 'text-blue-600 font-medium'}`}>
                                <span className="truncate">
                                    {formatStatusText(task.tracking_status)}
                                    {task.action_by && (
                                        <span>
                                            {` จาก ${task.action_by}`}
                                            {task.action_by_role && ` (${task.action_by_role})`}
                                        </span>
                                    )}
                                </span>
                            </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[11px] text-gray-400 font-medium">
                          {formatTimeAgo(task.created_at)}
                        </span>
                        
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${tagClass}`}>
                          {isRead 
                              ? (isComment ? 'คอมเมนต์' : (isReview ? 'รอตรวจสอบ' : (isRevision ? 'งานแก้ไข' : 'งาน'))) 
                              : (isNew ? 'งานใหม่' : formatStatusText(task.tracking_status || task.status))}
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

          <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-center">
            <span className="text-[11px] text-gray-400 font-medium">ระบบติดตามสถานะโครงการ</span>
          </div>

        </div>
      )}
    </div>
  );
}
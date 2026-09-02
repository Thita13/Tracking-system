import { useState, useEffect, useRef } from 'react';

export default function CommentSection({ taskId, user, project, tracking }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [showInfo, setShowInfo] = useState(false);
    const commentsEndRef = useRef(null);

    // ===============================================================
    // โลจิกเช็คสิทธิ์การคอมเมนต์
    // ===============================================================
    let canComment = false;
    const isAdminOrPD = user?.role === 'Admin' || user?.role === 'Project Director';

    // 🔴 ถ้าโครงการเสร็จสิ้นแล้ว (COMPLETED) จะไม่มีใครคอมเมนต์ได้เลย
    if (project?.status === 'COMPLETED') {
        canComment = false;
    } else if (isAdminOrPD) {
        canComment = true; 
    } else if (project && String(project.assign_to) === String(user?.id)) {
        if (project.status === 'WAITING_CONFIRM') {
            canComment = false;
        } else {
            let enterStatuses = ['CREATE_TASK'];
            let startStatus = '';
            const status = project.status;

            if (status === 'INTERIOR') {
                enterStatuses = ['SEND_TO_INTERIOR', 'REQUEST_REVISION'];
                startStatus = 'START_INTERIOR';
            } else if (status === 'PRICING') {
                enterStatuses = ['SEND_TO_PRICING', 'REQUEST_REVISION'];
                startStatus = 'START_PRICING';
            } else if (status === 'DESIGN_3D') {
                enterStatuses = ['SEND_TO_3D', 'REQUEST_REVISION'];
                startStatus = 'START_3D';
            }

            const lastEnterLog = tracking.filter(t => enterStatuses.includes(t.status)).pop();
            const lastStartLog = tracking.filter(t => t.status === startStatus).pop();

            const enterTimeMs = lastEnterLog ? new Date(lastEnterLog.action_at).getTime() : 0;
            const startTimeMs = lastStartLog ? new Date(lastStartLog.action_at).getTime() : 0;

            canComment = (startTimeMs >= enterTimeMs) && (startTimeMs > 0);
        }
    }

    const fetchComments = async () => {
        try {
            const res = await fetch(`http://localhost:5000/tasks/${taskId}/comments`);
            if (!res.ok) throw new Error('Failed to fetch comments');
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching comments:", err);
        }
    };

    useEffect(() => {
        if (taskId) fetchComments();
    }, [taskId]);

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    const handleCommentSubmit = async () => {
        if (!newComment.trim() || !canComment) return;

        try {
            const now = new Date();
            const tzOffset = now.getTimezoneOffset() * 60000; 
            const localTime = new Date(now.getTime() - tzOffset); 
            const mysqlTimestamp = localTime.toISOString().slice(0, 19).replace('T', ' ');

            const response = await fetch(`http://localhost:5000/tasks/${taskId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    comment: newComment,
                    created_at: mysqlTimestamp,
                    id_users: user.id,
                    id_task: taskId
                })
            });

            if (response.ok) {
                setNewComment('');
                fetchComments(); 
            } else {
                alert('เกิดข้อผิดพลาดในการส่งคอมเมนต์');
            }
        } catch (err) {
            console.error("Submit comment error:", err);
            alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        }
    };

    const getReasonMessage = () => {
        // 🔴 เพิ่มข้อความชี้แจงกรณีจบโครงการแล้ว
        if (project?.status === 'COMPLETED') {
            return 'โครงการนี้จบการทำงานแล้ว ไม่สามารถแสดงความคิดเห็นเพิ่มเติมได้';
        }
        if (project?.status === 'WAITING_CONFIRM') {
            return 'ขณะนี้งานอยู่ในสถานะรอตรวจสอบ คุณจะสามารถคอมเมนต์ได้อีกครั้ง เมื่อถึงขั้นตอนการดำเนินงานของคุณ';
        }
        return 'คุณต้องกดปุ่ม "รับงานนี้" ก่อน จึงจะสามารถเปิดใช้งานช่องพิมพ์คอมเมนต์ได้';
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative">
            <h3 className="font-bold text-gray-800 mb-4">คอมเมนต์เพิ่มเติม</h3>
            
            <div className="max-h-[300px] overflow-y-auto mb-4 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                {comments.length > 0 ? (
                    comments.map(c => (
                        <div key={c.id_comment} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-blue-600">
                                    {c.commented_by} 
                                    {c.commented_by_role && <span className="text-gray-400 font-normal lowercase ml-1">({c.commented_by_role})</span>}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(c.created_at).toLocaleString('th-TH', { 
                                        year: 'numeric', month: 'short', day: 'numeric', 
                                        hour: '2-digit', minute: '2-digit' 
                                    })} น.
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{c.comment}</p>
                        </div>
                    ))
                ) : (
                    <div className="min-h-[100px] border rounded-2xl flex items-center justify-center bg-gray-50 text-sm text-gray-400">
                        ยังไม่มีคอมเมนต์...
                    </div>
                )}
                <div ref={commentsEndRef} />
            </div>

            {canComment ? (
                <div className="flex gap-2 mt-2">
                    <input 
                        className="flex-1 border rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                        placeholder="พิมพ์ข้อความที่นี่..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommentSubmit();
                        }}
                    />
                    <button 
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim()}
                        className={`px-6 rounded-full text-sm font-bold text-white transition-colors flex-shrink-0 ${
                            newComment.trim() ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-300 cursor-not-allowed'
                        }`}
                    >
                        ส่ง
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-full px-5 py-2.5 mt-2 relative">
                    <span className="text-sm font-semibold text-gray-400 tracking-wide select-none">
                        View only
                    </span>
                    
                    <div className="relative">
                        <button
                            type="button"
                            onMouseEnter={() => setShowInfo(true)}
                            onMouseLeave={() => setShowInfo(false)}
                            onClick={() => setShowInfo(!showInfo)}
                            className="w-6 h-6 rounded-full bg-gray-300 hover:bg-gray-400 text-white font-bold text-xs flex items-center justify-center transition-colors focus:outline-none"
                            title="คลิกหรือวางเมาส์เพื่อดูเหตุผล"
                        >
                            i
                        </button>

                        {showInfo && (
                            <div className="absolute right-0 bottom-8 z-10 w-72 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-lg leading-relaxed">
                                {getReasonMessage()}
                                <div className="absolute -bottom-1 right-3 w-2.5 h-2.5 bg-gray-900 transform rotate-45"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getStatusColor } from '../utils/helpers';
import ProjectActionBox from '../components/ProjectActionBox';
import FileManager from '../components/FileManager'; // 🔴 นำเข้า Component กลาง

function ProjectDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [tracking, setTracking] = useState([]);
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const steps = [
        { key: 'CREATE_TASK', label: 'สร้างโครงการ', dept: 'Project Director' },
        { key: 'SEND_TO_INTERIOR', label: 'ออกแบบ', dept: 'Interior' },
        { key: 'SEND_TO_PRICING', label: 'ประเมินราคา', dept: 'Pricing' },
        { key: 'SEND_TO_3D', label: '3D', dept: 'Interior' }
    ];

    const mapStatus = (status) => {
        const mapping = {
            'NEW': 'CREATE_TASK',
            'INTERIOR': 'SEND_TO_INTERIOR',
            'WAITING_CONFIRM': 'SEND_TO_INTERIOR',
            'PRICING': 'SEND_TO_PRICING',
            'DESIGN_3D': 'SEND_TO_3D'
        };
        return mapping[status] || status;
    };

    const handleAction = async (actionType, extraData = null) => {
        try {
            const dept = extraData?.department || '';
            const memberId = extraData?.memberId || null;

            const response = await fetch(`http://localhost:5000/tasks/${id}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: actionType,
                    dept: dept,
                    memberId: memberId,
                    userId: user.id,
                    role: user.role
                })
            });

            if (response.ok) {
                window.location.reload();
            } else {
                const errData = await response.json();
                alert(`เกิดข้อผิดพลาด: ${errData.error || 'ไม่สามารถทำรายการได้'}`);
            }
        } catch (err) {
            console.error("Action error:", err);
            alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                const resP = await fetch(`http://localhost:5000/tasks/${id}`);
                const data = await resP.json();
                setProject(data);

                const resT = await fetch(`http://localhost:5000/tasks/${id}/tracking`);
                const trackData = await resT.json();
                setTracking(Array.isArray(trackData) ? trackData : []);

                const resF = await fetch(`http://localhost:5000/tasks/${id}/files`);
                const fileData = await resF.json();
                setFiles(Array.isArray(fileData) ? fileData : []);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [id]);

   // ===============================================================
    // โลจิกควบคุมสิทธิ์การจัดการไฟล์ (อัปโหลด / ลบ / แบ่งหมวดหมู่)
    // ===============================================================
    const currentStatus = project?.status;
    const isAdminOrPD = user?.role === 'Admin' || user?.role === 'Project Director';
    const isAssignedToMe = project && String(project.assign_to) === String(user?.id);

    // 1. ระบุ Status ที่เกี่ยวกับการ "เข้าสเตจ" และ "กดรับงาน" ของแผนกปัจจุบัน
    let stageEnterStatuses = [];
    let stageStartStatus = '';

    if (currentStatus === 'INTERIOR' || currentStatus === 'WAITING_CONFIRM') {
        stageEnterStatuses = ['SEND_TO_INTERIOR', 'REQUEST_REVISION']; // รวมสถานะตอนตีกลับ
        stageStartStatus = 'START_INTERIOR';
    } else if (currentStatus === 'PRICING') {
        stageEnterStatuses = ['SEND_TO_PRICING', 'REQUEST_REVISION'];
        stageStartStatus = 'START_PRICING';
    } else if (currentStatus === 'DESIGN_3D') {
        stageEnterStatuses = ['SEND_TO_3D', 'REQUEST_REVISION'];
        stageStartStatus = 'START_3D';
    } else {
        stageEnterStatuses = ['CREATE_TASK'];
    }

    // 2. เช็คว่าพนักงาน "กดรับงาน" แล้วหรือยัง **ในรอบปัจจุบันเท่านั้น**
    const lastEnterLog = tracking.filter(t => stageEnterStatuses.includes(t.status)).pop();
    const lastEnterTime = lastEnterLog ? new Date(lastEnterLog.action_at).getTime() : 0;

    const lastStartLog = tracking.filter(t => t.status === stageStartStatus).pop();
    const lastStartTime = lastStartLog ? new Date(lastStartLog.action_at).getTime() : 0;

    // รับงานแล้ว = เวลากดรับงาน(Start) ล่าสุด เกิดขึ้นหลังจากหรือพร้อมกับเวลาที่ถูกส่งงานมาล่าสุด
    let hasStartedCurrentStage = (lastStartTime >= lastEnterTime) && (lastStartTime > 0);

    // 3. สิทธิ์การเปิดใช้งานปุ่ม Add file 
    const canUploadFiles = !isAdminOrPD && isAssignedToMe && ['INTERIOR', 'PRICING', 'DESIGN_3D'].includes(currentStatus) && hasStartedCurrentStage && currentStatus !== 'WAITING_CONFIRM';

    // 4. สิทธิ์การเปิด/ปิดปุ่มกากบาทลบไฟล์ (isProjectActive)
    const canDeleteFiles = isAdminOrPD 
        ? false 
        : (isAssignedToMe && hasStartedCurrentStage && !['NEW', 'WAITING_CONFIRM', 'COMPLETED'].includes(currentStatus));

    // 5. หาเวลา "ครั้งแรกสุด" ที่เข้าสเตจนี้ (เพื่อดึงไฟล์รอบแรกรวมกับรอบแก้ มาให้ Interior จัดการเมื่อรับงาน)
    let firstTimeInThisStage = 0;
    const firstEnterLog = tracking.find(t => stageEnterStatuses.includes(t.status));
    if (firstEnterLog) {
        firstTimeInThisStage = new Date(firstEnterLog.action_at).getTime();
    }

    // 6. จัดรูปแบบไฟล์และกรองการมองเห็น
    const formattedFiles = files.map(file => {
        const fileTime = new Date(file.created_at).getTime();
        const isMyUploadedFile = file.id_users && String(file.id_users) === String(user?.id);

        const belongsToCurrentStage = fileTime >= firstTimeInThisStage;

        // 🔴 หัวใจสำคัญ: ถ้า Interior "ยังไม่กดรับงาน" ของรอบนี้ ไฟล์ของตัวเองจากรอบที่แล้ว จะกลายเป็นไฟล์อ้างอิงทันที
        const isPrevious = !(isMyUploadedFile && belongsToCurrentStage && hasStartedCurrentStage && !isAdminOrPD);

        return { ...file, isPrevious };
    }).filter(file => {
        // ซ่อนไฟล์ Real-time ไม่ให้ PD เห็นจนกว่าพนักงานจะกดส่งงาน (WAITING_CONFIRM)
        if (isAdminOrPD) {
            const isMyFile = file.id_users && String(file.id_users) === String(user?.id);
            if (!isMyFile && currentStatus !== 'WAITING_CONFIRM' && currentStatus !== 'COMPLETED') {
                const fileTime = new Date(file.created_at).getTime();
                // ถ้าเป็นไฟล์ที่พนักงานอัปโหลดหลังจากการเข้าสเตจรอบล่าสุด (คือไฟล์ที่กำลังทำอยู่)
                if (fileTime >= lastEnterTime) {
                    return false; 
                }
            }
        }
        return true;
    });

    // 6. ฟังก์ชันลบไฟล์
    const handleDeleteFile = async (fileId) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้?')) return;
        try {
            const response = await fetch(`http://localhost:5000/tasks/${id}/files/${fileId}`, { method: 'DELETE' });
            if (response.ok) {
                setFiles(prevFiles => prevFiles.filter(f => f.id_files !== fileId));
            } else {
                alert('เกิดข้อผิดพลาดในการลบไฟล์');
            }
        } catch (err) {
            console.error("Delete file error:", err);
            alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        }
    };

    if (isLoading) return <Layout><div className="text-center py-20">กำลังโหลดข้อมูล...</div></Layout>;
    if (!project) return <Layout><div className="text-center py-20 text-red-500">ไม่พบข้อมูลโครงการ</div></Layout>;

    return (
        <Layout>
            <div className="mb-6">
                <div className="mb-2">
                    <button onClick={() => navigate(-1)} className="text-blue-500 font-semibold flex items-center">← ย้อนกลับ</button>
                </div>
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">#{project.id_task} {project.task_name}</h1>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(project.status)}`}>
                        {project.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Timeline */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-8">Timeline</h3>
                        <div className="flex items-center justify-between relative px-4">
                            <div className="absolute top-5 left-15 right-8 h-1 bg-gray-100 -z-0"></div>

                            {steps.map((step, idx) => {
                                const stepHistory = tracking.filter(t => {
                                    if (step.key === 'SEND_TO_INTERIOR') {
                                        return (['START_INTERIOR', 'SUBMIT_WORK'].includes(t.status) || 
                                               (t.status === 'SEND_TO_PROJECTDIRECTOR' && t.department === 'Interior'));
                                    }
                                    if (step.key === 'SEND_TO_PRICING') {
                                        return t.status === 'START_PRICING' || 
                                               (t.status === 'SEND_TO_PROJECTDIRECTOR' && t.department === 'Pricing');
                                    }
                                    if (step.key === 'SEND_TO_3D') {
                                       return t.status === 'START_3D' || t.status === 'COMPLETE';
                                    }
                                    return t.status === step.key || mapStatus(t.status) === step.key;
                                });

                                let isCompleted = false;
                                const has3DStarted = tracking.some(t => t.status === 'START_3D');

                                if (step.key === 'CREATE_TASK') {
                                    isCompleted = true;
                                }
                                else if (step.key === 'SEND_TO_INTERIOR') {
                                    isCompleted = ['PRICING', 'PRICING_DONE', 'DESIGN_3D', 'COMPLETED'].includes(project.status) ||
                                        (project.status === 'WAITING_CONFIRM' && tracking.some(t => t.department === 'Interior' && t.status === 'SEND_TO_PROJECTDIRECTOR'));
                                }
                                else if (step.key === 'SEND_TO_PRICING') {
                                    isCompleted = ['DESIGN_3D', 'COMPLETED'].includes(project.status) ||
                                        (project.status === 'WAITING_CONFIRM' && tracking.some(t => t.department === 'Pricing' && t.status === 'SEND_TO_PROJECTDIRECTOR'));
                                }
                                else if (step.key === 'SEND_TO_3D') {
                                   isCompleted = project.status === 'COMPLETED' || 
                                        (project.status === 'WAITING_CONFIRM' && has3DStarted);
                                }

                                let isCurrent = false;
                                if (!isCompleted) {
                                    if (step.key === 'CREATE_TASK') {
                                        isCurrent = false;
                                    }
                                    else if (step.key === 'SEND_TO_INTERIOR') {
                                        const isInteriorStarted = tracking.some(t => t.status === 'START_INTERIOR');
                                        isCurrent = project.status === 'INTERIOR' && isInteriorStarted;
                                    }
                                    else if (step.key === 'SEND_TO_PRICING') {
                                        const isPricingStarted = tracking.some(t => t.status === 'START_PRICING') || Boolean(project.assign_to);
                                        isCurrent = project.status === 'PRICING' && isPricingStarted;
                                    }
                                    else if (step.key === 'SEND_TO_3D') {
                                        const is3DStarted = tracking.some(t => t.status === 'START_3D');
                                        isCurrent = project.status === 'DESIGN_3D' && is3DStarted;
                                    }
                                }

                                return (
                                    <div key={idx} className="z-10 flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 border-2 
                                            ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                              isCurrent ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            {isCompleted ? '✓' : idx + 1}
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-700">{step.label}</span>
                                        <span className="text-[12px] text-gray-500 mb-2">{step.dept}</span>
                                        <div className="text-[11px] text-gray-400 text-center">
                                            {stepHistory.map((h, hIdx) => (
                                                <div key={hIdx}>
                                                    {new Date(h.action_at).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    {' '}{new Date(h.action_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ข้อมูลโครงการ */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6 ">
                            <h3 className="font-bold text-gray-800">ข้อมูล</h3>
                            {(user?.role === 'Admin' || user?.role === 'Project Director') && (
                                <button className="text-red-500 font-bold text-sm hover:underline">แก้ไข</button>
                            )}
                        </div>
                        <div className="flex flex-col gap-y-3 text-sm mb-6">
                            <div className="flex"><span className="text-gray-500 w-[120px]">รหัสโครงการ :</span> <span className="font-semibold">{project.id_task}</span></div>
                            <div className="flex"><span className="text-gray-500 w-[120px]">ชื่อโครงการ :</span> <span className="font-semibold">{project.task_name}</span></div>
                            <div className="flex"><span className="text-gray-500 w-[120px]">ประเภท :</span> <span className="font-semibold">{project.task_type}</span></div>
                            <div className="flex"><span className="text-gray-500 w-[120px]">ชื่อลูกค้า :</span> <span className="font-semibold">{project.customer_name}</span></div>
                            <div className="flex"><span className="text-gray-500 w-[120px]">เบอร์โทรลูกค้า :</span> <span className="font-semibold">{project.customer_phone}</span></div>
                        </div>
                        <div className="mt-4">
                            <h4 className="font-bold text-gray-800 mb-2">รายละเอียดงาน</h4>
                            <div className="w-full p-4 bg-gray-50 rounded-xl text-sm text-gray-700 min-h-[120px] whitespace-pre-line border border-gray-100">{project.description || "ไม่มีรายละเอียด"}</div>
                        </div>

                       {/* 🔴 ปิดสิทธิ์ไม่ให้ Project Director / Admin ลบไฟล์ในช่วงที่งานอยู่กับฝ่ายอื่น */}
                        <FileManager
                            files={formattedFiles}
                            canUpload={canUploadFiles}
                            isProjectActive={canDeleteFiles} 
                            onUpload={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const uploadData = new FormData();
                                uploadData.append('file', file);
                                uploadData.append('taskId', id);
                                uploadData.append('userId', user.id);
                                try {
                                    const response = await fetch(`http://localhost:5000/tasks/${id}/files`, { method: 'POST', body: uploadData });
                                    if (response.ok) { window.location.reload(); }
                                } catch (err) { console.error("Upload failed:", err); }
                            }}
                            onDelete={handleDeleteFile}
                        />
                    </div>

                    {/* คอมเมนต์ */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">คอมเมนต์เพิ่มเติม</h3>
                        <div className="min-h-[100px] border rounded-2xl p-4 mb-4 bg-gray-50 text-sm text-gray-400">ยังไม่มีคอมเมนต์...</div>
                        <div className="flex gap-2">
                            <input className="flex-1 border rounded-full px-4 py-2 text-sm" placeholder="ส่งข้อความ..." />
                            <button className="bg-blue-400 text-white px-6 rounded-full text-sm">ส่ง</button>
                        </div>
                    </div>
                </div>

                {/* ฝั่งขวา */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <ProjectActionBox
                            user={user}
                            project={project}
                            tracking={tracking}
                            handleAction={handleAction}
                        />
                    </div>

                    {/* สร้างโดย */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-sm space-y-3">
                        <p className="flex justify-between">
                            <span className="text-gray-500">สร้างโดย :</span>
                            <span className="font-semibold">{project.created_by}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-500">แผนก :</span>
                            <span className="font-semibold">{project.created_by_role}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-500">วันที่สร้าง :</span>
                            <span className="font-semibold">{project.created_at ? new Date(project.created_at).toLocaleDateString() : '-'}</span>
                        </p>
                    </div>

                    {/* ผู้รับผิดชอบ */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-sm space-y-3">
                        <p className="flex justify-between">
                            <span className="text-gray-500">ผู้รับผิดชอบ :</span>
                            <span className="font-semibold">{project.assigned_to_name || '-'}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-500">แผนก :</span>
                            <span className="font-semibold">{project.assigned_to_role || '-'}</span>
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default ProjectDetail;
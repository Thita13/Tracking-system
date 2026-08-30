import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getStatusColor } from '../utils/helpers';
import ProjectActionBox from '../components/ProjectActionBox';

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
    // โลจิกการจัดการไฟล์ (ตอบโจทย์กฎเหล็ก: รับงานแก้แล้ว ลบไฟล์รอบเก่าได้)
    // ===============================================================
    const currentStatus = project?.status;
    const isAdminOrPD = user?.role === 'Admin' || user?.role === 'Project Director';
    const isAssignedToMe = project && String(project.assign_to) === String(user?.id);

    // 1. เช็คว่าพนักงาน "กดรับงาน" แล้วหรือยังในรอบปัจจุบัน
    let hasStartedCurrentStage = false;
    if (currentStatus === 'INTERIOR' || currentStatus === 'WAITING_CONFIRM') {
        hasStartedCurrentStage = tracking.some(t => t.status === 'START_INTERIOR');
    } else if (currentStatus === 'PRICING') {
        hasStartedCurrentStage = tracking.some(t => t.status === 'START_PRICING');
    } else if (currentStatus === 'DESIGN_3D') {
        hasStartedCurrentStage = tracking.some(t => t.status === 'START_3D');
    }

    // 2. สิทธิ์การเปิดใช้งานปุ่ม Add file (ห้ามอัปโหลดเพิ่มตอนส่งงานรอตรวจ WAITING_CONFIRM)
    const isPDCanUpload = isAdminOrPD && ['NEW', 'WAITING_CONFIRM'].includes(currentStatus);
    const isStaffCanUpload = isAssignedToMe && ['INTERIOR', 'PRICING', 'DESIGN_3D'].includes(currentStatus) && hasStartedCurrentStage && currentStatus !== 'WAITING_CONFIRM';
    const canUploadFiles = project && project.status !== 'COMPLETED' && (isPDCanUpload || isStaffCanUpload);

    // 3. สถานะ Active ของโครงการ (ใช้เปิด/ปิดปุ่มกากบาทลบไฟล์: ห้ามลบตอน WAITING_CONFIRM หรือ COMPLETED)
    const isProjectActive = project && project.status !== 'WAITING_CONFIRM' && project.status !== 'COMPLETED';

    // 4. จุดเปลี่ยนสำคัญ: หาเวลาเริ่มต้น "ตั้งแต่ก้าวแรกที่เข้าสู่สเตจนี้" (ไม่เปลี่ยนตามรอบการแก้)
    // เพื่อให้เวลาที่ Interior กดรับงานแก้ ไฟล์ที่เคยส่งไว้ในสเตจนี้ตั้งแต่รอบแรก ถูกนับรวมว่าเป็นไฟล์ปัจจุบัน
    let firstTimeInThisStage = 0;
    let enterActionStatus = ['CREATE_TASK'];
    
    if (currentStatus === 'INTERIOR' || currentStatus === 'WAITING_CONFIRM') {
        enterActionStatus = ['SEND_TO_INTERIOR'];
    } else if (currentStatus === 'PRICING') {
        enterActionStatus = ['SEND_TO_PRICING'];
    } else if (currentStatus === 'DESIGN_3D') {
        enterActionStatus = ['SEND_TO_3D'];
    }

    const stagingActions = tracking.filter(t => enterActionStatus.includes(t.status));
    if (stagingActions.length > 0) {
        // เอาเวลาตอนเริ่มเข้าสเตจนี้ครั้งแรกสุด
        firstTimeInThisStage = new Date(stagingActions[0].action_at).getTime();
    }

    // 5. แบ่งก้อนไฟล์ (ต้องกดรับงานแล้วเท่านั้น ถึงจะเอาไฟล์มาไว้ที่ "ไฟล์งานของฉัน" และลบได้)
    const previousFiles = [];
    const myFiles = [];

    if (Array.isArray(files)) {
        files.forEach(file => {
            const fileTime = new Date(file.created_at).getTime();
            const belongsToCurrentStage = fileTime >= firstTimeInThisStage;
            const isMyUploadedFile = file.id_users && String(file.id_users) === String(user?.id);

            // 🔴 เพิ่มเงื่อนไข hasStartedCurrentStage เข้าไปตรงนี้ เพื่อบังคับว่าต้องกดรับงานแล้วเท่านั้น
            if (isMyUploadedFile && belongsToCurrentStage && (hasStartedCurrentStage || isAdminOrPD)) {
                myFiles.push(file); // ลบได้เฉพาะตอนรับงานแล้ว (หรือเป็น Admin/PD)
            } else {
                previousFiles.push(file); // ถ้ายังไม่กดรับงาน ไฟล์ทั้งหมดจะไปกองที่ไฟล์อ้างอิง (ลบไม่ได้)
            }
        });
    }

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
                                const currentMappedStatus = mapStatus(project.status);
                                const statusOrder = ['CREATE_TASK', 'SEND_TO_INTERIOR', 'SEND_TO_PRICING', 'SEND_TO_3D'];

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

                        {/* 🔴 ส่วนไฟล์งาน */}
                        <div className="mt-8">
                            <h4 className="font-bold text-gray-800 mb-4">ไฟล์งานในโครงการ</h4>

                            {/* ก้อนที่ 1: ไฟล์อ้างอิงจากขั้นตอนก่อนหน้า */}
                            {previousFiles.length > 0 && (
                                <div className="mb-6">
                                    <h5 className="font-semibold text-gray-500 text-[13px] mb-3 flex items-center">
                                        <span className="mr-2">📁</span> ไฟล์อ้างอิงจากขั้นตอนก่อนหน้า
                                    </h5>
                                    <div className="flex flex-col gap-2">
                                        {previousFiles.map(file => {
                                            const ext = file.file_name.split('.').pop().toUpperCase();
                                            const isPDF = ext === 'PDF';
                                            const isImage = ['JPG', 'JPEG', 'PNG'].includes(ext);

                                            return (
                                                <div key={file.id_files} className="flex items-center justify-between w-full max-w-md px-4 py-2 bg-gray-50 border border-gray-200 rounded-md shadow-sm opacity-80">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`flex items-center justify-center w-8 h-8 rounded text-[10px] font-bold flex-shrink-0 
                                                            ${isPDF ? 'bg-red-100 text-red-600' : isImage ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {ext.substring(0, 4)}
                                                        </div>
                                                        <a href={`http://localhost:5000/uploads/${file.file_path.split(/[\\/]/).pop()}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-600 hover:underline truncate">
                                                            {file.file_name}
                                                        </a>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {previousFiles.length > 0 && <hr className="border-gray-100 mb-6" />}

                            {/* ก้อนที่ 2: ไฟล์งานของฉัน */}
                            <div>
                                <h5 className="font-semibold text-gray-700 text-[13px] mb-3 flex items-center">
                                    <span className="mr-2">📂</span> ไฟล์งานของฉัน
                                </h5>
                                <div className="flex flex-col gap-2">
                                    {myFiles.length > 0 ? myFiles.map(file => {
                                        const ext = file.file_name.split('.').pop().toUpperCase();
                                        const isPDF = ext === 'PDF';
                                        const isImage = ['JPG', 'JPEG', 'PNG'].includes(ext);

                                        return (
                                            <div key={file.id_files} className="flex items-center justify-between w-full max-w-md px-4 py-2.5 bg-white border border-gray-300 rounded-md shadow-sm transition-colors hover:bg-blue-50">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className={`flex items-center justify-center w-8 h-8 rounded text-[10px] font-bold flex-shrink-0 
                                                        ${isPDF ? 'bg-red-100 text-red-600' : isImage ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {ext.substring(0, 4)}
                                                    </div>
                                                    <a href={`http://localhost:5000/uploads/${file.file_path.split(/[\\/]/).pop()}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-800 hover:underline hover:text-blue-600 truncate">
                                                        {file.file_name}
                                                    </a>
                                                </div>

                                                {isProjectActive && (
                                                    <button
                                                        onClick={() => handleDeleteFile(file.id_files)}
                                                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors ml-2 flex-shrink-0"
                                                        title="ลบไฟล์"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    }) : (
                                        <span className="text-gray-400 text-sm italic px-2">ยังไม่มีไฟล์ของคุณในโครงการนี้</span>
                                    )}
                                </div>

                                {canUploadFiles && (
                                    <div className="pt-3">
                                        <label className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors shadow-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            Add file
                                            <input type="file" className="hidden" onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                formData.append('taskId', id);
                                                formData.append('userId', user.id);
                                                try {
                                                    const response = await fetch(`http://localhost:5000/tasks/${id}/files`, { method: 'POST', body: formData });
                                                    if (response.ok) { window.location.reload(); }
                                                } catch (err) { console.error("Upload failed:", err); }
                                            }} />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
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
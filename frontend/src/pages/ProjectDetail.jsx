import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getStatusColor } from '../utils/helpers';

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

     const isStepFinished = (stepKey, currentTaskStatus) => {
                                    const statusOrder = ['CREATE_TASK', 'SEND_TO_INTERIOR', 'SEND_TO_PRICING', 'SEND_TO_3D'];
                                    const currentIdx = statusOrder.indexOf(project.status);
                                    const stepIdx = statusOrder.indexOf(stepKey);
                                    return currentIdx > stepIdx;
    };

    useEffect(() => {
        const fetchProjectData = async () => {
            setIsLoading(true);
            try {
                // 1. ดึงข้อมูลโปรเจกต์
                const resP = await fetch(`http://localhost:5000/tasks/${id}`);
                const data = await resP.json();
                setProject(data);

                // 2. ดึงข้อมูล Timeline (ต้องเพิ่ม setTracking ตรงนี้!)
                const resT = await fetch(`http://localhost:5000/tasks/${id}/timeline-details`);
                const trackData = await resT.json();
                console.log("Timeline Data จาก Tracking:", trackData);
                setTracking(trackData); // <--- ต้องมีบรรทัดนี้ ข้อมูลถึงจะมา

            } catch (err) {
                console.error("Error fetching project:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjectData();
    }, [id]);

    if (isLoading) return <Layout><div className="text-center py-20">กำลังโหลดข้อมูล...</div></Layout>;
    if (!project) return <Layout><div className="text-center py-20 text-red-500">ไม่พบข้อมูลโครงการ</div></Layout>;

    return (
        <Layout>
            <div className="mb-6">
                {/* แถวที่ 1: ปุ่มย้อนกลับ */}
                <div className="mb-2">
                    <button onClick={() => navigate(-1)} className="text-blue-500 font-semibold flex items-center">
                        ← ย้อนกลับ
                    </button>
                </div>

                {/* แถวที่ 2: ชื่อโครงการ (ซ้าย) และ สถานะ (ขวา) */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">
                        #{project.id_task} {project.task_name}
                    </h1>
                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(project.status)}`}>
                        {project.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ฝั่งซ้าย: Timeline + ข้อมูลหลัก + คอมเมนต์ (กินพื้นที่ 2 ใน 3) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Timeline Component */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-8">Timeline</h3>
                        <div className="flex items-center justify-between relative px-4">
                            <div className="absolute top-5 left-8 right-8 h-1 bg-gray-100 -z-0"></div>

                            {steps.map((step, idx) => {
                                // กรองเอาเฉพาะข้อมูลของขั้นตอนนี้ออกมา
                                const stepHistory = tracking.filter(t => t.status === step.key);
                                const isCompleted = stepHistory.length > 0;
                                const isCurrent = project.status === step.key;

                                    return (
                                        <div key={idx} className="z-10 flex flex-col items-center">
                                            {/* วงกลมสถานะ */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 border-2 
                ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                                    isCurrent ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                {isCompleted ? '✓' : idx + 1}
                                            </div>

                                            <span className="text-xs font-bold text-gray-700">{step.label}</span>
                                            <span className="text-[10px] text-gray-500 mb-2">{step.dept}</span>

                                            {/* ส่วนแสดงเวลา */}
                                            <div className="text-[9px] text-gray-400 text-center">
                                                {stepHistory.map((h, hIdx) => (
                                                    <div key={hIdx}>
                                                        {new Date(h.action_at).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' })}
                                                        {' '}{new Date(h.action_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* --- ส่วนข้อมูลรายละเอียดโครงการ (พร้อมระบบแก้ไข) --- */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6 ">
                            <h3 className="font-bold text-gray-800">ข้อมูล</h3>
                            {(user?.role === 'Admin' || user?.role === 'Project Director') && (
                                <button className="text-red-500 font-bold text-sm hover:underline">แก้ไข</button>
                            )}
                        </div>

                        <div className="flex flex-col gap-y-3 text-sm mb-6">
                            <div className="flex items-center">
                                <span className="text-gray-500 w-[120px]">รหัสโครงการ :</span>
                                <span className="font-semibold">{project.id_task}</span>
                            </div>

                            <div className="flex items-center">
                                <span className="text-gray-500 w-[120px]">ชื่อโครงการ :</span>
                                <span className="font-semibold">{project.task_name}</span>
                            </div>

                            <div className="flex items-center">
                                <span className="text-gray-500 w-[120px]">ประเภท :</span>
                                <span className="font-semibold">{project.task_type}</span>
                            </div>

                            <div className="flex items-center">
                                <span className="text-gray-500 w-[120px]">ชื่อลูกค้า :</span>
                                <span className="font-semibold">{project.customer_name}</span>
                            </div>

                            <div className="flex items-center">
                                <span className="text-gray-500 w-[120px]">เบอร์โทรลูกค้า :</span>
                                <span className="font-semibold">{project.customer_phone}</span>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h4 className="font-bold text-gray-800 mb-2">รายละเอียดงาน</h4>
                            <div className="w-full p-4 bg-gray-50 rounded-xl text-sm text-gray-700 min-h-[120px] whitespace-pre-line border border-gray-100">
                                {project.description || "ไม่มีรายละเอียด"}
                            </div>
                        </div>

                        <div className="mt-6">
                            <h4 className="font-bold text-gray-800 mb-3">ไฟล์งาน</h4>

                            {/* ส่วนอัปโหลดไฟล์ */}
                            <div className="mb-4">
                                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm cursor-pointer hover:border-blue-400 transition-colors">
                                    <span>คลิกหรือลากไฟล์มาวางเพื่ออัปโหลดไฟล์งาน</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            formData.append('taskId', id);
                                            try {
                                                // เปลี่ยนกลับมาเป็น localhost
                                                const response = await fetch(`http://localhost:5000/tasks/${id}/files`, {
                                                    method: 'POST',
                                                    body: formData,
                                                });
                                                if (response.ok) {
                                                    alert("อัปโหลดสำเร็จ!");
                                                    window.location.reload();
                                                }
                                            } catch (err) {
                                                console.error("Upload failed:", err);
                                            }
                                        }}
                                    />
                                </label>
                            </div>

                            {/* ส่วนแสดงรายการไฟล์ (เรียงเป็นกล่องเล็กๆ ที่ลบได้) */}
                            <div className="flex flex-wrap gap-3">
                                {Array.isArray(files) && files.length > 0 ? (
                                    files.map(file => {
                                        const fileNameOnly = file.file_path.split(/[\\/]/).pop();
                                        const fileUrl = `http://localhost:5000/uploads/${fileNameOnly}`;

                                        return (
                                            <div
                                                key={file.id_files}
                                                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 transition-all"
                                            >
                                                {/* ไอคอน PDF */}
                                                <span className="text-red-500">📄</span>

                                                {/* ชื่อไฟล์ (คลิกเพื่อเปิด) */}
                                                <a href={fileUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-700 truncate max-w-[120px] hover:underline">
                                                    {file.file_name}
                                                </a>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <span className="text-gray-400 text-sm italic">ยังไม่มีไฟล์ในโครงการ</span>
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

                {/* ฝั่งขวา: Action Panel + ข้อมูลผู้รับผิดชอบ */}
                <div className="space-y-6">
                    {/* ส่วน Action Buttons */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">มอบหมายงาน</h3>
                        {/* ... ปุ่ม Action Panel ของคุณ ... */}
                    </div>

                    {/* กล่องที่ 1: สร้างโดย */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-sm space-y-3">
                        <div className="space-y-2">
                            <p className="flex justify-between">
                                <span className="text-gray-500">สร้างโดย :</span>
                                <span className="font-semibold">{project.created_by}</span>
                            </p>
                            <p className="flex justify-between"><span className="text-gray-500">แผนก :</span> <span className="font-semibold">{project.created_by_role}</span></p>
                            <p className="flex justify-between"><span className="text-gray-500">วันที่สร้าง :</span> <span className="font-semibold">{project.created_at ? new Date(project.created_at).toLocaleDateString() : '-'}</span></p>
                        </div>
                    </div>

                    {/* กล่องที่ 2: ผู้รับผิดชอบ */}
                    <div className="bg-white p-6 rounded-3xl ...">
                        <p className="flex justify-between">
                            <span className="text-gray-500">ผู้รับผิดชอบ :</span>
                            {/* ให้แน่ใจว่าเรียก project.assigned_to ตรงกับที่ server ส่งมา */}
                            <span className="font-semibold">{project.assigned_to || '-'}</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-gray-500">แผนก :</span>
                            <span className="font-semibold">{project.assigned_dept || '-'}</span>
                        </p>
                    </div>
                </div>
            </div>

        </Layout >
    );
}

export default ProjectDetail;
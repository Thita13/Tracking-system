import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { getStatusColor } from '../utils/helpers';
import ProjectActionBox from '../components/ProjectActionBox';
import FileManager from '../components/FileManager'; 
import CommentSection from '../components/CommentSection'; 
import Timeline from '../components/Timeline'; 

function ProjectDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [tracking, setTracking] = useState([]);
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
                    
                    {/* Timeline Component */}
                    <Timeline project={project} tracking={tracking} />

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

                        {/* ไฟล์แมนเนเจอร์ */}
                        <FileManager
                            project={project}
                            tracking={tracking}
                            files={files}
                            user={user}
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

                    {/* 🔴 คอมเมนต์ (ส่ง props project และ tracking ไปให้ Component จัดการสิทธิ์คำนวณเอง) */}
                    <CommentSection taskId={id} user={user} project={project} tracking={tracking} />
                    
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
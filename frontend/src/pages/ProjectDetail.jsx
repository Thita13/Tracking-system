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

    // State จัดการโหมดแก้ไขข้อมูล
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        task_name: '',
        task_type: '',
        customer_name: '',
        customer_phone: '',
        description: '',
        status: '',
        id_users: ''
    });

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

    useEffect(() => {
        fetchAllData();
    }, [id]);

    // ฟังก์ชันจัดการลบไฟล์
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

    // ฟังก์ชันจัดการอัปโหลดไฟล์
    const handleUploadFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('taskId', id);
        uploadData.append('userId', user.id);
        try {
            const response = await fetch(`http://localhost:5000/tasks/${id}/files`, { method: 'POST', body: uploadData });
            if (response.ok) { 
                const resF = await fetch(`http://localhost:5000/tasks/${id}/files`);
                const fileData = await resF.json();
                setFiles(Array.isArray(fileData) ? fileData : []);
            } else {
                alert('อัปโหลดไฟล์ไม่สำเร็จ');
            }
        } catch (err) { 
            console.error("Upload failed:", err); 
            alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        }
    };

    const handleEditClick = () => {
        setEditData({
            task_name: project.task_name || '',
            task_type: project.task_type || '',
            customer_name: project.customer_name || '',
            customer_phone: project.customer_phone || '',
            description: project.description || '',
            status: project.status || '', 
            id_users: project.id_users || '' 
        });
        setIsEditing(true);
    };

    const handleCancelEdit = () => setIsEditing(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = async () => {
        try {
            const response = await fetch(`http://localhost:5000/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });

            if (response.ok) {
                setProject(prev => ({ ...prev, ...editData })); 
                setIsEditing(false); 
            } else {
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
        } catch (err) {
            console.error("Save edit error:", err);
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
                    
                    <Timeline project={project} tracking={tracking} />

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6 ">
                            <h3 className="font-bold text-gray-800">ข้อมูล</h3>
                            
                            {/* 🔴 เพิ่มเงื่อนไข && project.status !== 'COMPLETED' เพื่อซ่อนปุ่มแก้ไขเมื่อโครงการเสร็จสิ้นแล้ว */}
                            {(user?.role === 'Admin' || user?.role === 'Project Director') && project.status !== 'COMPLETED' && (
                                isEditing ? (
                                    <div className="flex space-x-4">
                                        <button onClick={handleCancelEdit} className="text-gray-500 font-bold text-sm hover:underline">ยกเลิก</button>
                                        <button onClick={handleSaveEdit} className="text-blue-600 font-bold text-sm hover:underline">บันทึก</button>
                                    </div>
                                ) : (
                                    <button onClick={handleEditClick} className="text-red-500 font-bold text-sm hover:underline">แก้ไข</button>
                                )
                            )}
                        </div>

                        <div className="flex flex-col gap-y-3 text-sm mb-6">
                            <div className="flex items-center min-h-[32px]">
                                <span className="text-gray-500 w-[120px] flex-shrink-0">รหัสโครงการ :</span> 
                                <span className="font-semibold">{project.id_task}</span>
                            </div>
                            
                            <div className="flex items-center min-h-[32px]">
                                <span className="text-gray-500 w-[120px] flex-shrink-0">ชื่อโครงการ :</span> 
                                {isEditing ? (
                                    <input type="text" name="task_name" value={editData.task_name} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-1 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                ) : (
                                    <span className="font-semibold">{project.task_name}</span>
                                )}
                            </div>
                            
                            <div className="flex items-center min-h-[32px]">
                                <span className="text-gray-500 w-[120px] flex-shrink-0">ประเภท :</span> 
                                {isEditing ? (
                                    <select name="task_type" value={editData.task_type} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-1 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="home">home</option>
                                        <option value="condo">condo</option>
                                    </select>
                                ) : (
                                    <span className="font-semibold">{project.task_type}</span>
                                )}
                            </div>
                            
                            <div className="flex items-center min-h-[32px]">
                                <span className="text-gray-500 w-[120px] flex-shrink-0">ชื่อลูกค้า :</span> 
                                {isEditing ? (
                                    <input type="text" name="customer_name" value={editData.customer_name} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-1 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                ) : (
                                    <span className="font-semibold">{project.customer_name}</span>
                                )}
                            </div>
                            
                            <div className="flex items-center min-h-[32px]">
                                <span className="text-gray-500 w-[120px] flex-shrink-0">เบอร์โทรลูกค้า :</span> 
                                {isEditing ? (
                                    <input type="text" name="customer_phone" value={editData.customer_phone} onChange={handleInputChange} className="border border-gray-300 rounded-lg px-3 py-1 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                ) : (
                                    <span className="font-semibold">{project.customer_phone}</span>
                                )}
                            </div>
                        </div>

                        <div className="mt-4">
                            <h4 className="font-bold text-gray-800 mb-2">รายละเอียดงาน</h4>
                            {isEditing ? (
                                <textarea 
                                    name="description" 
                                    value={editData.description} 
                                    onChange={handleInputChange} 
                                    className="w-full p-4 border border-gray-300 rounded-xl text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            ) : (
                                <div className="w-full p-4 bg-gray-50 rounded-xl text-sm text-gray-700 min-h-[120px] whitespace-pre-line border border-gray-100">
                                    {project.description || "ไม่มีรายละเอียด"}
                                </div>
                            )}
                        </div>

                        {/* ไฟล์แมนเนเจอร์ */}
                        <FileManager
                            project={project}
                            tracking={tracking}
                            files={files}
                            user={user}
                            onUpload={handleUploadFile}
                            onDelete={handleDeleteFile}
                            isEditing={isEditing}
                        />
                    </div>

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
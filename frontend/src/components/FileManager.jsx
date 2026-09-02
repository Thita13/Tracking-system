import React from 'react';

export default function FileManager({
    project,      // ส่ง project เข้ามา
    tracking,     // ส่งประวัติ tracking ทั้งหมดเข้ามา
    files = [],   // ส่งรายการไฟล์ทั้งหมดเข้ามา
    user,         // ส่งข้อมูล user ปัจจุบันเข้ามา
    onUpload,     // ฟังก์ชันอัปโหลดไฟล์จากหน้าหลัก
    onDelete      // ฟังก์ชันลบไฟล์จากหน้าหลัก
}) {
    // ถ้าข้อมูลหลักยังไม่มา ไม่ต้องแสดงผล
    if (!project || !user) return null;

    // ===============================================================
    // โลจิกควบคุมสิทธิ์การจัดการไฟล์ (อัปโหลด / ลบ / แบ่งหมวดหมู่)
    // ย้ายมาจาก ProjectDetail เพื่อลดความซ้ำซ้อน
    // ===============================================================
    const currentStatus = project.status;
    const isAdminOrPD = user.role === 'Admin' || user.role === 'Project Director';
    const isAssignedToMe = String(project.assign_to) === String(user.id);

    let stageEnterStatuses = [];
    let stageStartStatus = '';

    if (currentStatus === 'INTERIOR' || currentStatus === 'WAITING_CONFIRM') {
        stageEnterStatuses = ['SEND_TO_INTERIOR', 'REQUEST_REVISION'];
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

    const lastEnterLog = tracking.filter(t => stageEnterStatuses.includes(t.status)).pop();
    const lastEnterTime = lastEnterLog ? new Date(lastEnterLog.action_at).getTime() : 0;

    const lastStartLog = tracking.filter(t => t.status === stageStartStatus).pop();
    const lastStartTime = lastStartLog ? new Date(lastStartLog.action_at).getTime() : 0;

    let hasStartedCurrentStage = (lastStartTime >= lastEnterTime) && (lastStartTime > 0);

    const canUploadFiles = !isAdminOrPD && isAssignedToMe && ['INTERIOR', 'PRICING', 'DESIGN_3D'].includes(currentStatus) && hasStartedCurrentStage && currentStatus !== 'WAITING_CONFIRM';

    const canDeleteFiles = isAdminOrPD 
        ? false 
        : (isAssignedToMe && hasStartedCurrentStage && !['NEW', 'WAITING_CONFIRM', 'COMPLETED'].includes(currentStatus));

    let firstTimeInThisStage = 0;
    const firstEnterLog = tracking.find(t => stageEnterStatuses.includes(t.status));
    if (firstEnterLog) {
        firstTimeInThisStage = new Date(firstEnterLog.action_at).getTime();
    }

    // จัดรูปแบบไฟล์และกรองการมองเห็น
    const formattedFiles = files.map(file => {
        const fileTime = new Date(file.created_at).getTime();
        const isMyUploadedFile = file.id_users && String(file.id_users) === String(user.id);
        const belongsToCurrentStage = fileTime >= firstTimeInThisStage;
        const isPrevious = !(isMyUploadedFile && belongsToCurrentStage && hasStartedCurrentStage && !isAdminOrPD);

        return { ...file, isPrevious };
    }).filter(file => {
        if (isAdminOrPD) {
            const isMyFile = file.id_users && String(file.id_users) === String(user.id);
            if (!isMyFile && currentStatus !== 'WAITING_CONFIRM' && currentStatus !== 'COMPLETED') {
                const fileTime = new Date(file.created_at).getTime();
                if (fileTime >= lastEnterTime) {
                    return false; 
                }
            }
        }
        return true;
    });

    // แยกไฟล์ตามหมวดหมู่
    const previousFiles = formattedFiles.filter(f => f.isPrevious);
    const myFiles = formattedFiles.filter(f => !f.isPrevious);

    // ===============================================================
    // ส่วนแสดงผล UI
    // ===============================================================
    return (
        <div className="mt-8">
            <h4 className="font-bold text-gray-800 mb-4">ไฟล์งานในโครงการ</h4>

            {previousFiles.length > 0 && (
                <div className="mb-6">
                    <h5 className="font-semibold text-gray-500 text-[13px] mb-3 flex items-center">
                        <span className="mr-2">📁</span> ไฟล์อ้างอิงจากขั้นตอนก่อนหน้า
                    </h5>
                    <div className="flex flex-col gap-2">
                        {previousFiles.map((file, idx) => {
                            const ext = file.file_name ? file.file_name.split('.').pop().toUpperCase() : 'FILE';
                            const isPDF = ext === 'PDF';
                            const isImage = ['JPG', 'JPEG', 'PNG'].includes(ext);

                            return (
                                <div key={file.id_files || idx} className="flex items-center justify-between w-full max-w-md px-4 py-2 bg-gray-50 border border-gray-200 rounded-md shadow-sm opacity-80">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded text-[10px] font-bold flex-shrink-0 
                                            ${isPDF ? 'bg-red-100 text-red-600' : isImage ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {ext.substring(0, 4)}
                                        </div>
                                        {file.file_path ? (
                                            <a href={`http://localhost:5000/uploads/${file.file_path.split(/[\\/]/).pop()}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-600 hover:underline truncate">
                                                {file.file_name}
                                            </a>
                                        ) : (
                                            <span className="text-sm font-medium text-gray-600 truncate">{file.file_name}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {previousFiles.length > 0 && <hr className="border-gray-100 mb-6" />}

            <div>
                <h5 className="font-semibold text-gray-700 text-[13px] mb-3 flex items-center">
                    <span className="mr-2">📂</span> ไฟล์งานของฉัน
                </h5>
                <div className="flex flex-col gap-2">
                    {myFiles.length > 0 ? myFiles.map((file, idx) => {
                        const ext = file.file_name ? file.file_name.split('.').pop().toUpperCase() : 'FILE';
                        const isPDF = ext === 'PDF';
                        const isImage = ['JPG', 'JPEG', 'PNG'].includes(ext);

                        return (
                            <div key={file.id_files || idx} className="flex items-center justify-between w-full max-w-md px-4 py-2.5 bg-white border border-gray-300 rounded-md shadow-sm transition-colors hover:bg-blue-50">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded text-[10px] font-bold flex-shrink-0 
                                        ${isPDF ? 'bg-red-100 text-red-600' : isImage ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {ext.substring(0, 4)}
                                    </div>
                                    {file.file_path ? (
                                        <a href={`http://localhost:5000/uploads/${file.file_path.split(/[\\/]/).pop()}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-800 hover:underline hover:text-blue-600 truncate">
                                            {file.file_name}
                                        </a>
                                    ) : (
                                        <span className="text-sm font-bold text-gray-800 truncate">{file.file_name}</span>
                                    )}
                                </div>

                                {canDeleteFiles && onDelete && (file.id_files || file.isLocal) && (
                                    <button 
                                        onClick={() => onDelete(file.id_files || 0)}
                                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors ml-2 flex-shrink-0"
                                        title="ลบไฟล์"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        );
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
                            <input type="file" className="hidden" onChange={onUpload} />
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}
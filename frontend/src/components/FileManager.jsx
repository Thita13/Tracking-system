import React from 'react';

export default function FileManager({
    project,        
    tracking,       
    files = [],     
    user,           
    onUpload,       
    onDelete,       
    isEditing       
}) {
    if (!project || !user) return null;

    const currentStatus = project.status;
    
    // แปลงเป็นตัวเล็กเพื่อป้องกันปัญหาพิมพ์เล็ก/ใหญ่ไม่ตรงกัน
    const userRoleStr = user.role ? String(user.role).toLowerCase().trim() : '';
    const isAdminOrPD = userRoleStr === 'admin' || userRoleStr === 'project director' || userRoleStr === 'project_director';
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

    // เช็คว่าพนักงานทั่วไปกำลังอยู่ในสเตจทำงานของตัวเองหรือไม่
    const isWorkingStage = isAssignedToMe && hasStartedCurrentStage && !['NEW', 'WAITING_CONFIRM', 'COMPLETED'].includes(currentStatus);

    // 🔴 สิทธิ์การอัปโหลดไฟล์
    // - Admin/PD ต้องกด "แก้ไข" (isEditing) ถึงจะอัปโหลดได้
    // - พนักงานทั่วไป อัปโหลดได้ทันทีเมื่อกำลังทำงานของตัวเอง (isWorkingStage)
    const canUploadFiles = (isAdminOrPD && isEditing) || (!isAdminOrPD && isWorkingStage);

    let firstTimeInThisStage = 0;
    const firstEnterLog = tracking.find(t => stageEnterStatuses.includes(t.status));
    if (firstEnterLog) {
        firstTimeInThisStage = new Date(firstEnterLog.action_at).getTime();
    }

    // แปะสถานะ isPrevious ให้กับไฟล์ (ถ้าไฟล์สร้างก่อนที่สเตจนี้จะเริ่ม = เป็นอดีต)
    const formattedFiles = files.map(file => {
        const fileTime = new Date(file.created_at).getTime();
        const belongsToCurrentStage = fileTime >= firstTimeInThisStage;
        const isPrevious = !belongsToCurrentStage;
        return { ...file, isPrevious };
    });

    // จัดหมวดหมู่ไฟล์
    const referenceFiles = []; 
    const myWorkFiles = [];    

    formattedFiles.forEach(file => {
        const isMyFile = file.id_users && String(file.id_users) === String(user.id);
        const uploaderRoleStr = file.uploaded_by_role ? String(file.uploaded_by_role).toLowerCase().trim() : '';
        const isUploaderAdminOrPD = uploaderRoleStr === 'admin' || uploaderRoleStr === 'project director' || uploaderRoleStr === 'project_director';

        if (isAdminOrPD) {
            // Admin/PD: ไฟล์ของ Admin/PD ด้วยกันคือ "ไฟล์ของฉัน"
            if (isMyFile || isUploaderAdminOrPD) {
                myWorkFiles.push(file);
            } else {
                referenceFiles.push(file);
            }
        } else {
            // พนักงานทั่วไป: เป็น "ไฟล์ของฉัน" ได้เฉพาะไฟล์ตัวเองและไม่ใช่ของสเตจที่แล้ว
            if (isMyFile && !file.isPrevious) {
                myWorkFiles.push(file);
            } else {
                referenceFiles.push(file);
            }
        }
    });

    // ===============================================================
    // 🔴 แก้ไขสิทธิ์การลบไฟล์ (แยกเงื่อนไขของ Admin ออกจากพนักงานชัดเจน)
    // ===============================================================
    const checkCanDelete = (file) => {
        const isMyFile = file.id_users && String(file.id_users) === String(user.id);
        const uploaderRoleStr = file.uploaded_by_role ? String(file.uploaded_by_role).toLowerCase().trim() : '';
        const isUploaderAdminOrPD = uploaderRoleStr === 'admin' || uploaderRoleStr === 'project director' || uploaderRoleStr === 'project_director';

        if (isAdminOrPD) {
            // Admin/PD ต้องกดแก้ไข (isEditing) ถึงจะลบไฟล์ได้
            return isEditing && (isMyFile || isUploaderAdminOrPD);
        } else {
            // พนักงานทั่วไป ลบ "ไฟล์ของตัวเอง" ได้ทันที ไม่ต้องกดแก้ไข (ไม่ต้องเช็ค isEditing)
            // 🔴 แก้ตรงนี้: เพิ่ม && !file.isPrevious เพื่อป้องกันไม่ให้ลบไฟล์จากขั้นตอนก่อนหน้า
            return isWorkingStage && isMyFile && !file.isPrevious;
        }
    };

    return (
        <div className="mt-8">
            <h4 className="font-bold text-gray-800 mb-4">ไฟล์งานในโครงการ</h4>

            {/* หมวด: ไฟล์อ้างอิง */}
            {referenceFiles.length > 0 && (
                <div className="mb-6">
                    <h5 className="font-semibold text-gray-500 text-[13px] mb-3 flex items-center">
                        <span className="mr-2">📁</span> ไฟล์อ้างอิง
                    </h5>
                    <div className="flex flex-col gap-2">
                        {referenceFiles.map((file, idx) => {
                            const ext = file.file_name ? file.file_name.split('.').pop().toUpperCase() : 'FILE';
                            const isPDF = ext === 'PDF';
                            const isImage = ['JPG', 'JPEG', 'PNG'].includes(ext);

                            const canDeleteThisFile = checkCanDelete(file);

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
                                    
                                    {canDeleteThisFile && onDelete && (file.id_files || file.isLocal) && (
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
                        })}
                    </div>
                </div>
            )}

            {referenceFiles.length > 0 && <hr className="border-gray-100 mb-6" />}

            {/* หมวด: ไฟล์งานของฉัน */}
            <div>
                <h5 className="font-semibold text-gray-700 text-[13px] mb-3 flex items-center">
                    <span className="mr-2">📂</span> ไฟล์งานของฉัน
                </h5>
                <div className="flex flex-col gap-2">
                    {myWorkFiles.length > 0 ? myWorkFiles.map((file, idx) => {
                        const ext = file.file_name ? file.file_name.split('.').pop().toUpperCase() : 'FILE';
                        const isPDF = ext === 'PDF';
                        const isImage = ['JPG', 'JPEG', 'PNG'].includes(ext);

                        const canDeleteThisFile = checkCanDelete(file);

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

                                {canDeleteThisFile && onDelete && (file.id_files || file.isLocal) && (
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
                        <span className="text-gray-400 text-sm italic px-2">ยังไม่มีไฟล์ของฉันในโครงการนี้</span>
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
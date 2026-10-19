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

    // ตรวจสอบรอบของงานปัจจุบัน
    // เรียง Tracking จากเก่า → ใหม่ก่อน
    const sortedTracking = [...tracking].sort(
        (a, b) =>
            new Date(a.action_at).getTime() -
            new Date(b.action_at).getTime()
    );

    // Log ที่ใช้บอกว่า "เข้าสู่ขั้นตอน/รอบงาน"
    const enterLogs = sortedTracking.filter(
        t => stageEnterStatuses.includes(t.status)
    );

    // รอบปัจจุบัน
    const lastEnterLog = enterLogs[enterLogs.length - 1];

    const lastEnterTime = lastEnterLog
        ? new Date(lastEnterLog.action_at).getTime()
        : 0;

    // รอบก่อนหน้าของขั้นตอนเดียวกัน
    const previousEnterLog =
        enterLogs.length >= 2
            ? enterLogs[enterLogs.length - 2]
            : null;

    const previousEnterTime = previousEnterLog
        ? new Date(previousEnterLog.action_at).getTime()
        : 0;


    // ตรวจสอบว่าผู้รับผิดชอบกด "รับงาน" แล้วหรือยัง
    const startLogs = sortedTracking.filter(
        t => t.status === stageStartStatus
    );

    const lastStartLog = startLogs[startLogs.length - 1];

    const lastStartTime = lastStartLog
        ? new Date(lastStartLog.action_at).getTime()
        : 0;

    const hasStartedCurrentStage =
        lastStartTime >= lastEnterTime &&
        lastStartTime > 0;

    // ต้องเป็นคนที่ได้รับมอบหมาย + กดรับงานแล้ว
    const isWorkingStage =
        isAssignedToMe &&
        hasStartedCurrentStage &&
        !['NEW', 'WAITING_CONFIRM', 'COMPLETED'].includes(currentStatus);


    // ตรวจสอบว่าเป็น Revision ของ "รอบปัจจุบัน" หรือไม่
    const latestRevision = [...tracking]
        .sort(
            (a, b) =>
                new Date(b.action_at).getTime() -
                new Date(a.action_at).getTime()
        )
        .find(
            t =>
                t.status === 'REQUEST_REVISION' &&
                new Date(t.action_at).getTime() >= lastEnterTime
        );

    const isRevisionForMe =
        !!project.accepted_at &&
        !isAdminOrPD &&
        isAssignedToMe &&
        !!latestRevision &&
        ['INTERIOR', 'PRICING', 'DESIGN_3D'].includes(currentStatus);

    // คนที่ได้รับงานกลับมาแก้ไข สามารถอัปโหลดไฟล์ใหม่ได้
    const canUploadFiles =
        (isAdminOrPD && isEditing) ||
        (!isAdminOrPD && (isWorkingStage));

    // ===============================================================
    // แก้ไขเฉพาะส่วนนี้: เปลี่ยนมาใช้ lastEnterTime เพื่อตัดไฟล์เก่าเป็นอดีต
    // ===============================================================
    const formattedFiles = files.map(file => {
        const fileTime = new Date(file.created_at).getTime();
        
        // ใช้ lastEnterTime (เวลาเข้าสเตจล่าสุด) แทน firstTimeInThisStage
        const belongsToCurrentStage = fileTime >= lastEnterTime;
        const isPrevious = !belongsToCurrentStage;

        const isMyFile = file.id_users && String(file.id_users) === String(user.id);
        const uploaderRoleStr = file.uploaded_by_role ? String(file.uploaded_by_role).toLowerCase().trim() : '';
        const isUploaderAdminOrPD = uploaderRoleStr === 'admin' || uploaderRoleStr === 'project director' || uploaderRoleStr === 'project_director';

        let isVisibleToMe = true;

        // ถ้าไฟล์นี้ไม่ใช่ของเรา และคนอัปโหลดไม่ใช่ Admin/PD (แปลว่าเป็นไฟล์ของแผนกอื่นที่กำลังทำอยู่)
        if (!isMyFile && !isUploaderAdminOrPD) {
            const handoverStatuses = [
                'SEND_TO_PROJECTDIRECTOR',
                'SEND_TO_INTERIOR',
                'SEND_TO_PRICING',
                'SEND_TO_3D',
                'COMPLETE'
            ];

            // เช็คว่ามีประวัติกด "ส่งงาน" หลังจากเวลาที่อัปโหลดไฟล์นี้หรือยัง
            const hasBeenSubmitted = tracking.some(t => {
                const trackTime = new Date(t.action_at).getTime();
                return handoverStatuses.includes(t.status) && trackTime >= fileTime;
            });

            // ถ้ายังไม่ได้กดส่งงาน ให้ซ่อนไฟล์นี้จากคนอื่น
            if (!hasBeenSubmitted) {
                isVisibleToMe = false;
            }
        }

        return { ...file, isPrevious, isVisibleToMe };
    });

    const referenceFiles = []; 
    const myWorkFiles = [];    

    formattedFiles.forEach(file => {
        // ถ้า isVisibleToMe เป็น false ให้ข้ามไฟล์นี้ไปเลย (ไม่แสดงให้แผนกอื่นเห็น)
        if (!file.isVisibleToMe) return;

        const isMyFile = file.id_users && String(file.id_users) === String(user.id);
        const uploaderRoleStr = file.uploaded_by_role ? String(file.uploaded_by_role).toLowerCase().trim() : '';
        const isUploaderAdminOrPD = uploaderRoleStr === 'admin' || uploaderRoleStr === 'project director' || uploaderRoleStr === 'project_director';

        if (isAdminOrPD) {
            if (isMyFile || isUploaderAdminOrPD) {
                myWorkFiles.push(file);
            } else {
                referenceFiles.push(file);
            }
        } else {
            if (isMyFile && (isRevisionForMe || !file.isPrevious)) {
                myWorkFiles.push(file);
            } else {
                referenceFiles.push(file);
            }
        }
    });

    // ฟังก์ชันตรวจสอบว่าไฟล์นี้สามารถลบได้หรือไม่
    const checkCanDelete = (file) => {
        const isMyFile =
            file.id_users &&
            String(file.id_users) === String(user.id);

        const uploaderRoleStr = file.uploaded_by_role
            ? String(file.uploaded_by_role).toLowerCase().trim()
            : '';

        const isUploaderAdminOrPD =
            uploaderRoleStr === 'admin' ||
            uploaderRoleStr === 'project director' ||
            uploaderRoleStr === 'project_director';

        console.log('========== FILE DELETE CHECK ==========');
        console.log('file:', file.file_name);
        console.log('file.id_users:', file.id_users);
        console.log('user.id:', user.id);
        console.log('isMyFile:', isMyFile);
        console.log('isWorkingStage:', isWorkingStage);
        console.log('isRevisionForMe:', isRevisionForMe);
        console.log('file.isPrevious:', file.isPrevious);
        console.log('currentStatus:', currentStatus);
        console.log('project.accepted_at:', project.accepted_at);
        console.log('========================================');

        // Admin / Project Director
        if (isAdminOrPD) {
            return isEditing && (isMyFile || isUploaderAdminOrPD);
        }

        // ต้องเป็นคนที่ได้รับมอบหมาย และกดรับงานแล้ว
        if (!isWorkingStage) {
            return false;
        }

        // กรณีถูกส่งกลับมาแก้ไข
        if (isRevisionForMe) {
            return isMyFile;
        }

        // งานปกติลบได้เฉพาะไฟล์ของตัวเองในรอบปัจจุบัน
        return isMyFile && !file.isPrevious;
    };

    return (
        <div className="mt-8">
            <h4 className="font-bold text-gray-800 mb-4">ไฟล์งานในโครงการ</h4>

            {/* หมวด: ไฟล์อ้างอิง */}
            {referenceFiles.length > 0 && (
                <div className="mb-6">
                    <h5 className="font-semibold text-gray-500 text-[13px] mb-3 flex items-center">
                        <span className="mr-2">📁</span> ไฟล์ที่เกี่ยวข้อง
                    </h5>
                    <div className="flex flex-col gap-2">
                        {referenceFiles.map((file, idx) => {
                            const ext = file.file_name ? file.file_name.split('.').pop().toUpperCase() : 'FILE';
                            const isPDF = ext === 'PDF';
                            const isImage = ['JPG', 'JPEG', 'PNG'].includes(ext);
                            const canDeleteThisFile = checkCanDelete(file);

                            return (
                                // ใส่ class "group relative" ไว้ที่กรอบนอกสุดของไฟล์
                                <div key={file.id_files || idx} className="group relative flex items-center justify-between w-full max-w-md px-4 py-2 bg-gray-50 border border-gray-200 rounded-md shadow-sm opacity-80 cursor-default">
                                    
                                    {/* Tooltip โชว์ตอน Hover */}
                                    <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 mb-1 px-3 py-1.5 bg-gray-800 text-white text-[11px] font-medium rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap pointer-events-none">
                                        เพิ่มโดย : {file.uploaded_by_name || 'ไม่ทราบชื่อ'} ({file.uploaded_by_role || '-'})
                                        {/* สามเหลี่ยมชี้ลง */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-800"></div>
                                    </div>

                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded text-[10px] font-bold flex-shrink-0 
                                            ${isPDF ? 'bg-red-100 text-red-600' : isImage ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {ext.substring(0, 4)}
                                        </div>
                                        {file.file_path ? (
                                            <a href={file.file_path?.startsWith('http') ? file.file_path : `http://localhost:5000/uploads/${file.file_path?.split(/[\\/]/).pop()}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-600 hover:underline hover:text-blue-600 truncate">
                                                {file.file_name}
                                            </a>
                                        ) : (
                                            <span className="text-sm font-medium text-gray-600 truncate">{file.file_name}</span>
                                        )}
                                    </div>
                                    
                                    {canDeleteThisFile && onDelete && (file.id_files || file.isLocal) && (
                                        <button 
                                            onClick={() => onDelete(file.id_files || 0)}
                                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors ml-2 flex-shrink-0 relative z-10"
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
                            // ใส่ class "group relative" ไว้ที่กรอบนอกสุดของไฟล์
                            <div key={file.id_files || idx} className="group relative flex items-center justify-between w-full max-w-md px-4 py-2.5 bg-white border border-gray-300 rounded-md shadow-sm transition-colors hover:bg-blue-50 cursor-default">
                                
                                {/* Tooltip โชว์ตอน Hover */}
                                <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 mb-1 px-3 py-1.5 bg-gray-800 text-white text-[11px] font-medium rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap pointer-events-none">
                                    เพิ่มโดย : {file.uploaded_by_name || 'ไม่ทราบชื่อ'} ({file.uploaded_by_role || '-'})
                                    {/* สามเหลี่ยมชี้ลง */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-800"></div>
                                </div>

                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded text-[10px] font-bold flex-shrink-0 
                                        ${isPDF ? 'bg-red-100 text-red-600' : isImage ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {ext.substring(0, 4)}
                                    </div>
                                    {file.file_path ? (
                                        <a href={file.file_path?.startsWith('http') ? file.file_path : `http://localhost:5000/uploads/${file.file_path?.split(/[\\/]/).pop()}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-gray-800 hover:underline hover:text-blue-600 truncate">
                                            {file.file_name}
                                        </a>
                                    ) : (
                                        <span className="text-sm font-bold text-gray-800 truncate">{file.file_name}</span>
                                    )}
                                </div>

                                {canDeleteThisFile && onDelete && (file.id_files || file.isLocal) && (
                                    <button 
                                        onClick={() => onDelete(file.id_files || 0)}
                                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors ml-2 flex-shrink-0 relative z-10"
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
                            <input type="file" accept=".cad,.dwg,.dxf,.pdf,.jpg,.jpeg,.png,.doc" className="hidden" onChange={onUpload} />
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}
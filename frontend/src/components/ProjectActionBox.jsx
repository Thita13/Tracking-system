import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Clock } from 'lucide-react';

export default function ProjectActionBox({ user, project, tracking = [], handleAction }) {

    const [selectedDept, setSelectedDept] = useState('');
    const [members, setMembers] = useState([]);
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [selectedMemberName, setSelectedMemberName] = useState('');
    const [loadingMembers, setLoadingMembers] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);

    // State สำหรับเก็บรายชื่อ Interior และคนที่เลือกตอนจะส่งไป 3D
    const [interiorMembers, setInteriorMembers] = useState([]);
    const [selected3DMemberId, setSelected3DMemberId] = useState('');

    const isAdmin = user.role === 'Admin';
    const isProjectDirector = user.role === 'Project Director';

    const isMyAssignedTask = String(project.assign_to) === String(user.id);

    // 🔴 เช็คว่าโปรเจกต์อยู่ในสถานะ COMPLETED หรือไม่
    const isProjectCompleted = project.status === 'COMPLETED';

    // ดึงรายชื่อพนักงาน Interior สำหรับ PD เมื่อโปรเจกต์อยู่ในสถานะรอส่งไป 3D
    useEffect(() => {
        if (isProjectDirector && project.status === 'WAITING_CONFIRM') {
            const fetchInteriorMembers = async () => {
                try {
                    const res = await fetch('http://localhost:5000/users/by-role/Interior');
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setInteriorMembers(data);
                    }
                } catch (err) {
                    console.error("Failed to fetch interior members for 3D:", err);
                }
            };
            fetchInteriorMembers();
        }
    }, [isProjectDirector, project.status]);

    // ดึงรายชื่อพนักงานเมื่อเลือกแผนก Interior (สำหรับ Admin)
    useEffect(() => {
        if (selectedDept !== 'Interior' && selectedDept !== 'Interior 3D') {
            setMembers([]);
            return;
        }

        const fetchMembersByDept = async () => {
            setLoadingMembers(true);
            try {
                const roleToFetch = selectedDept === 'Interior 3D' ? 'Interior': selectedDept;
                const res = await fetch(`http://localhost:5000/users/by-role/${roleToFetch}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMembers(data);
                } else {
                    setMembers([]);
                }
            } catch (err) {
                console.error("Failed to fetch members:", err);
                setMembers([]);
            } finally {
                setLoadingMembers(false);
            }
        };

        fetchMembersByDept();
    }, [selectedDept]);

    const handleAssignClick = () => {
        if (!selectedDept) return;

        // Interior และ Interior 3D ต้องเลือกผู้รับผิดชอบก่อน
        if ((selectedDept === 'Interior' || selectedDept === 'Interior 3D') && !selectedMemberId) {
            setIsModalOpen(true);
            return;
        }

        // ส่ง action เดิมไป Backend ก่อน
        // Backend จะเป็นผู้ map department -> status
        handleAction('ASSIGN', {
            department: selectedDept,
            memberId: (selectedDept === 'Interior' || selectedDept === 'Interior 3D')
                ? selectedMemberId
                : null
        });
    };

    const handleConfirmAssign = () => {
        if (!selectedMemberId) return;

        const foundMember = members.find(m => String(m.id_users || m.id_user || m.id) === String(selectedMemberId));
        if (foundMember) {
            setSelectedMemberName(foundMember.name || foundMember.username);
        }

        setIsModalOpen(false);
    };
    
    if (!user || !project) return null;

    return (
        <div className="bg-white p-6 rounded-3xl space-y-4 relative">

            {/* 1. รูปแบบสำหรับ ADMIN */}
            {isAdmin ? (
                /* 1. รูปแบบสำหรับ ADMIN */
                <div className="space-y-4">
                    {/* Dropdown เลือกขั้นตอน/แผนกที่ต้องการมอบหมาย */}
                    <select
                        value={selectedDept}
                        onChange={(e) => {
                            const dept = e.target.value;

                            // เปลี่ยนตัวเลือกใหม่ -> ล้าง User ที่เลือกไว้ก่อนหน้า
                            setSelectedDept(dept);
                            setSelectedMemberId('');
                            setSelectedMemberName('');

                            // Interior และ Interior 3D ต้องเลือกผู้รับผิดชอบ
                            if (dept === 'Interior' || dept === 'Interior 3D') {
                                setIsModalOpen(true);
                            }
                        }}
                        disabled={isProjectCompleted}
                        className={`w-full border rounded-lg p-2.5 text-sm outline-none bg-white focus:border-blue-500 cursor-pointer ${isProjectCompleted
                            ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                            : 'border-gray-300 text-gray-700'
                            }`}
                    >
                        <option value="">เลือกแผนกที่ต้องการมอบหมายงาน</option>
                        <option value="Project Director">Project Director</option>
                        <option value="Interior">Interior</option>
                        <option value="Pricing">Pricing</option>
                        <option value="Interior 3D">Interior 3D</option>
                        <option value="COMPLETED">เสร็จสิ้นโครงการ</option>
                    </select>

                    {/* แสดง User ที่เลือกสำหรับ Interior / Interior 3D */}
                    {(selectedDept === 'Interior' || selectedDept === 'Interior 3D') && selectedMemberName && (
                        <div
                            onClick={() => !isProjectCompleted && setIsModalOpen(true)}
                            className={`w-full border rounded-lg p-2.5 text-sm font-semibold flex justify-between items-center transition-colors shadow-sm ${isProjectCompleted
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-blue-500 bg-blue-50/60 text-blue-900 cursor-pointer hover:bg-blue-100'
                                }`}
                        >
                            <div className="flex items-center space-x-2">
                                <span className={`text-xs px-2 py-0.5 rounded text-white ${isProjectCompleted ? 'bg-gray-400' : 'bg-blue-600'}`}>
                                    {selectedDept}
                                </span>
                                <span>{selectedMemberName}</span>
                            </div>
                            {!isProjectCompleted && (
                                <span className="text-xs text-blue-600 underline">เปลี่ยนคน</span>
                            )}
                        </div>
                    )}

                    {/* ปุ่มยกเลิกการเลือก */}
                    {selectedDept && !isProjectCompleted && (
                        <button
                            onClick={() => {
                                setSelectedDept('');
                                setSelectedMemberId('');
                                setSelectedMemberName('');
                            }}
                            className="text-xs text-gray-500 hover:text-red-600 transition-colors text-left block -mt-2"
                        >
                            ✕ ยกเลิกการเลือก
                        </button>
                    )}

                    {/* ปุ่มมอบหมาย / เปลี่ยนสถานะ */}
                    <button
                        onClick={handleAssignClick}
                        disabled={isProjectCompleted || !selectedDept || ((selectedDept === 'Interior' || selectedDept === 'Interior 3D') && !selectedMemberId)}
                        className={`w-full py-2.5 rounded-xl font-bold transition-colors shadow-sm text-white ${isProjectCompleted || !selectedDept || ((selectedDept === 'Interior' || selectedDept === 'Interior 3D') && !selectedMemberId)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#188BFE] hover:bg-blue-600'
                            }`}
                    >
                        {selectedDept === 'COMPLETED' ? 'เสร็จสิ้นโครงการ' : 'มอบหมายงาน'}
                    </button>
                </div>
            ) : isProjectDirector ? (

                /* 2. รูปแบบสำหรับ PROJECT DIRECTOR */
                <div className="space-y-4 -mt-4 -mb-4">
                    <div className={`p-4 border rounded-xl space-y-2.5 ${isProjectCompleted ? 'bg-gray-50 border-gray-200' : 'bg-[#FFEEDD] border-[#FFD5B8]'}`}>
                        <div>
                            <p className={`text-sm font-bold ${isProjectCompleted ? 'text-gray-400' : 'text-gray-900'}`}>แก้ไขงาน</p>
                            <p className={`text-xs ${isProjectCompleted ? 'text-gray-400' : 'text-gray-600'}`}>มอบหมายให้ดำเนินการแก้ไข</p>
                        </div>
                        <button
                            // 🔴 แก้ไข onClick ตรงนี้
                            onClick={() => {
                                // เช็คว่าปัจจุบันผ่านแผนกไหนมาแล้วบ้าง เพื่อตีกลับไปให้ถูกแผนก
                                const lastSubmit = [...tracking]
                                    .reverse()
                                    .find(t => t.status === 'SEND_TO_PROJECTDIRECTOR');
                                let rollbackTo = 'INTERIOR';
                                if (lastSubmit?.department === 'Pricing') {
                                    rollbackTo = 'PRICING';
                                } else if (lastSubmit?.department === 'Interior') {
                                    rollbackTo = 'INTERIOR';
                                }

                                // ส่ง Action พร้อมแนบชื่อสถานะเป้าหมายไปให้ Backend
                                handleAction('REVISE', { department: rollbackTo });
                            }}
                            disabled={isProjectCompleted || project.status !== 'WAITING_CONFIRM'}
                            className={`w-full py-2 rounded-xl font-bold text-base transition-colors shadow-sm text-white ${isProjectCompleted || project.status !== 'WAITING_CONFIRM'
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#FF7A00] hover:bg-orange-600'
                                }`}
                        >
                            ส่งกลับให้แก้ไข
                        </button>
                    </div>

                    <div className={`p-4 border rounded-xl space-y-2.5 ${isProjectCompleted ? 'bg-gray-50 border-gray-200' : 'bg-[#E8F8EE] border-[#BCEED0]'}`}>
                        {(() => {
                            const latestSubmit = [...tracking] // หาว่างานที่ส่งมาตรวจล่าสุดมาจากแผนกไหน
                                .reverse()
                                .find(t => t.status === 'SEND_TO_PROJECTDIRECTOR');
                            const latestDepartment = latestSubmit?.department; 
                            const has3D = tracking.some(t => t.status === 'START_3D'); // ใช้ดูว่าผ่าน 3D หรือยัง
                            const fromPricing = latestDepartment === 'Pricing'; // ถ้าล่าสุดมาจาก Pricing แปลว่า Admin / PD กำลังตรวจงาน
                            const fromInterior = latestDepartment === 'Interior'; // ถ้าล่าสุดมาจาก Interior แปลว่า PD กำลังตรวจงาน

                            return (
                                <>
                                    <div>
                                        <p className={`text-sm font-bold ${isProjectCompleted ? 'text-gray-400' : 'text-gray-900'}`}>
                                            {has3D ? 'เสร็จสิ้นโครงการ' : 'ยืนยันงาน'}
                                        </p>
                                        <p className={`text-xs ${isProjectCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {has3D ? 'ตรวจสอบและปิดโครงการ' : 'มอบหมายให้ขั้นตอนถัดไป'}
                                        </p>
                                    </div>

                                    {project.status === 'WAITING_CONFIRM' && fromPricing && !has3D && !isProjectCompleted && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-700">เลือกพนักงานทำ 3D:</label>
                                            <select
                                                value={selected3DMemberId}
                                                onChange={(e) => setSelected3DMemberId(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-white text-gray-800 outline-none focus:border-green-500"
                                            >
                                                <option value=""> เลือกพนักงาน Interior </option>
                                                {interiorMembers.map((m) => (
                                                    <option key={m.id_users || m.id_user || m.id} value={m.id_users || m.id_user || m.id}>
                                                        {m.name || m.username}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            if (has3D) {
                                                handleAction('COMPLETE');
                                            } else if (fromPricing) {
                                                handleAction('NEXT_STEP', { department: 'Interior', memberId: selected3DMemberId });
                                            } else if (fromInterior) {
                                                handleAction('NEXT_STEP');
                                            }
                                        }}
                                        disabled={
                                            isProjectCompleted ||
                                            project.status !== 'WAITING_CONFIRM' ||
                                            (fromPricing && !has3D && !selected3DMemberId)
                                        }
                                        className={`w-full py-2 rounded-xl font-bold text-base transition-colors shadow-sm text-white ${
                                            isProjectCompleted ||
                                            project.status !== 'WAITING_CONFIRM' ||
                                            (fromPricing && !has3D && !selected3DMemberId)
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'bg-[#65C100] hover:bg-green-600'
                                            }`}
                                    >
                                        {has3D ? 'จบโครงการ' : 'ส่งไปขั้นตอนถัดไป'}
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </div>

            ) : (
                /* 3. รูปแบบสำหรับ ROLE อื่นๆ เช่น Interior หรือ Pricing */
                (() => {
                    const is3DStage = project.status === 'DESIGN_3D';
                    const isInteriorStage = project.status === 'INTERIOR';
                    const isPricingStage = project.status === 'PRICING';

                    const has3DStarted = tracking.some(t => t.status === 'START_3D');
                    const hasInteriorStarted = tracking.some(t => t.status === 'START_INTERIOR');
                    const hasPricingStarted = tracking.some(t => t.status === 'START_PRICING');

                    const canReceiveWork = (user.role === 'Interior' && (project.status === 'NEW' || isInteriorStage) && isMyAssignedTask) ||
                        (user.role === 'Pricing' && isPricingStage && (!project.assign_to || isMyAssignedTask)) ||
                        (user.role === 'Interior' && is3DStage && isMyAssignedTask);

                    // 🔴 1. เช็คว่างานนี้เป็นของคนอื่นไปแล้วใช่หรือไม่ (มีคนรับงานแล้วและไม่ใช่เรา)
                    const isAssignedToSomeoneElse = Boolean(project.assign_to) && !isMyAssignedTask;

                    // 🔴 2. ปรับ Logic การเคลียร์สถานะรับงาน เมื่อโดนตีกลับ
                    const isClaimed = Boolean(project.accepted_at);
                    return (
                        <div className="space-y-4 -mt-4 -mb-4">
                            {/* --- ปุ่มรับงาน --- */}
                            <div className={`p-4 border rounded-xl space-y-2.5 ${isProjectCompleted ? 'bg-gray-50 border-gray-200' : 'bg-[#EBF0FF] border-[#D0E1FF]'}`}>
                                <div>
                                    <p className={`text-sm font-bold ${isProjectCompleted ? 'text-gray-400' : 'text-gray-900'}`}>รับงาน</p>
                                    <p className={`text-xs ${isProjectCompleted ? 'text-gray-400' : 'text-gray-600'}`}>กดรับงานเพื่อเริ่มดำเนินการตามขั้นตอน</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (user.role === 'Pricing') {
                                            handleAction('CLAIM_PRICING');
                                        } else if (is3DStage) {
                                                handleAction('START_3D_WORK');
                                            } else {
                                                handleAction('START_WORK');
                                            }
                                    }}
                                    // 🔴 3. เพิ่มเงื่อนไขล็อคปุ่ม ถ้างานนี้เป็นของคนอื่น (isAssignedToSomeoneElse)
                                    disabled={isProjectCompleted ||
                                        !canReceiveWork ||
                                        isClaimed}
                                    className={`w-full py-2 rounded-xl font-bold text-base transition-colors shadow-sm text-white ${
                                        isProjectCompleted || !canReceiveWork || isClaimed
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-[#4862FC] hover:bg-[#3B50E0]'
                                    }`}
                                >
                                    {/* 🔴 4. เปลี่ยนข้อความปุ่มให้รู้ว่าเป็นงานของคนอื่น */}
                                    {isClaimed ? 'รับงานแล้ว' : 'รับงานนี้'}
                                </button>
                            </div>

                            {/* --- ปุ่มส่งงาน --- */}
                            <div className={`p-4 border rounded-xl space-y-2.5 ${isProjectCompleted ? 'bg-gray-50 border-gray-200' : 'bg-[#E8F8EE] border-[#BCEED0]'}`}>
                                <div>
                                    <p className={`text-sm font-bold ${isProjectCompleted ? 'text-gray-400' : 'text-gray-900'}`}>ส่งงาน</p>
                                    <p className={`text-xs ${isProjectCompleted ? 'text-gray-400' : 'text-gray-600'}`}>งานที่ได้รับมอบหมายดำเนินการเสร็จสิ้น</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (is3DStage) {
                                            handleAction('SUBMIT_3D_WORK');
                                        } else {
                                            handleAction('SUBMIT_WORK');
                                        }
                                    }}
                                    disabled={
                                        isProjectCompleted ||
                                        !isMyAssignedTask || 
                                        !isClaimed || 
                                        project.status === 'WAITING_CONFIRM'
                                    }
                                    className={`w-full py-2 rounded-xl font-bold text-base transition-colors shadow-sm text-white ${
                                        isProjectCompleted || !isMyAssignedTask || !isClaimed || project.status === 'WAITING_CONFIRM'
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-[#65C100] hover:bg-green-600'
                                    }`}
                                >
                                    ส่งงาน
                                </button>
                            </div>
                        </div>
                    );
                })()
            )}
    
            {/* --- Modal ป๊อปอัปเลือกผู้รับผิดชอบ Interior --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">

                        <h3 className="text-xl font-bold text-gray-900">
                            เลือกผู้รับผิดชอบ {selectedDept === 'Interior 3D' ? 'Interior 3D' : 'Interior'}
                        </h3>

                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {loadingMembers ? (
                                <p className="text-center text-sm text-gray-400 py-4">กำลังโหลดรายชื่อ...</p>
                            ) : members.length > 0 ? (
                                members.map((member, index) => {
                                    const mId = member.id_users || member.id_user || member.id || index;
                                    const mName = member.name || member.username;
                                    const isChecked = String(selectedMemberId) === String(mId);

                                    return (
                                        <label
                                            key={`member-${mId}-${index}`}
                                            className={`flex items-center space-x-3 p-4 border rounded-2xl cursor-pointer transition-all ${isChecked
                                                ? 'border-blue-600 bg-[#2563EB] text-white shadow-md'
                                                : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="interiorMember"
                                                value={mId}
                                                checked={isChecked}
                                                onChange={(e) => setSelectedMemberId(e.target.value)}
                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 accent-white"
                                            />
                                            <span className={`text-sm font-semibold ${isChecked ? 'text-white' : 'text-gray-800'}`}>
                                                {mName}
                                            </span>
                                        </label>
                                    );
                                })
                            ) : (
                                <p className="text-center text-sm text-gray-400 py-4">ไม่พบรายชื่อพนักงานในแผนกนี้</p>
                            )}
                        </div>

                        <div className="flex space-x-3 pt-2">
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    if (!selectedMemberName) {
                                        setSelectedDept('');
                                        setSelectedMemberId('');
                                    }
                                }}
                                className="flex-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleConfirmAssign}
                                disabled={!selectedMemberId}
                                className={`flex-1 py-2.5 rounded-xl font-bold transition-colors shadow-sm text-white ${!selectedMemberId ? 'bg-blue-300 cursor-not-allowed' : 'bg-[#188BFE] hover:bg-blue-600'
                                    }`}
                            >
                                ยืนยันการเลือก
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
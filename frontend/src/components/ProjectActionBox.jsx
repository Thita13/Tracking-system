import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Clock } from 'lucide-react';

export default function ProjectActionBox({ user, project, tracking = [], handleAction }) {
    if (!user || !project) return null;

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
        if (!selectedDept || selectedDept === 'Pricing') {
            setMembers([]);
            return;
        }

        const fetchMembersByDept = async () => {
            setLoadingMembers(true);
            try {
                const res = await fetch(`http://localhost:5000/users/by-role/${selectedDept}`);
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

        if (selectedDept === 'Interior' && !selectedMemberId) {
            setIsModalOpen(true);
            return;
        }

        handleAction('ASSIGN', {
            department: selectedDept,
            memberId: selectedDept === 'Interior' ? selectedMemberId : null
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

    return (
        <div className="bg-white p-6 rounded-3xl space-y-4 relative">

            {/* 1. รูปแบบสำหรับ ADMIN */}
            {isAdmin ? (
                <div className="space-y-4">
                    {!selectedMemberName ? (
                        <select
                            value={selectedDept}
                            onChange={(e) => {
                                const dept = e.target.value;
                                setSelectedDept(dept);
                                if (dept === 'Interior') {
                                    setIsModalOpen(true);
                                } else {
                                    setSelectedMemberId('');
                                    setSelectedMemberName('');
                                }
                            }}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none bg-white text-gray-700 focus:border-blue-500 cursor-pointer"
                        >
                            <option value="">เลือกแผนกที่ต้องการมอบหมายงาน</option>
                            <option value="Interior">Interior</option>
                            <option value="Pricing">Pricing</option>
                        </select>
                    ) : (
                        <div
                            onClick={() => setIsModalOpen(true)}
                            className="w-full border border-blue-500 bg-blue-50/60 rounded-lg p-2.5 text-sm text-blue-900 font-semibold cursor-pointer flex justify-between items-center hover:bg-blue-100 transition-colors shadow-sm"
                        >
                            <div className="flex items-center space-x-2">
                                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Interior</span>
                                <span>{selectedMemberName}</span>
                            </div>
                            <span className="text-xs text-blue-600 underline">เปลี่ยนคน</span>
                        </div>
                    )}

                    {selectedMemberName && (
                        <button
                            onClick={() => {
                                setSelectedDept('');
                                setSelectedMemberId('');
                                setSelectedMemberName('');
                            }}
                            className="text-xs text-gray-500 hover:text-red-600 transition-colors text-left block -mt-2"
                        >
                            ✕ ยกเลิกการเลือกแผนกนี้
                        </button>
                    )}

                    <button
                        onClick={handleAssignClick}
                        disabled={!selectedDept || (selectedDept === 'Interior' && !selectedMemberId)}
                        className={`w-full py-2.5 rounded-xl font-bold transition-colors shadow-sm text-white ${!selectedDept || (selectedDept === 'Interior' && !selectedMemberId)
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-[#188BFE] hover:bg-blue-600'
                            }`}
                    >
                        มอบหมายงาน
                    </button>

                    <button
                        onClick={() => handleAction('COMPLETE')}
                        className="w-full bg-[#22C55E] hover:bg-green-600 text-white py-2.5 rounded-xl font-bold transition-colors shadow-sm"
                    >
                        เสร็จสิ้นโครงการ
                    </button>
                </div>
            ) : isProjectDirector ? (

                /* 2. รูปแบบสำหรับ PROJECT DIRECTOR */
                <div className="space-y-4 -mt-4 -mb-4">
                    <div className="p-4 bg-[#FFEEDD] border border-[#FFD5B8] rounded-xl space-y-2.5">
                        <div>
                            <p className="text-sm font-bold text-gray-900">แก้ไขงาน</p>
                            <p className="text-xs text-gray-600">มอบหมายให้ดำเนินการแก้ไข</p>
                        </div>
                        <button
                            onClick={() => handleAction('REVISE')}
                            // เพิ่มการเช็ค project.status === 'DESIGN_3D' เพื่อล็อกปุ่ม
                            disabled={project.status === 'PRICING' || project.status === 'NEW' || project.status === 'DESIGN_3D'}
                            className={`w-full py-2 rounded-xl font-bold text-base transition-colors shadow-sm text-white ${project.status === 'PRICING' || project.status === 'NEW' || project.status === 'DESIGN_3D'
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#FF7A00] hover:bg-orange-600'
                                }`}
                        >
                            ส่งกลับให้แก้ไข
                        </button>
                    </div>

                    <div className="p-4 bg-[#E8F8EE] border border-[#BCEED0] rounded-xl space-y-2.5">
                        <div>
                            <p className="text-sm font-bold text-gray-900">ยืนยันงาน</p>
                            <p className="text-xs text-gray-600">มอบหมายให้ขั้นตอนถัดไป</p>
                        </div>

                        <button
                            onClick={() => handleAction('NEXT_STEP')}
                            // ล็อกปุ่มยืนยันงานเช่นกันเมื่ออยู่ในสถานะ DESIGN_3D หรือไม่ใช่ WAITING_CONFIRM
                            disabled={project.status !== 'WAITING_CONFIRM'}
                            className={`w-full py-2 rounded-xl font-bold text-base transition-colors shadow-sm text-white ${project.status !== 'WAITING_CONFIRM'
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#65C100] hover:bg-green-600'
                                }`}
                        >
                            ส่งไปขั้นตอนถัดไป
                        </button>
                    </div>
                </div>

            ) : (
                /* 3. รูปแบบสำหรับ ROLE อื่นๆ เช่น Interior หรือ Pricing */
                <div className="space-y-4 -mt-4 -mb-4">

                    {/* --- ปุ่มรับงาน --- */}
                    <div className="p-4 bg-[#EBF0FF] border border-[#D0E1FF] rounded-xl space-y-2.5">
                        <div>
                            <p className="text-sm font-bold text-gray-900">รับงาน</p>
                            <p className="text-xs text-gray-600">กดรับงานเพื่อเริ่มดำเนินการตามขั้นตอน</p>
                        </div>
                        <button
                            onClick={() => {
                                if (user.role === 'Pricing') {
                                    handleAction('CLAIM_PRICING');
                                } else {
                                    handleAction('START_WORK');
                                }
                            }}
                            disabled={
                                user.role === 'Pricing'
                                    ? (project.status !== 'PRICING' || Boolean(project.assign_to))
                                    : (!isMyAssignedTask || project.status !== 'NEW' && project.status !== 'DESIGN_3D')
                            }
                            className={`w-full py-2 rounded-xl font-bold text-base transition-colors shadow-sm text-white ${user.role === 'Pricing'
                                ? (project.status !== 'PRICING' || Boolean(project.assign_to)
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-amber-500 hover:bg-amber-600')
                                : (!isMyAssignedTask || (project.status !== 'NEW' && project.status !== 'DESIGN_3D')
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-amber-500 hover:bg-amber-600')
                                }`}
                        >
                            {user.role === 'Pricing'
                                ? (Boolean(project.assign_to) ? 'รับงานแล้ว' : 'รับงานนี้')
                                : (isMyAssignedTask && project.status !== 'NEW' && project.status !== 'DESIGN_3D' ? 'รับงานแล้ว' : 'รับงานนี้')}
                        </button>
                    </div>

                    {/* --- ปุ่มส่งงาน --- */}
                    <div className="p-4 bg-[#E8F8EE] border border-[#BCEED0] rounded-xl space-y-2.5">
                        <div>
                            <p className="text-sm font-bold text-gray-900">ส่งงาน</p>
                            <p className="text-xs text-gray-600">งานที่ได้รับมอบหมายดำเนินการเสร็จสิ้น</p>
                        </div>
                        <button
                            onClick={() => handleAction('SUBMIT_WORK')}
                            disabled={
                                user.role === 'Pricing'
                                    ? (!isMyAssignedTask || project.status !== 'PRICING' || project.status === 'WAITING_CONFIRM')
                                    : (!isMyAssignedTask || (project.status !== 'INTERIOR' && project.status !== 'DESIGN_3D') || project.status === 'WAITING_CONFIRM' || project.status === 'COMPLETED')
                            }
                            className={`w-full py-2 rounded-xl font-bold text-base transition-colors shadow-sm text-white ${user.role === 'Pricing'
                                ? (!isMyAssignedTask || project.status !== 'PRICING' || project.status === 'WAITING_CONFIRM'
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#65C100] hover:bg-green-600')
                                : (!isMyAssignedTask || (project.status !== 'INTERIOR' && project.status !== 'DESIGN_3D') || project.status === 'WAITING_CONFIRM' || project.status === 'COMPLETED'
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#65C100] hover:bg-green-600')
                                }`}
                        >
                            ส่งงาน
                        </button>
                    </div>
                </div>
            )}

            {/* --- Modal ป๊อปอัปเลือกผู้รับผิดชอบ Interior --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">

                        <h3 className="text-xl font-bold text-gray-900">
                            เลือกผู้รับผิดชอบ Interior
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
                                                : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-550'
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
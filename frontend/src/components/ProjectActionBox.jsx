import { useState } from 'react';

export default function ProjectActionBox({ user, project, handleAction }) {
    if (!user || !project) return null;

    // สถานะสำหรับเก็บค่าแผนกที่เลือกใน Dropdown (สำหรับ Admin / Project Director)
    const [selectedDept, setSelectedDept] = useState('');

    const isAdminOrDirector = user.role === 'Admin' || user.role === 'Project Director';

    return (
        <div className="bg-white p-6 rounded-3xl  space-y-4">

            {/* 1. รูปแบบสำหรับ ADMIN หรือ PROJECT DIRECTOR (รูปแรก) */}
            {isAdminOrDirector ? (
                <div className="space-y-4">
                    {/* Dropdown เลือกแผนก */}
                    <select 
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none bg-white text-gray-700 focus:border-blue-500"
                    >
                        <option value="">เลือกแผนกที่ต้องการมอบหมายงาน</option>
                        <option value="Interior">Interior</option>
                        <option value="Pricing">Pricing</option>
                    </select>

                    {/* ปุ่มมอบหมายงาน */}
                    <button 
                        onClick={() => handleAction('ASSIGN', selectedDept)}
                        className="w-full bg-[#188BFE] hover:bg-blue-600 text-white py-2.5 rounded-xl font-bold transition-colors shadow-sm"
                    >
                        มอบหมายงาน
                    </button>

                    {/* ปุ่มเสร็จสิ้นโครงการ */}
                    <button 
                        onClick={() => handleAction('COMPLETE')}
                        className="w-full bg-[#22C55E] hover:bg-green-600 text-white py-2.5 rounded-xl font-bold transition-colors shadow-sm"
                    >
                        เสร็จสิ้นโครงการ
                    </button>
                </div>
            ) : (
                /* 2. รูปแบบสำหรับ ROLE อื่นๆ เช่น Interior หรือ Pricing (รูปที่สอง) */
                <div className="space-y-4 -mt-4 -mb-4">
                    
                    {/* กล่องสีส้ม: แก้ไขงาน */}
                    <div className="p-4 bg-[#FFEEDD] border border-[#FFD5B8] rounded-xl space-y-2.5">
                        <div>
                            <p className="text-sm font-bold text-gray-900">แก้ไขงาน</p>
                            <p className="text-xs text-gray-600">มอบหมายให้ดำเนินการแก้ไข</p>
                        </div>
                        <button 
                            onClick={() => handleAction('REVISE')}
                            className="w-full bg-[#FF7A00] hover:bg-orange-600 text-white py-2 rounded-xl font-bold text-base transition-colors shadow-sm"
                        >
                            ส่งกลับให้แก้ไข
                        </button>
                    </div>

                    {/* กล่องสีเขียว: ยืนยันงาน */}
                    <div className="p-4 bg-[#E8F8EE] border border-[#BCEED0] rounded-xl space-y-2.5">
                        <div>
                            <p className="text-sm font-bold text-gray-900">ยืนยันงาน</p>
                            <p className="text-xs text-gray-600">มอบหมายให้ขั้นตอนถัดไป</p>
                        </div>
                        <button 
                            onClick={() => handleAction('NEXT_STEP')}
                            className="w-full bg-[#65C100] hover:bg-green-600 text-white  py-2 rounded-xl font-bold text-base transition-colors shadow-sm"
                        >
                            ส่งไปขั้นตอนถัดไป
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}